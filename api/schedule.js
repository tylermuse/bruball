const { fetchSportsDataSchedule } = require('./_lib/sportsdata');
const { getDefaultSeason } = require('./_lib/standings');
const {
  applyManualConferenceWinners,
  applyManualSuperBowlWinner,
  getManualPostseasonSchedule,
} = require('./_lib/manualOverrides');

const ESPN_HEADERS = {
  accept: 'application/json, text/plain, */*',
  'user-agent': 'Mozilla/5.0',
  referer: 'https://www.espn.com/',
};

/**
 * Shared by both ESPN sources below — site.api.espn.com and cdn.espn.com
 * serve the same event/competition/competitor shape for scoreboard events.
 */
function mapEspnEventToGame(event, pointsAtStake) {
  const competition = Array.isArray(event?.competitions) ? event.competitions[0] : null;
  const competitors = Array.isArray(competition?.competitors) ? competition.competitors : [];
  const home = competitors.find((team) => team?.homeAway === 'home');
  const away = competitors.find((team) => team?.homeAway === 'away');
  const homeName = home?.team?.displayName || home?.team?.name || home?.team?.shortDisplayName;
  const awayName = away?.team?.displayName || away?.team?.name || away?.team?.shortDisplayName;
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
    winner?.team?.displayName || winner?.team?.name || winner?.team?.shortDisplayName || null;

  if (!homeName || !awayName || !date || !id) return null;

  return {
    id,
    date,
    homeTeamName: homeName,
    awayTeamName: awayName,
    pointsAtStake,
    completed,
    winnerName,
  };
}

/**
 * The scoreboard endpoint reports season type inconsistently — sometimes a
 * bare number (2), sometimes `{ id: 2 }` — depending on the exact route hit.
 * Normalize both to a plain number.
 */
function normalizeSeasonType(value) {
  if (value && typeof value === 'object') return value.id ?? null;
  return value ?? null;
}

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
  const seasonTypeId = normalizeSeasonType(data?.season?.type);
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
      seasonType = normalizeSeasonType(scheduleData?.season?.type) ?? seasonType;
      weekNumber = scheduleData?.week?.number ?? weekNumber;
    }
  }

  const normalizedSchedule = scheduleData?.content?.events
    ? scheduleData.content
    : scheduleData;
  seasonType =
    normalizeSeasonType(normalizedSchedule?.season?.type) ?? requestedSeasonTypeId ?? seasonType;
  weekNumber = normalizedSchedule?.week?.number ?? requestedWeek ?? weekNumber;
  weekLabel = normalizedSchedule?.week?.text ?? weekLabel;

  if (phase && phase !== 'current' && typeof requestedWeek === 'number') {
    if (phase === 'postseason') {
      weekLabel = postseasonLabelForWeek(requestedWeek);
      weekNumber = requestedWeek;
    } else {
      weekLabel = `Week ${requestedWeek}`;
      weekNumber = requestedWeek;
    }
  }

  // ESPN's default (no explicit week requested) scoreboard response never
  // includes week.text, so build a label ourselves rather than ship `null`.
  if (!weekLabel && typeof weekNumber === 'number') {
    weekLabel = seasonType === 3 ? postseasonLabelForWeek(weekNumber) : `Week ${weekNumber}`;
  }

  const events = Array.isArray(normalizedSchedule?.events)
    ? normalizedSchedule.events
    : [];
  const roundPoints =
    phase === 'postseason' && typeof requestedWeek === 'number'
      ? postseasonPointsForWeek(requestedWeek)
      : getRoundPoints(weekLabel, seasonType, weekNumber);

  const games = events.map((event) => mapEspnEventToGame(event, roundPoints)).filter(Boolean);
  const resolvedSeason = normalizedSchedule?.season?.year ?? season ?? null;

  return {
    season: resolvedSeason,
    week: weekNumber,
    weekLabel,
    seasonType,
    games: applyManualSuperBowlWinner(
      applyManualConferenceWinners(games, seasonType, weekNumber, weekLabel, resolvedSeason),
      seasonType,
      weekNumber,
      weekLabel,
      resolvedSeason,
    ),
  };
}

/**
 * Fallback ESPN source used when fetchEspnSchedule comes back empty (e.g.
 * site.api.espn.com is unreachable or blocked for a given request). Unlike
 * the standings endpoint's cdn fallback, this one keeps the same
 * event/competition shape, so it reuses mapEspnEventToGame directly.
 */
async function fetchEspnScoreboardCdn(phase, weekParam) {
  const defaultSeason = getDefaultSeason();
  const seasonTypeId = phase === 'postseason' ? 3 : 2;

  const params = new URLSearchParams();
  if (typeof weekParam === 'number') {
    params.set('year', String(defaultSeason));
    params.set('week', String(weekParam));
    params.set('seasontype', String(seasonTypeId));
  }
  const query = params.toString();
  const url = `https://cdn.espn.com/core/nfl/scoreboard?xhr=1${query ? `&${query}` : ''}`;

  const response = await fetch(url, { headers: ESPN_HEADERS });
  if (!response.ok) return null;

  const data = await response.json().catch(() => null);
  const sbData = data?.content?.sbData;
  if (!sbData || !Array.isArray(sbData.events)) return null;

  const season = sbData?.season?.year ?? defaultSeason ?? null;
  const weekNumber = typeof weekParam === 'number' ? weekParam : sbData?.week?.number ?? null;
  const seasonType = seasonTypeId ?? sbData?.season?.type ?? null;
  const weekLabel =
    phase === 'postseason' && typeof weekNumber === 'number'
      ? postseasonLabelForWeek(weekNumber)
      : typeof weekNumber === 'number'
        ? `Week ${weekNumber}`
        : null;

  const roundPoints =
    phase === 'postseason' && typeof weekNumber === 'number'
      ? postseasonPointsForWeek(weekNumber)
      : getRoundPoints(weekLabel, seasonType, weekNumber);

  const games = sbData.events.map((event) => mapEspnEventToGame(event, roundPoints)).filter(Boolean);

  return {
    season,
    week: weekNumber,
    weekLabel,
    seasonType,
    games: applyManualSuperBowlWinner(
      applyManualConferenceWinners(games, seasonType, weekNumber, weekLabel, season),
      seasonType,
      weekNumber,
      weekLabel,
      season,
    ),
  };
}

function postseasonLabelForWeek(week) {
  if (week === 1) return 'Wild Card';
  if (week === 2) return 'Divisional Round';
  if (week === 3) return 'Conference Round';
  if (week === 4) return 'Super Bowl';
  return `Week ${week}`;
}

function postseasonPointsForWeek(week) {
  if (week === 1) return 1.5;
  if (week === 2) return 2.5;
  if (week === 3) return 3.5;
  if (week === 4) return 5;
  return 1;
}

function getRoundPoints(weekLabel, seasonType, weekNumber) {
  const label = (weekLabel || '').toLowerCase();
  if (label.includes('super bowl')) {
    return 5;
  }
  if (label.includes('conference')) {
    return 3.5;
  }
  if (label.includes('divisional')) {
    return 2.5;
  }
  if (label.includes('wild card') || label.includes('wildcard')) {
    return 1.5;
  }
  if (seasonType === 3) {
    if (typeof weekNumber === 'number') {
      if (weekNumber === 1) return 1.5;
      if (weekNumber === 2) return 2.5;
      if (weekNumber === 3) return 3.5;
      if (weekNumber === 4) return 5;
    }
    return 1.5;
  }
  return 1;
}

module.exports = async (req, res) => {
  try {
    const phase = req.query.phase;
    const parsedWeek = req.query.week ? Number(req.query.week) : null;
    const weekParam = Number.isFinite(parsedWeek) ? parsedWeek : null;
    if (phase === 'postseason' && typeof weekParam === 'number') {
      const manualGames = getManualPostseasonSchedule(weekParam, getDefaultSeason());
      if (manualGames) {
        res.json({
          season: getDefaultSeason(),
          week: weekParam,
          weekLabel: postseasonLabelForWeek(weekParam),
          seasonType: 3,
          games: manualGames,
        });
        return;
      }
    }
    const sportsDataSchedule = await fetchSportsDataSchedule(phase, weekParam);
    if (sportsDataSchedule) {
      res.json({
        ...sportsDataSchedule,
        games: applyManualSuperBowlWinner(
          applyManualConferenceWinners(
            sportsDataSchedule.games,
            sportsDataSchedule.seasonType,
            sportsDataSchedule.week,
            sportsDataSchedule.weekLabel,
            sportsDataSchedule.season,
          ),
          sportsDataSchedule.seasonType,
          sportsDataSchedule.week,
          sportsDataSchedule.weekLabel,
          sportsDataSchedule.season,
        ),
      });
      return;
    }

    let fallback = await fetchEspnSchedule(phase, weekParam);
    if (!fallback || fallback.games.length === 0) {
      const cdnFallback = await fetchEspnScoreboardCdn(phase, weekParam);
      if (cdnFallback && cdnFallback.games.length > 0) {
        fallback = cdnFallback;
      }
    }
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
