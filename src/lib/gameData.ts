// NFL Divisions
export const NFL_DIVISIONS = [
  'AFC East',
  'AFC North',
  'AFC South',
  'AFC West',
  'NFC East',
  'NFC North',
  'NFC South',
  'NFC West',
] as const;

export type Division = typeof NFL_DIVISIONS[number];

export interface Team {
  name: string;
  division: Division;
  wins: number;
  losses: number;
  gamesPlayed: number;
  projectedWins: number; // Projected total wins by end of season
}

export interface Player {
  id: string;
  name: string;
  teams: Team[];
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
      { name: 'Buffalo Bills', division: 'AFC East', wins: 11, losses: 3, gamesPlayed: 14, projectedWins: 13 },
      { name: 'Pittsburgh Steelers', division: 'AFC North', wins: 9, losses: 5, gamesPlayed: 14, projectedWins: 10 },
      { name: 'Houston Texans', division: 'AFC South', wins: 8, losses: 6, gamesPlayed: 14, projectedWins: 9 },
      { name: 'Kansas City Chiefs', division: 'AFC West', wins: 12, losses: 2, gamesPlayed: 14, projectedWins: 14 },
      { name: 'Philadelphia Eagles', division: 'NFC East', wins: 10, losses: 4, gamesPlayed: 14, projectedWins: 12 },
      { name: 'Detroit Lions', division: 'NFC North', wins: 11, losses: 3, gamesPlayed: 14, projectedWins: 13 },
      { name: 'Tampa Bay Buccaneers', division: 'NFC South', wins: 7, losses: 7, gamesPlayed: 14, projectedWins: 8 },
      { name: 'Los Angeles Rams', division: 'NFC West', wins: 8, losses: 6, gamesPlayed: 14, projectedWins: 10 },
    ],
  },
  {
    id: '2',
    name: 'Alex',
    totalPoints: 71,
    projectedTotal: 145,
    teams: [
      { name: 'Miami Dolphins', division: 'AFC East', wins: 6, losses: 8, gamesPlayed: 14, projectedWins: 7 },
      { name: 'Baltimore Ravens', division: 'AFC North', wins: 10, losses: 4, gamesPlayed: 14, projectedWins: 12 },
      { name: 'Jacksonville Jaguars', division: 'AFC South', wins: 3, losses: 11, gamesPlayed: 14, projectedWins: 4 },
      { name: 'Los Angeles Chargers', division: 'AFC West', wins: 9, losses: 5, gamesPlayed: 14, projectedWins: 11 },
      { name: 'Dallas Cowboys', division: 'NFC East', wins: 6, losses: 8, gamesPlayed: 14, projectedWins: 7 },
      { name: 'Minnesota Vikings', division: 'NFC North', wins: 12, losses: 2, gamesPlayed: 14, projectedWins: 14 },
      { name: 'Atlanta Falcons', division: 'NFC South', wins: 7, losses: 7, gamesPlayed: 14, projectedWins: 9 },
      { name: 'Seattle Seahawks', division: 'NFC West', wins: 8, losses: 6, gamesPlayed: 14, projectedWins: 10 },
    ],
  },
  {
    id: '3',
    name: 'Jordan',
    totalPoints: 64,
    projectedTotal: 138,
    teams: [
      { name: 'New York Jets', division: 'AFC East', wins: 4, losses: 10, gamesPlayed: 14, projectedWins: 5 },
      { name: 'Cleveland Browns', division: 'AFC North', wins: 3, losses: 11, gamesPlayed: 14, projectedWins: 4 },
      { name: 'Indianapolis Colts', division: 'AFC South', wins: 6, losses: 8, gamesPlayed: 14, projectedWins: 7 },
      { name: 'Denver Broncos', division: 'AFC West', wins: 9, losses: 5, gamesPlayed: 14, projectedWins: 11 },
      { name: 'Washington Commanders', division: 'NFC East', wins: 10, losses: 4, gamesPlayed: 14, projectedWins: 11 },
      { name: 'Green Bay Packers', division: 'NFC North', wins: 10, losses: 4, gamesPlayed: 14, projectedWins: 12 },
      { name: 'New Orleans Saints', division: 'NFC South', wins: 5, losses: 9, gamesPlayed: 14, projectedWins: 6 },
      { name: 'San Francisco 49ers', division: 'NFC West', wins: 6, losses: 8, gamesPlayed: 14, projectedWins: 7 },
    ],
  },
  {
    id: '4',
    name: 'Sam',
    totalPoints: 69,
    projectedTotal: 140,
    teams: [
      { name: 'New England Patriots', division: 'AFC East', wins: 3, losses: 11, gamesPlayed: 14, projectedWins: 4 },
      { name: 'Cincinnati Bengals', division: 'AFC North', wins: 6, losses: 8, gamesPlayed: 14, projectedWins: 8 },
      { name: 'Tennessee Titans', division: 'AFC South', wins: 3, losses: 11, gamesPlayed: 14, projectedWins: 4 },
      { name: 'Las Vegas Raiders', division: 'AFC West', wins: 3, losses: 11, gamesPlayed: 14, projectedWins: 4 },
      { name: 'New York Giants', division: 'NFC East', wins: 2, losses: 12, gamesPlayed: 14, projectedWins: 3 },
      { name: 'Chicago Bears', division: 'NFC North', wins: 4, losses: 10, gamesPlayed: 14, projectedWins: 5 },
      { name: 'Carolina Panthers', division: 'NFC South', wins: 3, losses: 11, gamesPlayed: 14, projectedWins: 4 },
      { name: 'Arizona Cardinals', division: 'NFC West', wins: 7, losses: 7, gamesPlayed: 14, projectedWins: 9 },
    ],
  },
];

export function getCurrentPlayer(): Player {
  return mockPlayers[0];
}

export function getAllPlayers(): Player[] {
  return mockPlayers;
}
