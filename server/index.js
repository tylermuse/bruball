import express from "express";

const app = express();
const PORT = process.env.PORT || 5050;
const SERVER_VERSION = "standings-debug-v3";
const MANUAL_CONFERENCE_WINNERS = ["New England Patriots", "Seattle Seahawks"];

function applyManualConferenceWinners(games, seasonType, weekNumber, weekLabel) {
  const isConferenceRound =
    seasonType === 3 &&
    (weekNumber === 3 ||
      String(weekLabel || "").toLowerCase().includes("conference"));
  if (!isConferenceRound) return games;

  return games.map((game) => {
    if (game.winnerName) return game;
    const winner = MANUAL_CONFERENCE_WINNERS.find((team) => {
      return team === game.homeTeamName || team === game.awayTeamName;
    });
    if (!winner) return game;
    return { ...game, winnerName: winner, completed: true };
  });
}

function applyManualPlayoffOverrides(playoffWins) {
  const next = { ...(playoffWins ?? {}) };
  MANUAL_CONFERENCE_WINNERS.forEach((teamName) => {
    const current = next[teamName] ?? {
      wildCard: 0,
      divisional: 0,
      conference: 0,
      superBowl: 0,
    };
    next[teamName] = {
      ...current,
      conference: Math.max(current.conference ?? 0, 1),
    };
  });
  return next;
}

function getDefaultSeason() {
  const now = new Date();
  const month = now.getMonth() + 1;
  return month < 8 ? now.getFullYear() - 1 : now.getFullYear();
}

function getDefaultSeason() {
  const now = new Date();
  const month = now.getMonth() + 1;
  return month < 8 ? now.getFullYear() - 1 : now.getFullYear();
}

app.get("/api/ping", (req, res) => {
  res.json({
    ok: true,
    version: SERVER_VERSION,
    cwd: process.cwd(),
    time: new Date().toISOString(),
  });
});

app.get("/api/standings", async (req, res) => {
  try {
    res.set("Cache-Control", "no-store");
    const now = new Date();
    const month = now.getMonth() + 1; // 1–12
    const defaultSeason =
      month < 8 ? now.getFullYear() - 1 : now.getFullYear();

    const season = req.query.season ?? defaultSeason;

    const baseParams = `season=${season}&seasontype=2&region=us&lang=en&contentorigin=espn`;
    const urls = [
      `https://site.api.espn.com/apis/site/v2/sports/football/nfl/standings?${baseParams}`,
      `https://site.api.espn.com/apis/v2/sports/football/nfl/standings?${baseParams}`,
      `https://cdn.espn.com/core/nfl/standings?xhr=1&region=us&lang=en`,
    ];

    const headers = {
      "accept": "application/json, text/plain, */*",
      "user-agent": "Mozilla/5.0",
      "referer": "https://www.espn.com/",
    };

    const attempts = [];
    let lastData = null;
    let goodData = null;

    for (const url of urls) {
      const r = await fetch(url, { headers });
      const contentType = r.headers.get("content-type") ?? "";
      const text = await r.text();
      let data = null;

      try {
        data = JSON.parse(text);
      } catch {
        data = null;
      }

      attempts.push({
        url,
        status: r.status,
        contentType,
        snippet: text.slice(0, 400),
      });

      lastData = data;

      const looksLite =
        data &&
        typeof data === "object" &&
        "fullViewLink" in data &&
        !("children" in data) &&
        !("standings" in data) &&
        !("leagues" in data) &&
        !("entries" in data);

      if (r.ok && data && !looksLite && !goodData) {
        goodData = data;
      }
    }

    if (req.query.debug) {
      return res.json({
        dataKeys: lastData ? Object.keys(lastData) : [],
        goodDataKeys: goodData ? Object.keys(goodData) : [],
        attempts,
      });
    }

    if (goodData) {
      if (req.query.inspect) {
        return res.json(summarizeStandingsShape(goodData));
      }
      const teams = extractStandings(goodData);
      return res.json({
        season: Number(season),
        updatedAt: new Date().toISOString(),
        teams,
      });
    }

    return res.status(502).json({
      error: "Upstream error",
      attempts: attempts.map(({ url, status }) => ({ url, status })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/schedule", async (req, res) => {
  try {
    res.set("Cache-Control", "no-store");
    const phase = req.query.phase;
    const parsedWeek = req.query.week ? Number(req.query.week) : null;
    const weekParam = Number.isFinite(parsedWeek) ? parsedWeek : null;
    const sportsDataSchedule = await fetchSportsDataSchedule(phase, weekParam);
    if (sportsDataSchedule) {
      return res.json({
        ...sportsDataSchedule,
        games: applyManualConferenceWinners(
          sportsDataSchedule.games,
          sportsDataSchedule.seasonType,
          sportsDataSchedule.week,
          sportsDataSchedule.weekLabel,
        ),
      });
    }

    const baseUrl =
      "https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard";
    const r = await fetch(baseUrl, {
      headers: {
        "accept": "application/json, text/plain, */*",
        "user-agent": "Mozilla/5.0",
        "referer": "https://www.espn.com/",
      },
    });

    if (!r.ok) {
      return res.status(502).json({ error: "Upstream error", status: r.status });
    }

    const data = await r.json();
    const season = data?.season?.year ?? getDefaultSeason();
    const week = data?.week?.number ?? null;
    const seasonTypeId = data?.season?.type?.id ?? null;
    const requestedSeasonTypeId =
      phase === "postseason" ? 3 : phase === "regular" ? 2 : seasonTypeId;
    const requestedWeek =
      typeof weekParam === "number" ? weekParam : week ?? null;

    let scheduleData = data;

    if (season && typeof requestedWeek === "number") {
      const seasonTypeParam = requestedSeasonTypeId
        ? `&seasontype=${requestedSeasonTypeId}`
        : "";
      const weekUrl = `${baseUrl}?season=${season}${seasonTypeParam}&week=${requestedWeek}`;
      const weekResponse = await fetch(weekUrl, {
        headers: {
          "accept": "application/json, text/plain, */*",
          "user-agent": "Mozilla/5.0",
          "referer": "https://www.espn.com/",
        },
      });
      if (weekResponse.ok) {
        scheduleData = await weekResponse.json();
      }
    }

    const normalizedSchedule = scheduleData?.content?.events
      ? scheduleData.content
      : scheduleData;
    const events = Array.isArray(normalizedSchedule?.events)
      ? normalizedSchedule.events
      : [];

    let weekLabel = normalizedSchedule?.week?.text ?? null;
    const seasonType =
      normalizedSchedule?.season?.type?.id ??
      requestedSeasonTypeId ??
      seasonTypeId ??
      null;
    const weekNumber =
      normalizedSchedule?.week?.number ??
      requestedWeek ??
      week ??
      null;

    if (phase && phase !== "current" && typeof requestedWeek === "number") {
      weekLabel =
        phase === "postseason" ? weekLabel : `Week ${requestedWeek}`;
    }
    const roundPoints = getRoundPoints(weekLabel, seasonType, weekNumber);

    const games = events
      .map((event) => {
        const competition = Array.isArray(event?.competitions)
          ? event.competitions[0]
          : null;
        const competitors = Array.isArray(competition?.competitors)
          ? competition.competitors
          : [];
        const home = competitors.find((team) => team?.homeAway === "home");
        const away = competitors.find((team) => team?.homeAway === "away");
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

    return res.json({
      season: normalizedSchedule?.season?.year ?? season ?? null,
      week: weekNumber,
      weekLabel,
      seasonType,
      games: applyManualConferenceWinners(games, seasonType, weekNumber, weekLabel),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/playoffs", async (req, res) => {
  try {
    res.set("Cache-Control", "no-store");
    const now = new Date();
    const month = now.getMonth() + 1; // 1–12
    const defaultSeason =
      month < 8 ? now.getFullYear() - 1 : now.getFullYear();
    const season = req.query.season ?? defaultSeason;

    const roundWeeks = [
      { name: "wildCard", week: 1, points: 1.5 },
      { name: "divisional", week: 2, points: 2.5 },
      { name: "conference", week: 3, points: 3.5 },
      { name: "superBowl", week: 4, points: 5 },
    ];

    const hasSportsDataKey = Boolean(process.env.SPORTSDATAIO_API_KEY);
    if (req.query.debug && hasSportsDataKey) {
      const standings = await fetchSportsDataStandings(season, process.env.SPORTSDATAIO_API_KEY);
      const sample = Array.isArray(standings)
        ? standings.slice(0, 10).map((team) => ({
            Team: team?.Team,
            City: team?.City,
            Name: team?.Name,
            FullName: team?.FullName,
            Division: team?.Division,
            Conference: team?.Conference,
            PlayoffSeed: team?.PlayoffSeed,
            Seed: team?.Seed,
            ConferenceSeed: team?.ConferenceSeed,
            ConferenceRank: team?.ConferenceRank,
            PlayoffRank: team?.PlayoffRank,
            DivisionRank: team?.DivisionRank,
          }))
        : [];
      return res.json({
        season: Number(season),
        updatedAt: new Date().toISOString(),
        source: "sportsdataio",
        hasSportsDataKey,
        sample,
      });
    }
    const sportsData = await fetchSportsDataPlayoffs(season);
    if (sportsData) {
      return res.json({
        season: Number(season),
        updatedAt: new Date().toISOString(),
        source: "sportsdataio",
        hasSportsDataKey,
        rounds: roundWeeks.map((round) => ({
          name: round.name,
          week: round.week,
          points: round.points,
        })),
        playoffWins: applyManualPlayoffOverrides(sportsData.playoffWins),
        wildcardByes: sportsData.wildcardByes,
      });
    }

    const standingsData = await fetchStandingsData(season);
    const standingsTeams = standingsData ? extractStandings(standingsData) : {};

    const playoffWins = {};
    const wildcardParticipants = new Set();

    if (req.query.debug) {
      const debug = await Promise.all(
        roundWeeks.map(async (round) => ({
          round: round.name,
          week: round.week,
          ...(await fetchScoreboardDebug(season, round.week)),
        })),
      );
      const fallback = await fetchPlayoffGamesFallback(season, true);

      return res.json({
        season: Number(season),
        updatedAt: new Date().toISOString(),
        version: SERVER_VERSION,
        source: "espn-fallback",
        hasSportsDataKey,
        debug,
        fallback,
      });
    }

    const roundGameMap = new Map();

    for (const round of roundWeeks) {
      const games = await fetchScoreboardGames(season, round.week);
      roundGameMap.set(round.name, games);
    }

    const hasAnyGames = Array.from(roundGameMap.values()).some(
      (games) => games.length > 0,
    );

    if (!hasAnyGames) {
      const fallbackGames = await fetchPlayoffGamesFallback(season, false);
      fallbackGames.gamesByRound.forEach((games, roundName) => {
        roundGameMap.set(roundName, games);
      });
    }

    for (const round of roundWeeks) {
      const games = roundGameMap.get(round.name) ?? [];
      games.forEach((game) => {
        const { homeTeamName, awayTeamName, winnerName } = game;
        if (!homeTeamName || !awayTeamName) return;
        if (round.name === "wildCard") {
          wildcardParticipants.add(homeTeamName);
          wildcardParticipants.add(awayTeamName);
        }
        if (!winnerName) return;

        const teamRecord = playoffWins[winnerName] || {
          wildCard: 0,
          divisional: 0,
          conference: 0,
          superBowl: 0,
        };
        teamRecord[round.name] += 1;
        playoffWins[winnerName] = teamRecord;
      });
    }

    const wildcardByes = {};
    Object.values(standingsTeams).forEach((team) => {
      if (team.seed === 1 && team.name && !wildcardParticipants.has(team.name)) {
        wildcardByes[team.name] = true;
      }
    });

    return res.json({
      season: Number(season),
      updatedAt: new Date().toISOString(),
      source: "espn-fallback",
      hasSportsDataKey,
      rounds: roundWeeks.map((round) => ({
        name: round.name,
        week: round.week,
        points: round.points,
      })),
      playoffWins: applyManualPlayoffOverrides(playoffWins),
      wildcardByes,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

function getStatValue(stats, statName) {
  if (!Array.isArray(stats)) return 0;
  const stat = stats.find((item) => item && item.name === statName);
  return typeof stat?.value === "number" ? stat.value : 0;
}

function extractStandings(data) {
  const teams = {};
  const conferences = Array.isArray(data?.children) ? data.children : [];

  conferences.forEach((conference) => {
    const divisions = Array.isArray(conference?.children)
      ? conference.children
      : [];

    const conferenceEntries = Array.isArray(conference?.standings?.entries)
      ? conference.standings.entries
      : [];

    const addEntry = (entry, divisionName) => {
      const team = entry?.team;
      const displayName = team?.displayName || team?.name;
      if (!displayName) return;

      const wins = getStatValue(entry?.stats, "wins");
      const losses = getStatValue(entry?.stats, "losses");
      const ties = getStatValue(entry?.stats, "ties");
      const seed = getStatValue(entry?.stats, "seed");

      teams[displayName] = {
        name: displayName,
        abbreviation: team?.abbreviation,
        wins,
        losses,
        ties,
        seed,
        division: divisionName ?? null,
        conference: conference?.name ?? null,
      };
    };

    if (conferenceEntries.length > 0) {
      conferenceEntries.forEach((entry) => addEntry(entry, null));
      return;
    }

    divisions.forEach((division) => {
      const entries = Array.isArray(division?.standings?.entries)
        ? division.standings.entries
        : [];

      entries.forEach((entry) => addEntry(entry, division?.name ?? null));
    });
  });

  return teams;
}

function summarizeStandingsShape(data) {
  const conferences = Array.isArray(data?.children) ? data.children : [];
  return {
    topKeys: Object.keys(data ?? {}),
    conferenceCount: conferences.length,
    conferences: conferences.map((conference) => {
      const divisions = Array.isArray(conference?.children)
        ? conference.children
        : [];
      return {
        name: conference?.name,
        divisionCount: divisions.length,
        divisions: divisions.map((division) => ({
          name: division?.name,
          entries: Array.isArray(division?.standings?.entries)
            ? division.standings.entries.length
            : 0,
          standingsKeys: Object.keys(division?.standings ?? {}),
          divisionKeys: Object.keys(division ?? {}),
        })),
        conferenceKeys: Object.keys(conference ?? {}),
      };
    }),
  };
}

function getRoundPoints(weekLabel, seasonType, weekNumber) {
  const label = (weekLabel || "").toLowerCase();
  if (seasonType === 3 || label.includes("wild card") || label.includes("wildcard")) {
    if (typeof weekNumber === "number") {
      if (weekNumber === 1) return 1.5;
      if (weekNumber === 2) return 2.5;
      if (weekNumber === 3) return 3.5;
      if (weekNumber === 4) return 5;
    }
    return 1.5;
  }
  if (label.includes("divisional")) {
    return 2.5;
  }
  if (label.includes("conference")) {
    return 3.5;
  }
  if (label.includes("super bowl")) {
    return 5;
  }
  return 1;
}

async function fetchStandingsData(season) {
  const baseParams = `season=${season}&seasontype=2&region=us&lang=en&contentorigin=espn`;
  const url = `https://site.api.espn.com/apis/v2/sports/football/nfl/standings?${baseParams}`;
  const r = await fetch(url, {
    headers: {
      "accept": "application/json, text/plain, */*",
      "user-agent": "Mozilla/5.0",
      "referer": "https://www.espn.com/",
    },
  });
  if (!r.ok) return null;
  return await r.json();
}

async function fetchScoreboardGames(season, week) {
  const { data } = await fetchScoreboardData(season, week);
  if (!data) return [];
  const events = Array.isArray(data?.events) ? data.events : [];

  return events
    .map((event) => {
    const competition = Array.isArray(event?.competitions)
      ? event.competitions[0]
      : null;
    const competitors = Array.isArray(competition?.competitors)
      ? competition.competitors
      : [];
    const home = competitors.find((team) => team?.homeAway === "home");
    const away = competitors.find((team) => team?.homeAway === "away");
    const homeName =
      home?.team?.displayName || home?.team?.name || home?.team?.shortDisplayName;
    const awayName =
      away?.team?.displayName || away?.team?.name || away?.team?.shortDisplayName;

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
      id: event?.id || competition?.id,
      homeTeamName: homeName,
      awayTeamName: awayName,
      winnerName,
      completed: Boolean(competition?.status?.type?.completed),
      roundName: null,
    };
  })
    .filter((game) => game.completed);
}

async function fetchScoreboardDebug(season, week) {
  const { data, attempts } = await fetchScoreboardData(season, week);

  const events = Array.isArray(data?.events) ? data.events : [];
  const sample = events[0] ?? null;
  const competition = Array.isArray(sample?.competitions)
    ? sample.competitions[0]
    : null;

  return {
    attempts,
    eventCount: events.length,
    sampleId: sample?.id ?? null,
    sampleName: sample?.name ?? null,
    sampleDate: sample?.date ?? null,
    sampleCompleted: Boolean(competition?.status?.type?.completed),
    sampleWeek: data?.week ?? null,
    sampleSeasonType: data?.season?.type ?? null,
  };
}

async function fetchScoreboardData(season, week) {
  const dateRange = buildRecentDateRange(21);
  const seasonsToTry = [season, Number(season) + 1].filter(
    (value, index, self) => self.indexOf(value) === index,
  );

  const urls = seasonsToTry.flatMap((seasonValue) => {
    const params = `seasontype=3&season=${seasonValue}&week=${week}&region=us&lang=en&contentorigin=espn`;
    const altParams = `seasontype=3&season=${seasonValue}&week=${week}`;
    const dateParams = `seasontype=3&dates=${dateRange}&region=us&lang=en&contentorigin=espn`;

    return [
      `https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?${params}`,
      `https://site.api.espn.com/apis/v2/sports/football/nfl/scoreboard?${params}`,
      `https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?${altParams}`,
      `https://cdn.espn.com/core/nfl/scoreboard?xhr=1&${params}`,
      `https://cdn.espn.com/core/nfl/scoreboard?xhr=1&${altParams}`,
      `https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?${dateParams}`,
      `https://cdn.espn.com/core/nfl/scoreboard?xhr=1&${dateParams}`,
    ];
  });

  const headers = {
    "accept": "application/json, text/plain, */*",
    "user-agent": "Mozilla/5.0",
    "referer": "https://www.espn.com/",
  };

  const attempts = [];

  for (const url of urls) {
    const r = await fetch(url, { headers });
    const status = r.status;
    let text = "";
    try {
      text = await r.text();
    } catch {
      text = "";
    }

    let data = null;
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }

    attempts.push({
      url,
      status,
      snippet: text.slice(0, 200),
    });

    if (r.ok && data && Array.isArray(data?.events)) {
      return { data, attempts };
    }
    if (r.ok && data?.content && Array.isArray(data?.content?.events)) {
      return { data: data.content, attempts };
    }
  }

  return { data: null, attempts };
}

async function fetchPlayoffGamesFallback(season, includeDebugSamples) {
  const { data, attempts } = await fetchScoreboardData(season, 1);
  const gamesByRound = new Map();

  if (!data || !Array.isArray(data?.events)) {
    return { attempts, gamesByRound, samples: [] };
  }

  const events = data.events;
  const samples = includeDebugSamples
    ? events.slice(0, 8).map((event) => summarizeEvent(event))
    : [];

  const games = events
    .filter((event) => isPostseasonEvent(event))
    .map((event) => {
      const competition = Array.isArray(event?.competitions)
        ? event.competitions[0]
        : null;
      const competitors = Array.isArray(competition?.competitors)
        ? competition.competitors
        : [];
      const home = competitors.find((team) => team?.homeAway === "home");
      const away = competitors.find((team) => team?.homeAway === "away");
      const homeName =
        home?.team?.displayName || home?.team?.name || home?.team?.shortDisplayName;
      const awayName =
        away?.team?.displayName || away?.team?.name || away?.team?.shortDisplayName;

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

      const roundName = inferPlayoffRound(event, competition);

      return {
        id: event?.id || competition?.id,
        homeTeamName: homeName,
        awayTeamName: awayName,
        winnerName,
        completed: Boolean(competition?.status?.type?.completed),
        roundName,
      };
    })
    .filter((game) => game.completed && game.roundName);

  games.forEach((game) => {
    if (!game.roundName) return;
    if (!gamesByRound.has(game.roundName)) {
      gamesByRound.set(game.roundName, []);
    }
    gamesByRound.get(game.roundName).push(game);
  });

  return { attempts, gamesByRound, samples };
}

function inferPlayoffRound(event, competition) {
  const label =
    (event?.name ||
      event?.shortName ||
      competition?.type?.description ||
      competition?.type?.shortName ||
      competition?.type?.abbreviation ||
      "")
      .toLowerCase();

  if (label.includes("wild card") || label.includes("wildcard")) {
    return "wildCard";
  }
  if (label.includes("divisional")) {
    return "divisional";
  }
  if (label.includes("conference")) {
    return "conference";
  }
  if (label.includes("super bowl")) {
    return "superBowl";
  }
  return null;
}

function isPostseasonEvent(event) {
  const seasonTypeId = event?.season?.type?.id;
  const seasonTypeSlug = event?.season?.type?.slug;
  const competition = Array.isArray(event?.competitions)
    ? event.competitions[0]
    : null;
  const competitionType = competition?.type;
  const competitionTypeId = competitionType?.id ?? competitionType?.typeId;

  if (seasonTypeId === 3 || seasonTypeSlug === "postseason") return true;
  if (competitionType?.type === "postseason") return true;
  if (competitionTypeId === 3) return true;
  if (competitionType?.abbreviation === "POST") return true;
  if (competitionType?.description?.toLowerCase().includes("wild card")) return true;
  if (competitionType?.description?.toLowerCase().includes("divisional")) return true;
  if (competitionType?.description?.toLowerCase().includes("conference")) return true;
  if (competitionType?.description?.toLowerCase().includes("super bowl")) return true;

  const label = (event?.name || event?.shortName || "").toLowerCase();
  if (label.includes("wild card")) return true;
  if (label.includes("divisional")) return true;
  if (label.includes("conference")) return true;
  if (label.includes("super bowl")) return true;

  return false;
}

function summarizeEvent(event) {
  const competition = Array.isArray(event?.competitions)
    ? event.competitions[0]
    : null;
  const competitionType = competition?.type;

  return {
    id: event?.id ?? null,
    name: event?.name ?? null,
    shortName: event?.shortName ?? null,
    seasonTypeId: event?.season?.type?.id ?? null,
    seasonTypeSlug: event?.season?.type?.slug ?? null,
    weekNumber: event?.week?.number ?? null,
    weekText: event?.week?.text ?? null,
    competitionType: competitionType?.type ?? null,
    competitionDescription: competitionType?.description ?? null,
    competitionShortName: competitionType?.shortName ?? null,
    competitionAbbreviation: competitionType?.abbreviation ?? null,
    competitionTypeId: competitionType?.id ?? competitionType?.typeId ?? null,
    seasonTypeIdAlt: competition?.season?.type?.id ?? null,
    seasonTypeSlugAlt: competition?.season?.type?.slug ?? null,
  };
}

function buildRecentDateRange(days) {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - days);

  const format = (value) =>
    `${value.getFullYear()}${String(value.getMonth() + 1).padStart(2, "0")}${String(
      value.getDate(),
    ).padStart(2, "0")}`;

  return `${format(start)}-${format(end)}`;
}

async function fetchSportsDataPlayoffs(season) {
  const apiKey = process.env.SPORTSDATAIO_API_KEY;
  if (!apiKey) return null;

  const standings = await fetchSportsDataStandings(season, apiKey);
  if (!standings) return null;

  const abbrToName = {};
  const wildcardByes = {};

  const parseSeed = (value) => {
    if (value === null || value === undefined) return null;
    if (typeof value === "number" && !Number.isNaN(value)) return value;
    const match = String(value).match(/\d+/);
    return match ? Number(match[0]) : null;
  };

  standings.forEach((team) => {
    const abbr = team?.Team || team?.Abbreviation;
    const city = team?.City;
    const nickname = team?.Name;
    const fullName = city && nickname ? `${city} ${nickname}` : team?.Name;
    const displayName = team?.FullName || team?.TeamName || fullName;

    if (abbr && displayName) {
      abbrToName[abbr] = displayName;
    }

    const conferenceRank = parseSeed(team?.ConferenceRank);
    if (conferenceRank !== null) {
      if (conferenceRank === 1 && displayName) {
        wildcardByes[displayName] = true;
      }
      return;
    }

    const seedRaw =
      team?.PlayoffSeed ??
      team?.Seed ??
      team?.ConferenceSeed ??
      team?.PlayoffRank;
    const seed = parseSeed(seedRaw);
    if (seed === 1 && displayName) {
      wildcardByes[displayName] = true;
    }
  });

  const playoffWins = {};
  const seasonPost = `${season}POST`;
  const rounds = [
    { name: "wildCard", week: 1 },
    { name: "divisional", week: 2 },
    { name: "conference", week: 3 },
    { name: "superBowl", week: 4 },
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
        typeof game?.HomeScore === "number" &&
        typeof game?.AwayScore === "number"
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

async function fetchSportsDataSchedule(phase, weekParam) {
  const apiKey = process.env.SPORTSDATAIO_API_KEY;
  if (!apiKey) return null;

  const now = new Date();
  const month = now.getMonth() + 1;
  const defaultSeason =
    month < 8 ? now.getFullYear() - 1 : now.getFullYear();

  const standings = await fetchSportsDataStandings(defaultSeason, apiKey);
  if (!standings) return null;

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

  if (phase === "regular" && weekParam) {
    return fetchSportsDataScheduleByWeek(defaultSeason, weekParam, "regular", abbrToName, apiKey);
  }

  if (phase === "postseason" && weekParam) {
    return fetchSportsDataScheduleByWeek(defaultSeason, weekParam, "postseason", abbrToName, apiKey);
  }

  const postseasonWeek = await findCurrentPostseasonWeek(defaultSeason, apiKey);
  if (!postseasonWeek) return null;

  const games = await fetchSportsDataScoresByWeek(
    postseasonWeek.seasonValue,
    postseasonWeek.week,
    apiKey,
  );

  const mappedGames = games
    .map((game) => {
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
        } else if (typeof game?.HomeScore === "number" && typeof game?.AwayScore === "number") {
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
        pointsAtStake: postseasonWeek.pointsAtStake,
        completed,
        winnerName,
      };
    })
    .filter(Boolean);

  if (mappedGames.length === 0) return null;

  return {
    season: Number(defaultSeason),
    week: postseasonWeek.week,
    weekLabel: postseasonWeek.label,
    seasonType: 3,
    games: mappedGames,
  };
}

async function findCurrentPostseasonWeek(season, apiKey) {
  const now = new Date();
  const windowStart = new Date(now);
  windowStart.setDate(now.getDate() - 5);
  const windowEnd = new Date(now);
  windowEnd.setDate(now.getDate() + 7);

  const seasonValue = `${season}POST`;
  const rounds = [
    { week: 1, label: "Wild Card", pointsAtStake: 1.5 },
    { week: 2, label: "Divisional Round", pointsAtStake: 2.5 },
    { week: 3, label: "Conference Round", pointsAtStake: 3.5 },
    { week: 4, label: "Super Bowl", pointsAtStake: 5 },
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

async function fetchSportsDataScheduleByWeek(season, week, phase, abbrToName, apiKey) {
  const isPostseason = phase === "postseason";
  const pointsAtStake = isPostseason ? postseasonPointsForWeek(week) : 1;
  const weekLabel = isPostseason ? postseasonLabelForWeek(week) : `Week ${week}`;
  const seasonValues = isPostseason
    ? [`${season}POST`]
    : [`${season}`, `${season}REG`];

  let mappedGames = [];

  for (const seasonValue of seasonValues) {
    const games = await fetchSportsDataScoresByWeek(seasonValue, week, apiKey);
    mappedGames = games
      .map((game) => {
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
            typeof game?.HomeScore === "number" &&
            typeof game?.AwayScore === "number"
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
      })
      .filter(Boolean);

    if (mappedGames.length > 0) {
      break;
    }
  }

  return {
    season: Number(season),
    week,
    weekLabel,
    seasonType: isPostseason ? 3 : 2,
    games: mappedGames,
  };
}

function postseasonPointsForWeek(week) {
  if (week === 1) return 1.5;
  if (week === 2) return 2.5;
  if (week === 3) return 3.5;
  if (week === 4) return 5;
  return 1;
}

function postseasonLabelForWeek(week) {
  if (week === 1) return "Wild Card";
  if (week === 2) return "Divisional Round";
  if (week === 3) return "Conference Round";
  if (week === 4) return "Super Bowl";
  return `Week ${week}`;
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

async function fetchSportsDataJson(url) {
  const r = await fetch(url);
  if (!r.ok) return null;
  try {
    return await r.json();
  } catch {
    return null;
  }
}

function isSportsDataFinal(game) {
  const status = String(game?.Status || "").toLowerCase();
  if (game?.IsOver === true) return true;
  if (status === "final" || status === "f") return true;
  if (status.includes("final")) return true;
  return false;
}


app.listen(PORT, () => console.log(`API on http://localhost:${PORT}`));
