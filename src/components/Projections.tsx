import { getAllPlayers } from '../lib/gameData';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { TeamLogo } from '../lib/teamLogos';
import { getTeamById } from '../data/teams';
import { getPlayerPoints, resolveTeamRecord, usePlayoffs, useStandings } from '../lib/standings';

export function Projections() {
  const players = getAllPlayers();
  const currentPlayer = players.find(p => p.name === 'You')!;
  const { standings } = useStandings();
  const { playoffs } = usePlayoffs();
  const currentPoints = getPlayerPoints(currentPlayer, standings, playoffs);
  
  // Sort by projected total
  const projectedStandings = [...players].sort((a, b) => b.projectedTotal - a.projectedTotal);
  const projectedRank = projectedStandings.findIndex(p => p.name === 'You') + 1;
  
  // Calculate remaining games and points
  const totalGamesPerTeam = 17;
  const gamesPlayed = resolveTeamRecord(currentPlayer.teams[0], standings).gamesPlayed;
  const gamesRemaining = totalGamesPerTeam - gamesPlayed;
  const pointsRemaining = currentPlayer.projectedTotal - currentPoints;

  return (
    <div className="space-y-4">
      {/* Your Projection Card */}
      <div className="bg-fuchsia-50 rounded-xl p-5 shadow-sm border border-fuchsia-200">
        <div className="text-sm text-gray-600 mb-1">Your Projected Total</div>
        <div className="flex items-end gap-3 mb-4">
          <div className="text-4xl text-gray-900">{currentPlayer.projectedTotal}</div>
          <div className="text-gray-600 mb-1">points by season end</div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-fuchsia-200">
          <div>
            <div className="text-2xl text-gray-900">{currentPoints}</div>
            <div className="text-sm text-gray-600">Current Points</div>
          </div>
          <div>
            <div className="text-2xl text-gray-900">+{pointsRemaining}</div>
            <div className="text-sm text-gray-600">Projected Remaining</div>
          </div>
        </div>
      </div>

      {/* Games Remaining */}
      <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-600">Games Remaining</div>
            <div className="text-2xl text-gray-900 mt-1">{gamesRemaining}</div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600">Per Team</div>
            <div className="text-2xl text-gray-900 mt-1">{gamesRemaining}</div>
          </div>
        </div>
        <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-fuchsia-600 to-fuchsia-500 rounded-full"
            style={{ width: `${(gamesPlayed / totalGamesPerTeam) * 100}%` }}
          />
        </div>
        <div className="text-center text-xs text-gray-500 mt-2">
          Week {gamesPlayed} of {totalGamesPerTeam} complete
        </div>
      </div>

      {/* Projected Standings */}
      <div>
        <h3 className="text-sm text-gray-600 mb-3">Projected Final Standings</h3>
        <div className="space-y-2">
          {projectedStandings.map((player, index) => {
            const currentRank = players
              .map((p) => ({
                ...p,
                livePoints: getPlayerPoints(p, standings, playoffs),
              }))
              .sort((a, b) => b.livePoints - a.livePoints)
              .findIndex(p => p.id === player.id) + 1;
            const projRank = index + 1;
            const rankChange = currentRank - projRank;
            const isCurrentUser = player.name === 'You';

            return (
              <div
                key={player.id}
                className={`rounded-lg p-3 flex items-center gap-3 shadow-sm ${
                  isCurrentUser
                    ? 'bg-fuchsia-50 border border-fuchsia-200'
                    : 'bg-white border border-gray-200'
                }`}
              >
                {/* Projected Rank */}
                <div className="w-8 text-center text-lg text-gray-900">{projRank}</div>

                {/* Rank Change Indicator */}
                <div className="w-6 flex items-center justify-center">
                  {rankChange > 0 && (
                    <TrendingUp className="size-4 text-green-500" />
                  )}
                  {rankChange < 0 && (
                    <TrendingDown className="size-4 text-red-500" />
                  )}
                  {rankChange === 0 && (
                    <Minus className="size-4 text-gray-400" />
                  )}
                </div>

                {/* Player Name */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-900">
                      {player.name}
                    </span>
                    {isCurrentUser && (
                      <span className="text-xs bg-fuchsia-600 text-white px-2 py-0.5 rounded-full">
                        You
                      </span>
                    )}
                  </div>
                </div>

                {/* Projected Points */}
                <div className="text-right">
                  <div className="text-lg text-gray-900">{player.projectedTotal}</div>
                  <div className={`text-xs ${isCurrentUser ? 'text-gray-600' : 'text-gray-500'}`}>
                    projected
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Best/Worst Performing Teams */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 shadow-sm">
          <div className="text-xs text-green-700 mb-2">Best Team</div>
          {(() => {
            const bestTeam = [...currentPlayer.teams].sort(
              (a, b) =>
                resolveTeamRecord(b, standings).wins -
                resolveTeamRecord(a, standings).wins,
            )[0];
            const bestTeamInfo = getTeamById(bestTeam.teamId);
            if (!bestTeamInfo) return null;
            const bestRecord = resolveTeamRecord(bestTeam, standings);

            return (
              <>
                <div className="flex items-center gap-2 mb-2">
                  <TeamLogo teamId={bestTeam.teamId} size="sm" />
                </div>
                <div className="text-sm font-medium text-gray-900">{bestTeamInfo.name}</div>
                <div className="text-lg text-green-600 mt-1">{bestRecord.wins} wins</div>
              </>
            );
          })()}
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-3 shadow-sm">
          <div className="text-xs text-red-700 mb-2">Needs Help</div>
          {(() => {
            const worstTeam = [...currentPlayer.teams].sort(
              (a, b) =>
                resolveTeamRecord(a, standings).wins -
                resolveTeamRecord(b, standings).wins,
            )[0];
            const worstTeamInfo = getTeamById(worstTeam.teamId);
            if (!worstTeamInfo) return null;
            const worstRecord = resolveTeamRecord(worstTeam, standings);

            return (
              <>
                <div className="flex items-center gap-2 mb-2">
                  <TeamLogo teamId={worstTeam.teamId} size="sm" />
                </div>
                <div className="text-sm font-medium text-gray-900">{worstTeamInfo.name}</div>
                <div className="text-lg text-red-600 mt-1">{worstRecord.wins} wins</div>
              </>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
