import { getScheduleWithOwners } from '../lib/scheduleData';
import { TeamLogo } from '../lib/teamLogos';

export function Schedule() {
  const schedule = getScheduleWithOwners();
  
  // Group games by day
  const gamesByDay = schedule.reduce((acc, game) => {
    if (!acc[game.day]) {
      acc[game.day] = [];
    }
    acc[game.day].push(game);
    return acc;
  }, {} as Record<string, typeof schedule>);
  
  const dayOrder = ['Thursday', 'Sunday', 'Monday'];
  
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-fuchsia-50 rounded-xl p-5 shadow-sm border border-fuchsia-200">
        <div className="text-sm text-gray-600 mb-1">Week 15 Schedule</div>
        <div className="text-2xl text-gray-900">NFL Games This Week</div>
      </div>

      {/* Games by Day */}
      {dayOrder.map(day => {
        const games = gamesByDay[day];
        if (!games) return null;
        
        return (
          <div key={day}>
            <h3 className="text-sm font-medium text-gray-600 mb-2 px-1">{day}</h3>
            <div className="space-y-2">
              {games.map(game => {
                const hasYourTeam = game.homeTeamOwner === 'You' || game.awayTeamOwner === 'You';
                
                return (
                  <div
                    key={game.id}
                    className={`rounded-lg p-4 shadow-sm ${
                      hasYourTeam
                        ? 'bg-fuchsia-50 border border-fuchsia-200'
                        : 'bg-white border border-gray-200'
                    }`}
                  >
                    {/* Game Time */}
                    <div className="text-xs text-gray-500 mb-3">{game.time}</div>
                    
                    {/* Away Team */}
                    <div className="flex items-center gap-3 mb-2">
                      <TeamLogo teamName={game.awayTeam} size="sm" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900">{game.awayTeam}</div>
                      </div>
                      {game.awayTeamOwner && (
                        <div className={`text-xs px-2 py-1 rounded-full ${
                          game.awayTeamOwner === 'You'
                            ? 'bg-fuchsia-600 text-white'
                            : 'bg-gray-200 text-gray-700'
                        }`}>
                          {game.awayTeamOwner}
                        </div>
                      )}
                    </div>
                    
                    {/* VS Divider */}
                    <div className="flex items-center gap-2 my-2 ml-11">
                      <div className="text-xs text-gray-400">@</div>
                    </div>
                    
                    {/* Home Team */}
                    <div className="flex items-center gap-3">
                      <TeamLogo teamName={game.homeTeam} size="sm" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900">{game.homeTeam}</div>
                      </div>
                      {game.homeTeamOwner && (
                        <div className={`text-xs px-2 py-1 rounded-full ${
                          game.homeTeamOwner === 'You'
                            ? 'bg-fuchsia-600 text-white'
                            : 'bg-gray-200 text-gray-700'
                        }`}>
                          {game.homeTeamOwner}
                        </div>
                      )}
                    </div>
                    
                    {/* Points at Stake */}
                    {game.pointsAtStake > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="text-xs text-gray-600">
                          <span className="font-medium text-fuchsia-600">{game.pointsAtStake} point</span> at stake for the winner
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
