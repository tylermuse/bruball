import { getCurrentPlayer } from '../lib/gameData';
import { TeamLogo } from '../lib/teamLogos';

export function TeamTracker() {
  const player = getCurrentPlayer();
  
  // Sort teams by wins (best to worst)
  const sortedTeams = [...player.teams].sort((a, b) => b.wins - a.wins);

  return (
    <div className="space-y-4">
      {/* Summary Card */}
      <div className="bg-fuchsia-50 rounded-xl p-5 shadow-sm border border-fuchsia-200">
        <div className="text-sm text-gray-600 mb-1">Your Total Points</div>
        <div className="text-4xl text-gray-900 mb-3">{player.totalPoints}</div>
        <div className="flex items-center gap-4 text-sm text-gray-700">
          <div>
            <span className="text-gray-600">Games Played:</span>
            <span className="ml-2 font-medium">{player.teams.reduce((sum, t) => sum + t.gamesPlayed, 0)}</span>
          </div>
          <div className="h-4 w-px bg-fuchsia-300" />
          <div>
            <span className="text-gray-600">Projected:</span>
            <span className="ml-2 font-medium">{player.projectedTotal}</span>
          </div>
        </div>
      </div>

      {/* Teams List */}
      <div className="space-y-3">
        {sortedTeams.map((team) => (
          <div
            key={team.name}
            className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm"
          >
            <div className="flex items-start gap-3 mb-2">
              <TeamLogo teamName={team.name} size="md" />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900">{team.name}</div>
                <div className="text-sm text-gray-500 mt-0.5">{team.division}</div>
              </div>
              <div className="text-right">
                <div className="text-lg text-gray-900">
                  {team.wins}-{team.losses}
                </div>
                <div className="text-xs text-gray-500">Record</div>
              </div>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-gray-200">
              <div>
                <div className="text-lg text-fuchsia-600">{team.wins}</div>
                <div className="text-xs text-gray-500">Points</div>
              </div>
              <div>
                <div className="text-lg text-gray-900">{17 - team.gamesPlayed}</div>
                <div className="text-xs text-gray-500">Games Remaining</div>
              </div>
            </div>

            {/* Win Progress Bar */}
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                <span>Season Progress</span>
                <span>{Math.round((team.gamesPlayed / 17) * 100)}%</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-fuchsia-600 to-fuchsia-500 rounded-full transition-all"
                  style={{ width: `${(team.wins / 17) * 100}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}