import { Shield } from 'lucide-react';
import { TEAM_BY_ID, type Team } from '../data/teams';

interface TeamLogoProps {
  teamId: Team['id'];
  size?: 'sm' | 'md' | 'lg';
}

export function TeamLogo({ teamId, size = 'md' }: TeamLogoProps) {
  const color = TEAM_BY_ID[teamId]?.primaryColor ?? '#6B7280';
  
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
