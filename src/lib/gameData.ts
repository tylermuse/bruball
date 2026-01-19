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
    id: '1',
    name: 'You',
    totalPoints: 67,
    projectedTotal: 142,
    teams: [
      { teamId: 'buffalo-bills', wins: 11, losses: 3, gamesPlayed: 14, projectedWins: 13 },
      { teamId: 'pittsburgh-steelers', wins: 9, losses: 5, gamesPlayed: 14, projectedWins: 10 },
      { teamId: 'houston-texans', wins: 8, losses: 6, gamesPlayed: 14, projectedWins: 9 },
      { teamId: 'kansas-city-chiefs', wins: 12, losses: 2, gamesPlayed: 14, projectedWins: 14 },
      { teamId: 'philadelphia-eagles', wins: 10, losses: 4, gamesPlayed: 14, projectedWins: 12 },
      { teamId: 'detroit-lions', wins: 11, losses: 3, gamesPlayed: 14, projectedWins: 13 },
      { teamId: 'tampa-bay-buccaneers', wins: 7, losses: 7, gamesPlayed: 14, projectedWins: 8 },
      { teamId: 'los-angeles-rams', wins: 8, losses: 6, gamesPlayed: 14, projectedWins: 10 },
    ],
  },
  {
    id: '2',
    name: 'Alex',
    totalPoints: 71,
    projectedTotal: 145,
    teams: [
      { teamId: 'miami-dolphins', wins: 6, losses: 8, gamesPlayed: 14, projectedWins: 7 },
      { teamId: 'baltimore-ravens', wins: 10, losses: 4, gamesPlayed: 14, projectedWins: 12 },
      { teamId: 'jacksonville-jaguars', wins: 3, losses: 11, gamesPlayed: 14, projectedWins: 4 },
      { teamId: 'los-angeles-chargers', wins: 9, losses: 5, gamesPlayed: 14, projectedWins: 11 },
      { teamId: 'dallas-cowboys', wins: 6, losses: 8, gamesPlayed: 14, projectedWins: 7 },
      { teamId: 'minnesota-vikings', wins: 12, losses: 2, gamesPlayed: 14, projectedWins: 14 },
      { teamId: 'atlanta-falcons', wins: 7, losses: 7, gamesPlayed: 14, projectedWins: 9 },
      { teamId: 'seattle-seahawks', wins: 8, losses: 6, gamesPlayed: 14, projectedWins: 10 },
    ],
  },
  {
    id: '3',
    name: 'Jordan',
    totalPoints: 64,
    projectedTotal: 138,
    teams: [
      { teamId: 'new-york-jets', wins: 4, losses: 10, gamesPlayed: 14, projectedWins: 5 },
      { teamId: 'cleveland-browns', wins: 3, losses: 11, gamesPlayed: 14, projectedWins: 4 },
      { teamId: 'indianapolis-colts', wins: 6, losses: 8, gamesPlayed: 14, projectedWins: 7 },
      { teamId: 'denver-broncos', wins: 9, losses: 5, gamesPlayed: 14, projectedWins: 11 },
      { teamId: 'washington-commanders', wins: 10, losses: 4, gamesPlayed: 14, projectedWins: 11 },
      { teamId: 'green-bay-packers', wins: 10, losses: 4, gamesPlayed: 14, projectedWins: 12 },
      { teamId: 'new-orleans-saints', wins: 5, losses: 9, gamesPlayed: 14, projectedWins: 6 },
      { teamId: 'san-francisco-49ers', wins: 6, losses: 8, gamesPlayed: 14, projectedWins: 7 },
    ],
  },
  {
    id: '4',
    name: 'Sam',
    totalPoints: 69,
    projectedTotal: 140,
    teams: [
      { teamId: 'new-england-patriots', wins: 3, losses: 11, gamesPlayed: 14, projectedWins: 4 },
      { teamId: 'cincinnati-bengals', wins: 6, losses: 8, gamesPlayed: 14, projectedWins: 8 },
      { teamId: 'tennessee-titans', wins: 3, losses: 11, gamesPlayed: 14, projectedWins: 4 },
      { teamId: 'las-vegas-raiders', wins: 3, losses: 11, gamesPlayed: 14, projectedWins: 4 },
      { teamId: 'new-york-giants', wins: 2, losses: 12, gamesPlayed: 14, projectedWins: 3 },
      { teamId: 'chicago-bears', wins: 4, losses: 10, gamesPlayed: 14, projectedWins: 5 },
      { teamId: 'carolina-panthers', wins: 3, losses: 11, gamesPlayed: 14, projectedWins: 4 },
      { teamId: 'arizona-cardinals', wins: 7, losses: 7, gamesPlayed: 14, projectedWins: 9 },
    ],
  },
];

export function getCurrentPlayer(): Player {
  return mockPlayers[0];
}

export function getAllPlayers(): Player[] {
  return mockPlayers;
}
