const { fetchSportsDataPlayoffs } = require('./_lib/sportsdata');
const { extractStandings, fetchEspnStandings, getDefaultSeason } = require('./_lib/standings');

async function fetchEspnScoreboard(season, week) {
  const url = `https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?seasontype=3&season=${season}&week=${week}`;
  const response = await fetch(url, {
    headers: {
      accept: 'application/json, text/plain, */*',
      'user-agent': 'Mozilla/5.0',
      referer: 'https://www.espn.com/',
    },
  });
  if (!response.ok) return [];
  const data = await response.json();
  return Array.isArray(data?.events) ? data.events : [];
}

function buildPlayoffWinsFromEspn(season, standingsTeams, roundWeeks) {
  const playoffWins = {};
  const wildcardParticipants = new Set();

  const addWin = (winnerName, roundName) => {
    if (!winnerName) return;
    const record = playoffWins[winnerName] || {
      wildCard: 0,
      divisional: 0,
      conference: 0,
      superBowl: 0,
    };
    record[roundName] += 1;
    playoffWins[winnerName] = record;
  };

  return Promise.all(
    roundWeeks.map(async (round) => {
      const events = await fetchEspnScoreboard(season, round.week);
      events.forEach((event) => {
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

        if (!homeName || !awayName) return;
        if (round.name === 'wildCard') {
          wildcardParticipants.add(homeName);
          wildcardParticipants.add(awayName);
        }
        if (!completed) return;

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

        addWin(winnerName, round.name);
      });
    }),
  ).then(() => {
    const wildcardByes = {};
    Object.values(standingsTeams).forEach((team) => {
      if (team.seed === 1 && team.name && !wildcardParticipants.has(team.name)) {
        wildcardByes[team.name] = true;
      }
    });

    return { playoffWins, wildcardByes };
  });
}

module.exports = async (req, res) => {
  try {
    const season = req.query.season ?? getDefaultSeason();
    const forceRefresh = req.query.refresh === '1' || req.query.refresh === 'true';
    const sportsData = await fetchSportsDataPlayoffs(season, forceRefresh);

    if (!sportsData) {
      const standingsData = await fetchEspnStandings(season);
      const standingsTeams = standingsData ? extractStandings(standingsData) : {};
      const rounds = [
        { name: 'wildCard', week: 1, points: 1.5 },
        { name: 'divisional', week: 2, points: 2.5 },
        { name: 'conference', week: 3, points: 3.5 },
        { name: 'superBowl', week: 4, points: 5 },
      ];
      const fallback = await buildPlayoffWinsFromEspn(season, standingsTeams, rounds);
      res.json({
        season: Number(season),
        updatedAt: new Date().toISOString(),
        source: 'espn-fallback',
        hasSportsDataKey: Boolean(process.env.SPORTSDATAIO_API_KEY),
        rounds,
        playoffWins: fallback.playoffWins,
        wildcardByes: fallback.wildcardByes,
      });
      return;
    }

    res.json({
      season: Number(season),
      updatedAt: new Date().toISOString(),
      source: 'sportsdataio',
      hasSportsDataKey: Boolean(process.env.SPORTSDATAIO_API_KEY),
      rounds: [
        { name: 'wildCard', week: 1, points: 1.5 },
        { name: 'divisional', week: 2, points: 2.5 },
        { name: 'conference', week: 3, points: 3.5 },
        { name: 'superBowl', week: 4, points: 5 },
      ],
      playoffWins: sportsData.playoffWins,
      wildcardByes: sportsData.wildcardByes,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};
