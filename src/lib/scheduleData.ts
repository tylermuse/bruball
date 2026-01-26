import { useEffect, useState } from 'react';
import { getAllPlayers } from './gameData';
import { getTeamByName } from '../data/teams';
import type { Team } from '../data/teams';
import schedule2025 from '../data/schedule-2025.json';

export interface Game {
  id: string;
  homeTeamId: Team['id'];
  awayTeamId: Team['id'];
  time: string;
  day: string;
  pointsAtStake: number;
  completed?: boolean;
  winnerTeamId?: Team['id'];
}

interface ApiGame {
  id: string;
  date: string;
  homeTeamName: string;
  awayTeamName: string;
  pointsAtStake: number;
  completed?: boolean;
  winnerName?: string | null;
}

interface ScheduleResponse {
  week: number | null;
  weekLabel: string | null;
  seasonType?: number | null;
  games: ApiGame[];
}

interface RawScheduleGame {
  game_id: string;
  season: number;
  game_type: string;
  stage: string;
  week: number;
  gameday: string;
  weekday: string;
  gametime: string;
  away_team: string;
  home_team: string;
  away_score: number;
  home_score: number;
  winner: string | null;
  played: boolean;
}

const TEAM_ABBR_TO_NAME: Record<string, string> = {
  ARI: 'Arizona Cardinals',
  ATL: 'Atlanta Falcons',
  BAL: 'Baltimore Ravens',
  BUF: 'Buffalo Bills',
  CAR: 'Carolina Panthers',
  CHI: 'Chicago Bears',
  CIN: 'Cincinnati Bengals',
  CLE: 'Cleveland Browns',
  DAL: 'Dallas Cowboys',
  DEN: 'Denver Broncos',
  DET: 'Detroit Lions',
  GB: 'Green Bay Packers',
  HOU: 'Houston Texans',
  IND: 'Indianapolis Colts',
  JAX: 'Jacksonville Jaguars',
  KC: 'Kansas City Chiefs',
  LA: 'Los Angeles Rams',
  LAC: 'Los Angeles Chargers',
  LV: 'Las Vegas Raiders',
  MIA: 'Miami Dolphins',
  MIN: 'Minnesota Vikings',
  NE: 'New England Patriots',
  NO: 'New Orleans Saints',
  NYG: 'New York Giants',
  NYJ: 'New York Jets',
  PHI: 'Philadelphia Eagles',
  PIT: 'Pittsburgh Steelers',
  SEA: 'Seattle Seahawks',
  SF: 'San Francisco 49ers',
  TB: 'Tampa Bay Buccaneers',
  TEN: 'Tennessee Titans',
  WAS: 'Washington Commanders',
};

const POSTSEASON_MAP = {
  WC: { week: 1, label: 'Wild Card', points: 1.5, round: 'wildCard' },
  DIV: { week: 2, label: 'Divisional Round', points: 2.5, round: 'divisional' },
  CON: { week: 3, label: 'Conference Round', points: 3.5, round: 'conference' },
  SB: { week: 4, label: 'Super Bowl', points: 5, round: 'superBowl' },
};

const LOCAL_SCHEDULE: RawScheduleGame[] = schedule2025 as RawScheduleGame[];

function buildDateString(game: RawScheduleGame) {
  const time = game.gametime?.length === 5 ? `${game.gametime}:00` : game.gametime;
  return `${game.gameday}T${time}`;
}

function getPostseasonWeek(gameType: string) {
  const entry = POSTSEASON_MAP[gameType as keyof typeof POSTSEASON_MAP];
  return entry?.week ?? null;
}

function mapRawToApiGame(game: RawScheduleGame, pointsAtStake: number): ApiGame | null {
  const homeName = TEAM_ABBR_TO_NAME[game.home_team];
  const awayName = TEAM_ABBR_TO_NAME[game.away_team];
  if (!homeName || !awayName) return null;
  const winnerName = game.winner && game.winner !== 'TIE' ? TEAM_ABBR_TO_NAME[game.winner] : null;

  return {
    id: game.game_id,
    date: buildDateString(game),
    homeTeamName: homeName,
    awayTeamName: awayName,
    pointsAtStake,
    completed: Boolean(game.played),
    winnerName: winnerName ?? null,
  };
}

function getLocalSchedule(phase: SchedulePhase, week: number | null) {
  if (!week) return null;
  if (phase === 'regular') {
    const games = LOCAL_SCHEDULE.filter(
      (game) => game.game_type === 'REG' && game.week === week,
    )
      .map((game) => mapRawToApiGame(game, 1))
      .filter((game): game is ApiGame => Boolean(game));
    return {
      week,
      weekLabel: `Week ${week}`,
      seasonType: 2,
      games,
    };
  }

  if (phase === 'postseason') {
    const postseasonKey = Object.keys(POSTSEASON_MAP).find(
      (key) => POSTSEASON_MAP[key as keyof typeof POSTSEASON_MAP].week === week,
    ) as keyof typeof POSTSEASON_MAP | undefined;
    if (!postseasonKey) return null;
    const mapEntry = POSTSEASON_MAP[postseasonKey];
    const games = LOCAL_SCHEDULE.filter(
      (game) => game.game_type === postseasonKey,
    )
      .map((game) => mapRawToApiGame(game, mapEntry.points))
      .filter((game): game is ApiGame => Boolean(game));
    return {
      week,
      weekLabel: mapEntry.label,
      seasonType: 3,
      games,
    };
  }

  return null;
}

function getLocalCurrentSchedule() {
  if (!LOCAL_SCHEDULE.length) return null;
  const now = Date.now();
  let bestPast: { game: RawScheduleGame; date: number } | null = null;
  let bestFuture: { game: RawScheduleGame; date: number } | null = null;

  for (const game of LOCAL_SCHEDULE) {
    const dateValue = Date.parse(buildDateString(game));
    if (Number.isNaN(dateValue)) continue;
    if (dateValue <= now) {
      if (!bestPast || dateValue > bestPast.date) {
        bestPast = { game, date: dateValue };
      }
    } else if (!bestFuture || dateValue < bestFuture.date) {
      bestFuture = { game, date: dateValue };
    }
  }

  const target = bestPast?.game ?? bestFuture?.game;
  if (!target) return null;

  if (target.game_type === 'REG') {
    return getLocalSchedule('regular', target.week);
  }

  const postseasonWeek = getPostseasonWeek(target.game_type);
  if (!postseasonWeek) return null;
  return getLocalSchedule('postseason', postseasonWeek);
}

let localPlayoffCache: {
  playoffWins: Record<string, { wildCard: number; divisional: number; conference: number; superBowl: number }>;
  wildcardByes: Record<string, boolean>;
} | null = null;

export function getLocalPlayoffSummary() {
  if (localPlayoffCache) return localPlayoffCache;

  const playoffWins: Record<string, { wildCard: number; divisional: number; conference: number; superBowl: number }> = {};
  const wildcardTeams = new Set<string>();
  const divisionalTeams = new Set<string>();

  LOCAL_SCHEDULE.forEach((game) => {
    const postseason = POSTSEASON_MAP[game.game_type as keyof typeof POSTSEASON_MAP];
    if (!postseason) return;
    const homeName = TEAM_ABBR_TO_NAME[game.home_team];
    const awayName = TEAM_ABBR_TO_NAME[game.away_team];
    if (!homeName || !awayName) return;

    if (postseason.round === 'wildCard') {
      wildcardTeams.add(homeName);
      wildcardTeams.add(awayName);
    }
    if (postseason.round === 'divisional') {
      divisionalTeams.add(homeName);
      divisionalTeams.add(awayName);
    }

    if (!game.played) return;
    if (!game.winner || game.winner === 'TIE') return;
    const winnerName = TEAM_ABBR_TO_NAME[game.winner];
    if (!winnerName) return;

    const record = playoffWins[winnerName] || {
      wildCard: 0,
      divisional: 0,
      conference: 0,
      superBowl: 0,
    };
    record[postseason.round as keyof typeof record] += 1;
    playoffWins[winnerName] = record;
  });

  const wildcardByes: Record<string, boolean> = {};
  divisionalTeams.forEach((team) => {
    if (!wildcardTeams.has(team)) {
      wildcardByes[team] = true;
    }
  });

  localPlayoffCache = { playoffWins, wildcardByes };
  return localPlayoffCache;
}

// Week 15 NFL Schedule
export const weeklySchedule: Game[] = [
  // Thursday Night
  { id: '1', awayTeamId: 'los-angeles-rams', homeTeamId: 'san-francisco-49ers', day: 'Thursday', time: '8:15 PM', pointsAtStake: 1 },
  
  // Sunday Early Games
  { id: '2', awayTeamId: 'miami-dolphins', homeTeamId: 'houston-texans', day: 'Sunday', time: '1:00 PM', pointsAtStake: 1 },
  { id: '3', awayTeamId: 'cincinnati-bengals', homeTeamId: 'tennessee-titans', day: 'Sunday', time: '1:00 PM', pointsAtStake: 1 },
  { id: '4', awayTeamId: 'new-york-jets', homeTeamId: 'jacksonville-jaguars', day: 'Sunday', time: '1:00 PM', pointsAtStake: 1 },
  { id: '5', awayTeamId: 'washington-commanders', homeTeamId: 'new-orleans-saints', day: 'Sunday', time: '1:00 PM', pointsAtStake: 1 },
  { id: '6', awayTeamId: 'new-york-giants', homeTeamId: 'baltimore-ravens', day: 'Sunday', time: '1:00 PM', pointsAtStake: 1 },
  { id: '7', awayTeamId: 'dallas-cowboys', homeTeamId: 'carolina-panthers', day: 'Sunday', time: '1:00 PM', pointsAtStake: 1 },
  
  // Sunday Afternoon Games
  { id: '8', awayTeamId: 'indianapolis-colts', homeTeamId: 'denver-broncos', day: 'Sunday', time: '4:05 PM', pointsAtStake: 1 },
  { id: '9', awayTeamId: 'new-england-patriots', homeTeamId: 'arizona-cardinals', day: 'Sunday', time: '4:25 PM', pointsAtStake: 1 },
  { id: '10', awayTeamId: 'los-angeles-chargers', homeTeamId: 'tampa-bay-buccaneers', day: 'Sunday', time: '4:25 PM', pointsAtStake: 1 },
  
  // Sunday Night
  { id: '11', awayTeamId: 'detroit-lions', homeTeamId: 'buffalo-bills', day: 'Sunday', time: '8:20 PM', pointsAtStake: 1 },
  
  // Monday Night
  { id: '12', awayTeamId: 'atlanta-falcons', homeTeamId: 'las-vegas-raiders', day: 'Monday', time: '8:30 PM', pointsAtStake: 1 },
  { id: '13', awayTeamId: 'green-bay-packers', homeTeamId: 'seattle-seahawks', day: 'Monday', time: '8:40 PM', pointsAtStake: 1 },
  
  // Other games
  { id: '14', awayTeamId: 'cleveland-browns', homeTeamId: 'kansas-city-chiefs', day: 'Sunday', time: '1:00 PM', pointsAtStake: 1 },
  { id: '15', awayTeamId: 'pittsburgh-steelers', homeTeamId: 'philadelphia-eagles', day: 'Sunday', time: '4:25 PM', pointsAtStake: 1 },
  { id: '16', awayTeamId: 'chicago-bears', homeTeamId: 'minnesota-vikings', day: 'Monday', time: '8:00 PM', pointsAtStake: 1 },
];

export function getTeamOwner(teamId: Team['id']): string | null {
  const players = getAllPlayers();
  
  for (const player of players) {
    const hasTeam = player.teams.some(team => team.teamId === teamId);
    if (hasTeam) {
      return player.name;
    }
  }
  
  return null;
}

export interface GameWithOwners extends Game {
  homeTeamOwner: string | null;
  awayTeamOwner: string | null;
  pointsAtStake: number;
}

function formatDayTime(dateString: string) {
  const date = new Date(dateString);
  const day = date.toLocaleDateString('en-US', { weekday: 'long' });
  const time = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

  return { day, time };
}

function toScheduleGame(apiGame: ApiGame): Game | null {
  const homeTeam = getTeamByName(apiGame.homeTeamName);
  const awayTeam = getTeamByName(apiGame.awayTeamName);
  if (!homeTeam || !awayTeam) return null;
  const winner = apiGame.winnerName ? getTeamByName(apiGame.winnerName) : undefined;

  const { day, time } = formatDayTime(apiGame.date);

  return {
    id: apiGame.id,
    homeTeamId: homeTeam.id,
    awayTeamId: awayTeam.id,
    day,
    time,
    pointsAtStake: apiGame.pointsAtStake ?? 1,
    completed: Boolean(apiGame.completed),
    winnerTeamId: winner?.id,
  };
}

function applyConferenceOverrides(games: Game[], phase: SchedulePhase, week: number | null) {
  if (phase !== 'postseason' || week !== 3) return games;
  return games.map((game) => {
    if (game.winnerTeamId) return game;
    if (game.homeTeamId === 'new-england-patriots' || game.awayTeamId === 'new-england-patriots') {
      return { ...game, winnerTeamId: 'new-england-patriots', completed: true };
    }
    if (game.homeTeamId === 'seattle-seahawks' || game.awayTeamId === 'seattle-seahawks') {
      return { ...game, winnerTeamId: 'seattle-seahawks', completed: true };
    }
    return game;
  });
}

export function getScheduleWithOwners(schedule: Game[]): GameWithOwners[] {
  return schedule.map((game) => {
    const homeTeamOwner = getTeamOwner(game.homeTeamId);
    const awayTeamOwner = getTeamOwner(game.awayTeamId);
    const hasOwner = Boolean(homeTeamOwner || awayTeamOwner);
    const pointsAtStake = hasOwner ? (game.pointsAtStake ?? 1) : 0;

    return {
      ...game,
      homeTeamOwner,
      awayTeamOwner,
      pointsAtStake,
    };
  });
}

export type SchedulePhase = 'current' | 'regular' | 'postseason';

export function useWeeklySchedule(
  phase: SchedulePhase,
  week: number | null,
  refreshKey?: number,
) {
  const [games, setGames] = useState<Game[]>(weeklySchedule);
  const [weekLabel, setWeekLabel] = useState<string | null>('Week 15 Schedule');
  const [currentWeek, setCurrentWeek] = useState<number | null>(null);
  const [currentSeasonType, setCurrentSeasonType] = useState<number | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        if (phase === 'current') {
          const local = getLocalCurrentSchedule();
          if (local && local.games.length > 0) {
            if (!active) return;
            const nextGames = local.games
              .map(toScheduleGame)
              .filter((game): game is Game => Boolean(game));
            setWeekLabel(local.weekLabel);
            setCurrentWeek(local.week);
            setCurrentSeasonType(local.seasonType ?? null);
            setGames(nextGames);
            return;
          }
        }

        if (phase !== 'current' && week) {
          const local = getLocalSchedule(phase, week);
          if (local && local.games.length > 0) {
            if (!active) return;
            const nextGames = local.games
              .map(toScheduleGame)
              .filter((game): game is Game => Boolean(game));
            setWeekLabel(local.weekLabel);
            setCurrentWeek(local.week);
            setCurrentSeasonType(local.seasonType);
            setGames(nextGames);
            return;
          }
        }

        const params = new URLSearchParams();
        if (phase && phase !== 'current') {
          params.set('phase', phase);
        }
        if (week !== null) {
          params.set('week', String(week));
        }
        const url = params.toString() ? `/api/schedule?${params.toString()}` : '/api/schedule';
        const response = await fetch(url);
        if (!response.ok) return;
        const data = (await response.json()) as ScheduleResponse;
        if (!active) return;

        const mappedGames = data.games
          .map(toScheduleGame)
          .filter((game): game is Game => Boolean(game));

        let nextGames = mappedGames;
        let nextWeekLabel =
          data.weekLabel ?? (data.week ? `Week ${data.week}` : 'This Week');
        setWeekLabel(label);
        setCurrentWeek(data.week ?? null);
        setCurrentSeasonType(data.seasonType ?? null);
        setGames(applyConferenceOverrides(mappedGames, phase, week));
      } catch {
        // Keep fallback schedule on error.
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [phase, week, refreshKey]);

  return { games, weekLabel, currentWeek, currentSeasonType };
}
