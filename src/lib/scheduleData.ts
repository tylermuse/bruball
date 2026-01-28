import { useEffect, useState } from 'react';
import { getAllPlayers } from './gameData';
import { getTeamByName } from '../data/teams';
import type { Team } from '../data/teams';

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

function applyConferenceOverrides(
  games: Game[],
  seasonType: number | null,
  week: number | null,
  weekLabel: string | null,
  selectedWeek: number | null,
  phase: SchedulePhase,
) {
  const isConferenceRound =
    (seasonType === 3 || phase === 'postseason') &&
    (week === 3 ||
      selectedWeek === 3 ||
      Boolean(weekLabel?.toLowerCase().includes('conference')));
  if (!isConferenceRound) return games;
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
        const params = new URLSearchParams();
        if (phase && phase !== 'current') {
          params.set('phase', phase);
        }
        if (week !== null) {
          params.set('week', String(week));
        }
        if (refreshKey) {
          params.set('t', String(refreshKey));
        }
        const url = params.toString() ? `/api/schedule?${params.toString()}` : '/api/schedule';
        const response = await fetch(url, { cache: 'no-store' });
        if (!response.ok) return;
        const data = (await response.json()) as ScheduleResponse;
        if (!active) return;

        const mappedGames = data.games
          .map(toScheduleGame)
          .filter((game): game is Game => Boolean(game));

        const label =
          data.weekLabel ?? (data.week ? `Week ${data.week}` : 'This Week');
        setWeekLabel(label);
        setCurrentWeek(data.week ?? null);
        setCurrentSeasonType(data.seasonType ?? null);
        setGames(
          applyConferenceOverrides(
            mappedGames,
            data.seasonType ?? null,
            data.week ?? null,
            data.weekLabel ?? null,
            week,
            phase,
          ),
        );
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
