const { getDefaultSeason } = require('./standings');

function isSportsDataFinal(game) {
  const status = String(game?.Status || '').toLowerCase();
  if (game?.IsOver === true) return true;
  if (status === 'final' || status === 'f') return true;
  if (status.includes('final')) return true;
  return false;
}

async function fetchSportsDataJson(url) {
  const response = await fetch(url);
  if (!response.ok) return null;
  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function fetchSportsDataStandings(season, apiKey) {
  const seasonOptions = [`${season}`, `${season}REG`];
  for (const seasonValue of seasonOptions) {
    const url = `https://api.sportsdata.io/v3/nfl/scores/json/Standings/${seasonValue}?key=${apiKey}`;
    const data = await fetchSportsDataJson(url);
    if (Array.isArray(data) && data.length > 0) return data;
  }
  return null;
}

async function fetchSportsDataScoresByWeek(seasonValue, week, apiKey) {
  const url = `https://api.sportsdata.io/v3/nfl/scores/json/ScoresByWeek/${seasonValue}/${week}?key=${apiKey}`;
  const data = await fetchSportsDataJson(url);
  return Array.isArray(data) ? data : [];
}

function buildAbbrToName(standings) {
  const abbrToName = {};
  standings.forEach((team) => {
    const abbr = team?.Team || team?.Abbreviation;
    const city = team?.City;
    const nickname = team?.Name;
    const fullName = city && nickname ? `${city} ${nickname}` : team?.Name;
    const displayName = team?.FullName || team?.TeamName || fullName;
    if (abbr && displayName) {
      abbrToName[abbr] = displayName;
    }
  });
  return abbrToName;
}

function buildWildcardByes(standings) {
  const wildcardByes = {};
  standings.forEach((team) => {
    const city = team?.City;
    const nickname = team?.Name;
    const fullName = city && nickname ? `${city} ${nickname}` : team?.Name;
    const displayName = team?.FullName || team?.TeamName || fullName;
    const seed = team?.PlayoffSeed ?? team?.Seed ?? team?.ConferenceSeed;
    if (seed === 1 && displayName) {
      wildcardByes[displayName] = true;
    }
  });
  return wildcardByes;
}

function postseasonPointsForWeek(week) {
  if (week === 1) return 1.5;
  if (week === 2) return 2.5;
  if (week === 3) return 3.5;
  if (week === 4) return 5;
  return 1;
}

function postseasonLabelForWeek(week) {
  if (week === 1) return 'Wild Card';
  if (week === 2) return 'Divisional Round';
  if (week === 3) return 'Conference Round';
  if (week === 4) return 'Super Bowl';
  return `Week ${week}`;
}

async function findCurrentPostseasonWeek(season, apiKey) {
  const now = new Date();
  const windowStart = new Date(now);
  windowStart.setDate(now.getDate() - 5);
  const windowEnd = new Date(now);
  windowEnd.setDate(now.getDate() + 7);

  const seasonValue = `${season}POST`;
  const rounds = [
    { week: 1, label: 'Wild Card', pointsAtStake: 1.5 },
    { week: 2, label: 'Divisional Round', pointsAtStake: 2.5 },
    { week: 3, label: 'Conference Round', pointsAtStake: 3.5 },
    { week: 4, label: 'Super Bowl', pointsAtStake: 5 },
  ];

  for (const round of rounds) {
    const games = await fetchSportsDataScoresByWeek(seasonValue, round.week, apiKey);
    const inWindow = games.some((game) => {
      const dateValue = game?.Date;
      if (!dateValue) return false;
      const date = new Date(dateValue);
      return date >= windowStart && date <= windowEnd;
    });
    if (inWindow) {
      return { ...round, seasonValue };
    }
  }

  return null;
}

async function fetchSportsDataScheduleByWeek(season, week, phase, apiKey) {
  const standings = await fetchSportsDataStandings(season, apiKey);
  if (!standings) return null;
  const abbrToName = buildAbbrToName(standings);

  const isPostseason = phase === 'postseason';
  const seasonValues = isPostseason
    ? [`${season}POST`]
    : [`${season}`, `${season}REG`];
  const pointsAtStake = isPostseason ? postseasonPointsForWeek(week) : 1;
  const weekLabel = isPostseason ? postseasonLabelForWeek(week) : `Week ${week}`;

  for (const seasonValue of seasonValues) {
    const games = await fetchSportsDataScoresByWeek(seasonValue, week, apiKey);
    const mappedGames = games
      .map((game) => mapSportsDataGame(game, abbrToName, pointsAtStake))
      .filter(Boolean);
    if (mappedGames.length > 0) {
      return {
        season: Number(season),
        week,
        weekLabel,
        seasonType: isPostseason ? 3 : 2,
        games: mappedGames,
      };
    }
  }

  return {
    season: Number(season),
    week,
    weekLabel,
    seasonType: isPostseason ? 3 : 2,
    games: [],
  };
}

function mapSportsDataGame(game, abbrToName, pointsAtStake) {
  const homeAbbr = game?.HomeTeam;
  const awayAbbr = game?.AwayTeam;
  const homeName = abbrToName[homeAbbr] || homeAbbr;
  const awayName = abbrToName[awayAbbr] || awayAbbr;
  const date = game?.Date;
  const id = game?.GameKey || game?.GameID;

  if (!homeName || !awayName || !date || !id) return null;

  const completed = isSportsDataFinal(game);
  let winnerName = null;
  if (completed) {
    const winnerAbbr = game?.Winner;
    if (winnerAbbr) {
      winnerName = abbrToName[winnerAbbr] || winnerAbbr;
    } else if (
      typeof game?.HomeScore === 'number' &&
      typeof game?.AwayScore === 'number'
    ) {
      winnerName =
        game.HomeScore > game.AwayScore
          ? homeName
          : game.AwayScore > game.HomeScore
            ? awayName
            : null;
    }
  }

  return {
    id: String(id),
    date,
    homeTeamName: homeName,
    awayTeamName: awayName,
    pointsAtStake,
    completed,
    winnerName,
  };
}

async function fetchSportsDataSchedule(phase, weekParam) {
  const apiKey = process.env.SPORTSDATAIO_API_KEY;
  if (!apiKey) return null;

  const season = getDefaultSeason();

  if (phase === 'regular' && weekParam) {
    return fetchSportsDataScheduleByWeek(season, weekParam, 'regular', apiKey);
  }

  if (phase === 'postseason' && weekParam) {
    return fetchSportsDataScheduleByWeek(season, weekParam, 'postseason', apiKey);
  }

  const standings = await fetchSportsDataStandings(season, apiKey);
  if (!standings) return null;
  const abbrToName = buildAbbrToName(standings);

  const postseasonWeek = await findCurrentPostseasonWeek(season, apiKey);
  if (!postseasonWeek) return null;

  const games = await fetchSportsDataScoresByWeek(
    postseasonWeek.seasonValue,
    postseasonWeek.week,
    apiKey,
  );
  const mappedGames = games
    .map((game) => mapSportsDataGame(game, abbrToName, postseasonWeek.pointsAtStake))
    .filter(Boolean);

  if (mappedGames.length === 0) return null;

  return {
    season: Number(season),
    week: postseasonWeek.week,
    weekLabel: postseasonWeek.label,
    seasonType: 3,
    games: mappedGames,
  };
}

async function fetchSportsDataPlayoffs(season) {
  const apiKey = process.env.SPORTSDATAIO_API_KEY;
  if (!apiKey) return null;

  const standings = await fetchSportsDataStandings(season, apiKey);
  if (!standings) return null;

  const abbrToName = buildAbbrToName(standings);
  const wildcardByes = buildWildcardByes(standings);

  const playoffWins = {};
  const seasonPost = `${season}POST`;
  const rounds = [
    { name: 'wildCard', week: 1 },
    { name: 'divisional', week: 2 },
    { name: 'conference', week: 3 },
    { name: 'superBowl', week: 4 },
  ];

  for (const round of rounds) {
    const games = await fetchSportsDataScoresByWeek(seasonPost, round.week, apiKey);
    games.forEach((game) => {
      if (!isSportsDataFinal(game)) return;
      const winnerAbbr = game?.Winner || null;
      const homeAbbr = game?.HomeTeam || null;
      const awayAbbr = game?.AwayTeam || null;

      let winnerName = null;
      if (winnerAbbr) {
        winnerName = abbrToName[winnerAbbr] || winnerAbbr;
      } else if (
        typeof game?.HomeScore === 'number' &&
        typeof game?.AwayScore === 'number'
      ) {
        if (game.HomeScore > game.AwayScore) {
          winnerName = abbrToName[homeAbbr] || homeAbbr;
        } else if (game.AwayScore > game.HomeScore) {
          winnerName = abbrToName[awayAbbr] || awayAbbr;
        }
      }

      if (!winnerName) return;

      const record = playoffWins[winnerName] || {
        wildCard: 0,
        divisional: 0,
        conference: 0,
        superBowl: 0,
      };
      record[round.name] += 1;
      playoffWins[winnerName] = record;
    });
  }

  return { playoffWins, wildcardByes };
}

module.exports = {
  fetchSportsDataPlayoffs,
  fetchSportsDataSchedule,
};
