import { Shield } from 'lucide-react';

// Team color mapping for logo backgrounds
export const teamColors: Record<string, string> = {
  // AFC East
  'Buffalo Bills': '#00338D',
  'Miami Dolphins': '#008E97',
  'New England Patriots': '#002244',
  'New York Jets': '#125740',
  
  // AFC North
  'Baltimore Ravens': '#241773',
  'Cincinnati Bengals': '#FB4F14',
  'Cleveland Browns': '#311D00',
  'Pittsburgh Steelers': '#FFB612',
  
  // AFC South
  'Houston Texans': '#03202F',
  'Indianapolis Colts': '#002C5F',
  'Jacksonville Jaguars': '#006778',
  'Tennessee Titans': '#0C2340',
  
  // AFC West
  'Denver Broncos': '#FB4F14',
  'Kansas City Chiefs': '#E31837',
  'Las Vegas Raiders': '#000000',
  'Los Angeles Chargers': '#0080C6',
  
  // NFC East
  'Dallas Cowboys': '#041E42',
  'New York Giants': '#0B2265',
  'Philadelphia Eagles': '#004C54',
  'Washington Commanders': '#5A1414',
  
  // NFC North
  'Chicago Bears': '#0B162A',
  'Detroit Lions': '#0076B6',
  'Green Bay Packers': '#203731',
  'Minnesota Vikings': '#4F2683',
  
  // NFC South
  'Atlanta Falcons': '#A71930',
  'Carolina Panthers': '#0085CA',
  'New Orleans Saints': '#D3BC8D',
  'Tampa Bay Buccaneers': '#D50A0A',
  
  // NFC West
  'Arizona Cardinals': '#97233F',
  'Los Angeles Rams': '#003594',
  'San Francisco 49ers': '#AA0000',
  'Seattle Seahawks': '#002244',
};

interface TeamLogoProps {
  teamName: string;
  size?: 'sm' | 'md' | 'lg';
}

export function TeamLogo({ teamName, size = 'md' }: TeamLogoProps) {
  const color = teamColors[teamName] || '#6B7280';
  
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };
  
  const iconSizes = {
    sm: 'size-4',
    md: 'size-5',
    lg: 'size-6',
  };
  
  return (
    <div
      className={`${sizeClasses[size]} rounded-lg flex items-center justify-center shadow-sm`}
      style={{ backgroundColor: color }}
    >
      <Shield className={`${iconSizes[size]} text-white`} />
    </div>
  );
}
