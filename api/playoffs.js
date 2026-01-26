const { fetchSportsDataPlayoffs } = require('./_lib/sportsdata');
const { extractStandings, fetchEspnStandings, getDefaultSeason } = require('./_lib/standings');

const ROUND_WEEKS = [
  { name: 'wildCard', week: 1, points: 1.5 },
  { name: 'divisional', week: 2, points: 2.5 },
  { name: 'conference', week: 3, points: 3.5 },
  { name: 'superBowl', week: 4, points: 5 },
];

async function fetchScoreboardData(season, week) {
  const params = `seasontype=3&season=${season}&week=${week}&region=us&lang=en&contentorigin=espn`;
  const urls = [
    `https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?${params}`,
    `https://site.api.espn.com/apis/v2/sports/football/nfl/scoreboard?${params}`,
    `https://cdn.espn.com/core/nfl/scoreboard?xhr=1&${params}`,
  ];
  const headers = {
    accept: 'application/json, text/plain, */*',
    'user-agent': 'Mozilla/5.0',
    referer: 'https://www.espn.com/',
  };

  for (const url of urls) {
    const response = await fetch(url, { headers });
    if (!response.ok) continue;
    const text = await response.text();
    try {
      const data = JSON.parse(text);
      if (data && Array.isArray(data?.events)) return data;
      if (data?.content && Array.isArray(data?.content?.events)) {
        return data.content;
      }
    } catch {
      // continue
    }
  }

  return null;
}

function mapPlayoffGames(data) {
  const events = Array.isArray(data?.events) ? data.events : [];
  return events
    .map((event) => {
      const competition = Array.isArray(event?.competitions)
        ? event.competitions[0]
        : null;
      const competitors = Array.isArray(competition?.competitors)
        ? competition.competitors
        : [];
      const home = competitors.find((team) => team?.homeAway === 'home');
      const away = competitors.find((team) => team?.homeAway === 'away');
      const homeName =
        home?.team?.displayName || home?.team?.name || home?.team?.shortDisplayName;
      const awayName =
        away?.team?.displayName || away?.team?.name || away?.team?.shortDisplayName;
      const completed = Boolean(competition?.status?.type?.completed);

      if (!homeName || !awayName || !completed) return null;

      const winner =
        competitors.find((team) => team?.winner === true) ??
        competitors.reduce((best, team) => {
          if (!best) return team;
          const bestScore = Number(best?.score ?? 0);
          const teamScore = Number(team?.score ?? 0);
          return teamScore > bestScore ? team : best;
        }, null);

      const winnerName =
        winner?.team?.displayName ||
        winner?.team?.name ||
        winner?.team?.shortDisplayName ||
        null;

      return {
        homeTeamName: homeName,
        awayTeamName: awayName,
        winnerName,
      };
    })
    .filter(Boolean);
}

module.exports = async (req, res) => {
  try {
    const season = req.query.season ?? getDefaultSeason();
    const sportsData = await fetchSportsDataPlayoffs(season);

    if (sportsData) {
      res.json({
        season: Number(season),
        updatedAt: new Date().toISOString(),
        source: 'sportsdataio',
        hasSportsDataKey: Boolean(process.env.SPORTSDATAIO_API_KEY),
        rounds: ROUND_WEEKS,
        playoffWins: sportsData.playoffWins,
        wildcardByes: sportsData.wildcardByes,
      });
      return;
    }

    const standingsData = await fetchEspnStandings(season);
    const standingsTeams = standingsData ? extractStandings(standingsData) : {};
    const wildcardParticipants = new Set();
    const playoffWins = {};

    for (const round of ROUND_WEEKS) {
      const data = await fetchScoreboardData(season, round.week);
      if (!data) continue;
      const games = mapPlayoffGames(data);
      games.forEach((game) => {
        if (round.name === 'wildCard') {
          wildcardParticipants.add(game.homeTeamName);
          wildcardParticipants.add(game.awayTeamName);
        }
        if (!game.winnerName) return;
        const record = playoffWins[game.winnerName] || {
          wildCard: 0,
          divisional: 0,
          conference: 0,
          superBowl: 0,
        };
        record[round.name] += 1;
        playoffWins[game.winnerName] = record;
      });
    }

    const wildcardByes = {};
    Object.values(standingsTeams).forEach((team) => {
      if (team.seed === 1 && team.name && !wildcardParticipants.has(team.name)) {
        wildcardByes[team.name] = true;
      }
    });

    res.json({
      season: Number(season),
      updatedAt: new Date().toISOString(),
      source: 'espn-fallback',
      hasSportsDataKey: Boolean(process.env.SPORTSDATAIO_API_KEY),
      rounds: ROUND_WEEKS,
      playoffWins,
      wildcardByes,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};
