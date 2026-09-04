import type { Team } from '../data/teams';
import { rostersAsPlayers } from './draftStore';

export interface TeamRecord {
  teamId: Team['id'];
  wins: number;
  losses: number;
  gamesPlayed: number;
  projectedWins: number;
}

export interface Player {
  id: string;
  name: string;
  teams: TeamRecord[];
  totalPoints: number;
  projectedTotal: number;
}

export interface DraftPick {
  pickNumber: number;
  playerId: Player['id'];
  teamId: Team['id'];
}

// Rosters now come from the live draft (see draftStore). Before the league
// drafts, every member simply has an empty roster.
export function getAllPlayers(): Player[] {
  return rostersAsPlayers();
}

export function getCurrentPlayer(): Player {
  return getAllPlayers()[0];
}

// Legacy export kept for compatibility; the live draft board reads from draftStore.
export const draftPicks: DraftPick[] = [];
