import { getAllPlayers } from './gameData';

export interface Game {
  id: string;
  homeTeam: string;
  awayTeam: string;
  time: string;
  day: string;
}

// Week 15 NFL Schedule
export const weeklySchedule: Game[] = [
  // Thursday Night
  { id: '1', awayTeam: 'Los Angeles Rams', homeTeam: 'San Francisco 49ers', day: 'Thursday', time: '8:15 PM' },
  
  // Sunday Early Games
  { id: '2', awayTeam: 'Miami Dolphins', homeTeam: 'Houston Texans', day: 'Sunday', time: '1:00 PM' },
  { id: '3', awayTeam: 'Cincinnati Bengals', homeTeam: 'Tennessee Titans', day: 'Sunday', time: '1:00 PM' },
  { id: '4', awayTeam: 'New York Jets', homeTeam: 'Jacksonville Jaguars', day: 'Sunday', time: '1:00 PM' },
  { id: '5', awayTeam: 'Washington Commanders', homeTeam: 'New Orleans Saints', day: 'Sunday', time: '1:00 PM' },
  { id: '6', awayTeam: 'New York Giants', homeTeam: 'Baltimore Ravens', day: 'Sunday', time: '1:00 PM' },
  { id: '7', awayTeam: 'Dallas Cowboys', homeTeam: 'Carolina Panthers', day: 'Sunday', time: '1:00 PM' },
  
  // Sunday Afternoon Games
  { id: '8', awayTeam: 'Indianapolis Colts', homeTeam: 'Denver Broncos', day: 'Sunday', time: '4:05 PM' },
  { id: '9', awayTeam: 'New England Patriots', homeTeam: 'Arizona Cardinals', day: 'Sunday', time: '4:25 PM' },
  { id: '10', awayTeam: 'Los Angeles Chargers', homeTeam: 'Tampa Bay Buccaneers', day: 'Sunday', time: '4:25 PM' },
  
  // Sunday Night
  { id: '11', awayTeam: 'Detroit Lions', homeTeam: 'Buffalo Bills', day: 'Sunday', time: '8:20 PM' },
  
  // Monday Night
  { id: '12', awayTeam: 'Atlanta Falcons', homeTeam: 'Las Vegas Raiders', day: 'Monday', time: '8:30 PM' },
  { id: '13', awayTeam: 'Green Bay Packers', homeTeam: 'Seattle Seahawks', day: 'Monday', time: '8:40 PM' },
  
  // Other games
  { id: '14', awayTeam: 'Cleveland Browns', homeTeam: 'Kansas City Chiefs', day: 'Sunday', time: '1:00 PM' },
  { id: '15', awayTeam: 'Pittsburgh Steelers', homeTeam: 'Philadelphia Eagles', day: 'Sunday', time: '4:25 PM' },
  { id: '16', awayTeam: 'Chicago Bears', homeTeam: 'Minnesota Vikings', day: 'Monday', time: '8:00 PM' },
];

export function getTeamOwner(teamName: string): string | null {
  const players = getAllPlayers();
  
  for (const player of players) {
    const hasTeam = player.teams.some(team => team.name === teamName);
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

export function getScheduleWithOwners(): GameWithOwners[] {
  return weeklySchedule.map(game => {
    const homeTeamOwner = getTeamOwner(game.homeTeam);
    const awayTeamOwner = getTeamOwner(game.awayTeam);
    const pointsAtStake = (homeTeamOwner || awayTeamOwner) ? 1 : 0;
    
    return {
      ...game,
      homeTeamOwner,
      awayTeamOwner,
      pointsAtStake,
    };
  });
}
