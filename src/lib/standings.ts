import { useEffect, useState } from 'react';
import { getTeamById, normalizeTeamName, type Team } from '../data/teams';
import type { Player, TeamRecord } from './gameData';

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

interface StandingsResponse {
  season: number;
  updatedAt: string;
  teams: StandingsMap;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const RETRY_MS = 5 * 60 * 1000;

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

        setStandings(data.teams ?? {});
        setSeason(data.season ?? null);
        setUpdatedAt(data.updatedAt ?? null);
        setError(null);
        scheduleNext(getNext7amUtcDelayMs());
      } catch (err) {
        if (!active) return;
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
        setPlayoffs(data);
        setError(null);
        scheduleNext(getNext7amUtcDelayMs());
      } catch (err) {
        if (!active) return;
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
  const playoffWins = getNormalizedEntry(playoffs.playoffWins, teamInfo.name);
  const wildcardBye = getNormalizedEntry(playoffs.wildcardByes, teamInfo.name);

  return (
    (playoffWins?.wildCard ?? 0) * PLAYOFF_POINTS.wildCardWin +
    (playoffWins?.divisional ?? 0) * PLAYOFF_POINTS.divisionalWin +
    (playoffWins?.conference ?? 0) * PLAYOFF_POINTS.conferenceWin +
    (playoffWins?.superBowl ?? 0) * PLAYOFF_POINTS.superBowlWin +
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
  const regularTies = standing?.ties ?? 0;
  const regularPoints = regularWins + regularTies * 0.5;
  return regularPoints + getTeamPlayoffPoints(teamId, playoffs);
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
