const { fetchSportsDataSchedule } = require('./_lib/sportsdata');
const { getDefaultSeason } = require('./_lib/standings');

async function fetchEspnSchedule(phase, weekParam) {
  const baseUrl = 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard';
  const headers = {
    accept: 'application/json, text/plain, */*',
    'user-agent': 'Mozilla/5.0',
    referer: 'https://www.espn.com/',
  };

  const defaultSeason = getDefaultSeason();
  const response = await fetch(baseUrl, { headers });
  const data = response.ok ? await response.json() : null;

  const season = data?.season?.year ?? defaultSeason ?? null;
  const seasonTypeId = data?.season?.type?.id ?? null;
  const week = data?.week?.number ?? null;
  const requestedSeasonTypeId =
    phase === 'postseason' ? 3 : phase === 'regular' ? 2 : seasonTypeId;
  const requestedWeek = typeof weekParam === 'number' ? weekParam : week ?? null;

  let scheduleData = data;
  let weekLabel = data?.week?.text ?? null;
  let seasonType = seasonTypeId;
  let weekNumber = week;

  if (season && typeof requestedWeek === 'number') {
    const seasonTypeParam = requestedSeasonTypeId
      ? `&seasontype=${requestedSeasonTypeId}`
      : '';
    const weekUrl = `${baseUrl}?season=${season}${seasonTypeParam}&week=${requestedWeek}`;
    const weekResponse = await fetch(weekUrl, { headers });
    if (weekResponse.ok) {
      scheduleData = await weekResponse.json();
      weekLabel = scheduleData?.week?.text ?? weekLabel;
      seasonType = scheduleData?.season?.type?.id ?? seasonType;
      weekNumber = scheduleData?.week?.number ?? weekNumber;
    }
  }

  const normalizedSchedule = scheduleData?.content?.events
    ? scheduleData.content
    : scheduleData;
  seasonType =
    normalizedSchedule?.season?.type?.id ?? requestedSeasonTypeId ?? seasonType;
  weekNumber = normalizedSchedule?.week?.number ?? requestedWeek ?? weekNumber;
  weekLabel = normalizedSchedule?.week?.text ?? weekLabel;

  if (phase && phase !== 'current' && typeof requestedWeek === 'number') {
    weekLabel = phase === 'postseason' ? weekLabel : `Week ${requestedWeek}`;
  }

  const events = Array.isArray(normalizedSchedule?.events)
    ? normalizedSchedule.events
    : [];
  const roundPoints = getRoundPoints(weekLabel, seasonType, weekNumber);

  const games = events
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
      const date = event?.date || competition?.date;
      const id = event?.id || competition?.id;
      const completed = Boolean(competition?.status?.type?.completed);

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

      if (!homeName || !awayName || !date || !id) {
        return null;
      }

      return {
        id,
        date,
        homeTeamName: homeName,
        awayTeamName: awayName,
        pointsAtStake: roundPoints,
        completed,
        winnerName,
      };
    })
    .filter(Boolean);

  return {
    season: normalizedSchedule?.season?.year ?? season ?? null,
    week: weekNumber,
    weekLabel,
    seasonType,
    games,
  };
}

function postseasonLabelForWeek(week) {
  if (week === 1) return 'Wild Card';
  if (week === 2) return 'Divisional Round';
  if (week === 3) return 'Conference Round';
  if (week === 4) return 'Super Bowl';
  return `Week ${week}`;
}

function getRoundPoints(weekLabel, seasonType, weekNumber) {
  const label = (weekLabel || '').toLowerCase();
  if (seasonType === 3 || label.includes('wild card') || label.includes('wildcard')) {
    if (typeof weekNumber === 'number') {
      if (weekNumber === 1) return 1.5;
      if (weekNumber === 2) return 2.5;
      if (weekNumber === 3) return 3.5;
      if (weekNumber === 4) return 5;
    }
    return 1.5;
  }
  if (label.includes('divisional')) {
    return 2.5;
  }
  if (label.includes('conference')) {
    return 3.5;
  }
  if (label.includes('super bowl')) {
    return 5;
  }
  return 1;
}

module.exports = async (req, res) => {
  try {
    const phase = req.query.phase;
    const parsedWeek = req.query.week ? Number(req.query.week) : null;
    const weekParam = Number.isFinite(parsedWeek) ? parsedWeek : null;
    const sportsDataSchedule = await fetchSportsDataSchedule(phase, weekParam);
    if (sportsDataSchedule) {
      res.json(sportsDataSchedule);
      return;
    }

    const fallback = await fetchEspnSchedule(phase, weekParam);
    if (!fallback) {
      res.status(502).json({ error: 'Upstream error' });
      return;
    }

    res.json(fallback);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};
