import { useEffect, useState } from 'react';
import { getTeamById, normalizeTeamName, type Team } from '../data/teams';
import schedule2026 from '../data/schedule-2026.json';
import type { Player, TeamRecord } from './gameData';
import { getLocalPlayoffSummary, TEAM_ABBR_TO_NAME } from './scheduleData';

export interface TeamStanding {
  wins: number;
  losses: number;
  ties: number;
  abbreviation?: string;
  division?: string;
  conference?: string;
  seed?: number;
}

export type StandingsMap = Record<string, TeamStanding>;

interface RawScheduleGame {
  game_type: string;
  home_team: string;
  away_team: string;
  home_score: number | null;
  away_score: number | null;
  winner: string | null;
  played: boolean;
}

interface StandingsResponse {
  season: number;
  updatedAt: string;
  teams: StandingsMap;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const RETRY_MS = 5 * 60 * 1000;

/**
 * Build standings using a local schedule as a fallback for API failures.
 */
export function buildStandingsFromSchedule(
  games: RawScheduleGame[],
  teamAbbrToName: Record<string, string>,
): StandingsMap {
  const standings: StandingsMap = {};

  const ensureTeam = (abbr: string) => {
    const name = teamAbbrToName[abbr];
    if (!name) return null;
    if (!standings[name]) {
      standings[name] = { wins: 0, losses: 0, ties: 0, abbreviation: abbr };
    }
    return standings[name];
  };

  games.forEach((game) => {
    if (game.game_type !== 'REG') return;
    if (!game.played) return;

    const home = ensureTeam(game.home_team);
    const away = ensureTeam(game.away_team);
    if (!home || !away) return;

    const winner = game.winner;
    if (winner === 'TIE') {
      home.ties += 1;
      away.ties += 1;
      return;
    }

    if (winner === game.home_team) {
      home.wins += 1;
      away.losses += 1;
      return;
    }

    if (winner === game.away_team) {
      away.wins += 1;
      home.losses += 1;
      return;
    }

    if (
      typeof game.home_score === 'number' &&
      typeof game.away_score === 'number'
    ) {
      if (game.home_score === game.away_score) {
        home.ties += 1;
        away.ties += 1;
      } else if (game.home_score > game.away_score) {
        home.wins += 1;
        away.losses += 1;
      } else {
        away.wins += 1;
        home.losses += 1;
      }
    }
  });

  return standings;
}

function getLocalStandings(): StandingsMap {
  const localSchedule = schedule2026 as RawScheduleGame[];
  return buildStandingsFromSchedule(localSchedule, TEAM_ABBR_TO_NAME);
}

function getLocalPlayoffs(): PlayoffResponse {
  const local = getLocalPlayoffSummary();
  return (
    applyManualPlayoffOverrides({
      season: null,
      updatedAt: new Date().toISOString(),
      playoffWins: local.playoffWins,
      wildcardByes: local.wildcardByes,
    }) ?? {
      season: null,
      updatedAt: new Date().toISOString(),
      playoffWins: local.playoffWins,
      wildcardByes: local.wildcardByes,
    }
  );
}

function getNext7amUtcDelayMs() {
  const now = new Date();
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 7, 0, 0, 0));
  if (next <= now) {
    next.setUTCDate(next.getUTCDate() + 1);
  }
  return next.getTime() - now.getTime();
}

export function useStandings(refreshKey?: number) {
  const [standings, setStandings] = useState<StandingsMap | null>(null);
  const [season, setSeason] = useState<number | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    let timeoutId: number | null = null;

    const scheduleNext = (delayMs: number) => {
      if (!active) return;
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }
      timeoutId = window.setTimeout(load, delayMs);
    };

    const load = async () => {
      try {
        const response = await fetch('/api/standings');
        if (!response.ok) {
          throw new Error(`Standings request failed (${response.status})`);
        }

        const data = (await response.json()) as StandingsResponse;
        if (!active) return;

        const teams = data.teams ?? {};
        if (Object.keys(teams).length === 0) {
          setStandings(getLocalStandings());
          setSeason(data.season ?? null);
          setUpdatedAt(data.updatedAt ?? null);
          setError('Empty standings response. Using local schedule.');
          scheduleNext(RETRY_MS);
          return;
        }

        setStandings(teams);
        setSeason(data.season ?? null);
        setUpdatedAt(data.updatedAt ?? null);
        setError(null);
        scheduleNext(getNext7amUtcDelayMs());
      } catch (err) {
        if (!active) return;
        setStandings(getLocalStandings());
        setSeason(null);
        setUpdatedAt(new Date().toISOString());
        setError(err instanceof Error ? err.message : 'Failed to load standings');
        scheduleNext(RETRY_MS);
      }
    };

    load();

    return () => {
      active = false;
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }
    };
  }, [refreshKey]);

  return { standings, season, updatedAt, error };
}

export interface PlayoffWins {
  wildCard: number;
  divisional: number;
  conference: number;
  superBowl: number;
}

export interface PlayoffResponse {
  season: number | null;
  updatedAt: string | null;
  playoffWins: Record<string, PlayoffWins>;
  wildcardByes: Record<string, boolean>;
}

function getNormalizedEntry<T>(
  map: Record<string, T> | null | undefined,
  teamName: string,
): T | null {
  if (!map) return null;
  const direct = map[teamName];
  if (direct !== undefined) return direct;
  const normalizedTarget = normalizeTeamName(teamName);
  const matched = Object.entries(map).find(([name]) => {
    return normalizeTeamName(name) === normalizedTarget;
  });
  return matched?.[1] ?? null;
}

export function usePlayoffs(refreshKey?: number) {
  const [playoffs, setPlayoffs] = useState<PlayoffResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    let timeoutId: number | null = null;

    const scheduleNext = (delayMs: number) => {
      if (!active) return;
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }
      timeoutId = window.setTimeout(load, delayMs);
    };

    const load = async () => {
      try {
        const response = await fetch('/api/playoffs');
        if (!response.ok) {
          throw new Error(`Playoffs request failed (${response.status})`);
        }

        const data = (await response.json()) as PlayoffResponse;
        if (!active) return;
        const normalized = applyManualPlayoffOverrides(data);
        if (!isValidPlayoffData(normalized)) {
          setPlayoffs(getLocalPlayoffs());
          setError('Empty playoff response. Using local schedule.');
          scheduleNext(RETRY_MS);
          return;
        }

        setPlayoffs(normalized);
        setError(null);
        scheduleNext(getNext7amUtcDelayMs());
      } catch (err) {
        if (!active) return;
        setPlayoffs(getLocalPlayoffs());
        setError(err instanceof Error ? err.message : 'Failed to load playoffs');
        scheduleNext(RETRY_MS);
      }
    };

    load();

    return () => {
      active = false;
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }
    };
  }, [refreshKey]);

  return { playoffs, error };
}

export function getStandingForTeam(
  teamId: Team['id'],
  standings: StandingsMap | null,
) {
  if (!standings) return null;
  const teamInfo = getTeamById(teamId);
  if (!teamInfo) return null;
  const direct = standings[teamInfo.name];
  if (direct) return direct;
  const normalizedTarget = normalizeTeamName(teamInfo.name);
  const matchedEntry = Object.entries(standings).find(([name]) => {
    return normalizeTeamName(name) === normalizedTarget;
  });
  return matchedEntry?.[1] ?? null;
}

export function resolveTeamRecord(
  team: TeamRecord,
  standings: StandingsMap | null,
) {
  const standing = getStandingForTeam(team.teamId, standings);
  const wins = standing?.wins ?? team.wins;
  const losses = standing?.losses ?? team.losses;
  const ties = standing?.ties ?? 0;
  const gamesPlayed = wins + losses + ties;

  return { wins, losses, ties, gamesPlayed };
}

const PLAYOFF_POINTS = {
  wildCardWin: 1.5,
  divisionalWin: 2.5,
  conferenceWin: 3.5,
  superBowlWin: 5,
  wildCardBye: 1.5,
};

const MANUAL_CONFERENCE_WINNERS = ['New England Patriots', 'Seattle Seahawks'];
const MANUAL_SUPER_BOWL_WINNER = 'Seattle Seahawks';

export function applyManualPlayoffOverrides(
  playoffs: PlayoffResponse | null,
): PlayoffResponse | null {
  if (!playoffs) return playoffs;
  const next = { ...playoffs, playoffWins: { ...(playoffs.playoffWins ?? {}) } };

  MANUAL_CONFERENCE_WINNERS.forEach((teamName) => {
    const current = next.playoffWins[teamName] ?? {
      wildCard: 0,
      divisional: 0,
      conference: 0,
      superBowl: 0,
    };
    next.playoffWins[teamName] = {
      ...current,
      conference: Math.max(current.conference ?? 0, 1),
    };
  });

  if (MANUAL_SUPER_BOWL_WINNER) {
    const current = next.playoffWins[MANUAL_SUPER_BOWL_WINNER] ?? {
      wildCard: 0,
      divisional: 0,
      conference: 0,
      superBowl: 0,
    };
    next.playoffWins[MANUAL_SUPER_BOWL_WINNER] = {
      ...current,
      superBowl: Math.max(current.superBowl ?? 0, 1),
    };
  }

  return next;
}


function isValidPlayoffData(playoffs: PlayoffResponse | null) {
  if (!playoffs) return false;
  const winsEntries = Object.values(playoffs.playoffWins ?? {});
  if (winsEntries.length === 0) return false;
  for (const record of winsEntries) {
    const rounds = [record.wildCard, record.divisional, record.conference, record.superBowl];
    for (const value of rounds) {
      if (!Number.isFinite(value)) return false;
      if (value < 0 || value > 1) return false;
    }
  }
  return true;
}

export function getTeamPlayoffPoints(
  teamId: Team['id'],
  playoffs: PlayoffResponse | null,
) {
  const teamInfo = getTeamById(teamId);
  if (!teamInfo) return 0;
  const playoffWins = getNormalizedEntry(playoffs?.playoffWins ?? null, teamInfo.name);
  const wildcardBye = getNormalizedEntry(playoffs?.wildcardByes ?? null, teamInfo.name);
  const conferenceWins = playoffWins?.conference ?? 0;
  const superBowlWins = playoffWins?.superBowl ?? 0;

  return (
    (playoffWins?.wildCard ?? 0) * PLAYOFF_POINTS.wildCardWin +
    (playoffWins?.divisional ?? 0) * PLAYOFF_POINTS.divisionalWin +
    conferenceWins * PLAYOFF_POINTS.conferenceWin +
    superBowlWins * PLAYOFF_POINTS.superBowlWin +
    (wildcardBye ? PLAYOFF_POINTS.wildCardBye : 0)
  );
}

export function getTeamPoints(
  teamId: Team['id'],
  standings: StandingsMap | null,
  playoffs: PlayoffResponse | null,
) {
  const standing = getStandingForTeam(teamId, standings);
  const regularWins = standing?.wins ?? 0;
  const ties = standing?.ties ?? 0;
  const regularSeasonPoints = regularWins + ties * 0.5;
  if (!playoffs) return regularSeasonPoints;
  return regularSeasonPoints + getTeamPlayoffPoints(teamId, playoffs);
}

export function getPlayerPoints(
  player: Player,
  standings: StandingsMap | null,
  playoffs: PlayoffResponse | null,
) {
  if (!standings && !playoffs) return player.totalPoints;

  const regularSeasonPoints = standings
    ? player.teams.reduce(
        (sum, team) => {
          const record = resolveTeamRecord(team, standings);
          return sum + record.wins + record.ties * 0.5;
        },
        0,
      )
    : player.totalPoints;

  const playoffPoints = player.teams.reduce(
    (sum, team) => sum + getTeamPlayoffPoints(team.teamId, playoffs),
    0,
  );

  return regularSeasonPoints + playoffPoints;
}
