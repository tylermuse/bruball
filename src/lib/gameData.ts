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

export function getCurrentPlayer(): Player {
  return mockPlayers[0];
}

export function getAllPlayers(): Player[] {
  return mockPlayers;
}
