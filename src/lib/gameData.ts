import type { Team } from '../data/teams';

export interface TeamRecord {
  teamId: Team['id'];
  wins: number;
  losses: number;
  gamesPlayed: number;
  projectedWins: number; // Projected total wins by end of season
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

// Mock data for the game
export const mockPlayers: Player[] = [
  {
    id: 'tyler',
    name: 'Tyler',
    totalPoints: 0,
    projectedTotal: 136,
    teams: [
      { teamId: 'kansas-city-chiefs', wins: 0, losses: 0, gamesPlayed: 0, projectedWins: 0 },
      { teamId: 'baltimore-ravens', wins: 0, losses: 0, gamesPlayed: 0, projectedWins: 0 },
      { teamId: 'tampa-bay-buccaneers', wins: 0, losses: 0, gamesPlayed: 0, projectedWins: 0 },
      { teamId: 'washington-commanders', wins: 0, losses: 0, gamesPlayed: 0, projectedWins: 0 },
      { teamId: 'jacksonville-jaguars', wins: 0, losses: 0, gamesPlayed: 0, projectedWins: 0 },
      { teamId: 'chicago-bears', wins: 0, losses: 0, gamesPlayed: 0, projectedWins: 0 },
      { teamId: 'new-england-patriots', wins: 0, losses: 0, gamesPlayed: 0, projectedWins: 0 },
      { teamId: 'seattle-seahawks', wins: 0, losses: 0, gamesPlayed: 0, projectedWins: 0 },
    ],
  },
  {
    id: 'austin',
    name: 'Austin',
    totalPoints: 0,
    projectedTotal: 136,
    teams: [
      { teamId: 'buffalo-bills', wins: 0, losses: 0, gamesPlayed: 0, projectedWins: 0 },
      { teamId: 'los-angeles-rams', wins: 0, losses: 0, gamesPlayed: 0, projectedWins: 0 },
      { teamId: 'dallas-cowboys', wins: 0, losses: 0, gamesPlayed: 0, projectedWins: 0 },
      { teamId: 'los-angeles-chargers', wins: 0, losses: 0, gamesPlayed: 0, projectedWins: 0 },
      { teamId: 'minnesota-vikings', wins: 0, losses: 0, gamesPlayed: 0, projectedWins: 0 },
      { teamId: 'atlanta-falcons', wins: 0, losses: 0, gamesPlayed: 0, projectedWins: 0 },
      { teamId: 'cleveland-browns', wins: 0, losses: 0, gamesPlayed: 0, projectedWins: 0 },
      { teamId: 'tennessee-titans', wins: 0, losses: 0, gamesPlayed: 0, projectedWins: 0 },
    ],
  },
  {
    id: 'lindy',
    name: 'Lindy',
    totalPoints: 0,
    projectedTotal: 136,
    teams: [
      { teamId: 'detroit-lions', wins: 0, losses: 0, gamesPlayed: 0, projectedWins: 0 },
      { teamId: 'cincinnati-bengals', wins: 0, losses: 0, gamesPlayed: 0, projectedWins: 0 },
      { teamId: 'houston-texans', wins: 0, losses: 0, gamesPlayed: 0, projectedWins: 0 },
      { teamId: 'denver-broncos', wins: 0, losses: 0, gamesPlayed: 0, projectedWins: 0 },
      { teamId: 'arizona-cardinals', wins: 0, losses: 0, gamesPlayed: 0, projectedWins: 0 },
      { teamId: 'carolina-panthers', wins: 0, losses: 0, gamesPlayed: 0, projectedWins: 0 },
      { teamId: 'miami-dolphins', wins: 0, losses: 0, gamesPlayed: 0, projectedWins: 0 },
      { teamId: 'new-york-giants', wins: 0, losses: 0, gamesPlayed: 0, projectedWins: 0 },
    ],
  },
  {
    id: 'nick',
    name: 'Nick',
    totalPoints: 0,
    projectedTotal: 136,
    teams: [
      { teamId: 'philadelphia-eagles', wins: 0, losses: 0, gamesPlayed: 0, projectedWins: 0 },
      { teamId: 'green-bay-packers', wins: 0, losses: 0, gamesPlayed: 0, projectedWins: 0 },
      { teamId: 'san-francisco-49ers', wins: 0, losses: 0, gamesPlayed: 0, projectedWins: 0 },
      { teamId: 'pittsburgh-steelers', wins: 0, losses: 0, gamesPlayed: 0, projectedWins: 0 },
      { teamId: 'indianapolis-colts', wins: 0, losses: 0, gamesPlayed: 0, projectedWins: 0 },
      { teamId: 'new-orleans-saints', wins: 0, losses: 0, gamesPlayed: 0, projectedWins: 0 },
      { teamId: 'new-york-jets', wins: 0, losses: 0, gamesPlayed: 0, projectedWins: 0 },
      { teamId: 'las-vegas-raiders', wins: 0, losses: 0, gamesPlayed: 0, projectedWins: 0 },
    ],
  },
];

export const draftPicks: DraftPick[] = [
  { pickNumber: 1, playerId: 'austin', teamId: 'buffalo-bills' },
  { pickNumber: 2, playerId: 'lindy', teamId: 'detroit-lions' },
  { pickNumber: 3, playerId: 'nick', teamId: 'philadelphia-eagles' },
  { pickNumber: 4, playerId: 'tyler', teamId: 'kansas-city-chiefs' },
  { pickNumber: 5, playerId: 'tyler', teamId: 'baltimore-ravens' },
  { pickNumber: 6, playerId: 'nick', teamId: 'green-bay-packers' },
  { pickNumber: 7, playerId: 'lindy', teamId: 'cincinnati-bengals' },
  { pickNumber: 8, playerId: 'austin', teamId: 'los-angeles-rams' },
  { pickNumber: 9, playerId: 'austin', teamId: 'dallas-cowboys' },
  { pickNumber: 10, playerId: 'lindy', teamId: 'houston-texans' },
  { pickNumber: 11, playerId: 'nick', teamId: 'san-francisco-49ers' },
  { pickNumber: 12, playerId: 'tyler', teamId: 'tampa-bay-buccaneers' },
  { pickNumber: 13, playerId: 'tyler', teamId: 'washington-commanders' },
  { pickNumber: 14, playerId: 'nick', teamId: 'pittsburgh-steelers' },
  { pickNumber: 15, playerId: 'lindy', teamId: 'denver-broncos' },
  { pickNumber: 16, playerId: 'austin', teamId: 'los-angeles-chargers' },
  { pickNumber: 17, playerId: 'austin', teamId: 'minnesota-vikings' },
  { pickNumber: 18, playerId: 'lindy', teamId: 'arizona-cardinals' },
  { pickNumber: 19, playerId: 'nick', teamId: 'indianapolis-colts' },
  { pickNumber: 20, playerId: 'tyler', teamId: 'jacksonville-jaguars' },
  { pickNumber: 21, playerId: 'tyler', teamId: 'chicago-bears' },
  { pickNumber: 22, playerId: 'nick', teamId: 'new-orleans-saints' },
  { pickNumber: 23, playerId: 'lindy', teamId: 'carolina-panthers' },
  { pickNumber: 24, playerId: 'austin', teamId: 'atlanta-falcons' },
  { pickNumber: 25, playerId: 'austin', teamId: 'cleveland-browns' },
  { pickNumber: 26, playerId: 'lindy', teamId: 'miami-dolphins' },
  { pickNumber: 27, playerId: 'nick', teamId: 'new-york-jets' },
  { pickNumber: 28, playerId: 'tyler', teamId: 'new-england-patriots' },
  { pickNumber: 29, playerId: 'tyler', teamId: 'seattle-seahawks' },
  { pickNumber: 30, playerId: 'nick', teamId: 'las-vegas-raiders' },
  { pickNumber: 31, playerId: 'lindy', teamId: 'new-york-giants' },
  { pickNumber: 32, playerId: 'austin', teamId: 'tennessee-titans' },
];

export function getCurrentPlayer(): Player {
  return mockPlayers[0];
}

export function getAllPlayers(): Player[] {
  return mockPlayers;
}
