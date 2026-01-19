import { getAllPlayers, getCurrentPlayer } from '../lib/gameData';
import { Medal, Crown } from 'lucide-react';
import { TeamLogo } from '../lib/teamLogos';
import { getTeamById } from '../data/teams';
import { getPlayerPoints, getTeamPoints, resolveTeamRecord, usePlayoffs, useStandings } from '../lib/standings';

export function Leaderboard() {
  const currentPlayer = getCurrentPlayer();
  const { standings } = useStandings();
  const { playoffs } = usePlayoffs();
  const players = getAllPlayers()
    .map((player) => ({
      ...player,
      livePoints: getPlayerPoints(player, standings, playoffs),
    }))
    .sort((a, b) => b.livePoints - a.livePoints);
  const currentRank = players.findIndex((player) => player.id === currentPlayer.id) + 1;
  const leaderPoints = players[0]?.livePoints ?? 0;
  const currentPoints =
    players.find((player) => player.id === currentPlayer.id)?.livePoints ?? 0;
  const pointsBehind = Math.max(leaderPoints - currentPoints, 0);

  const getMedalIcon = (rank: number) => {
    if (rank === 1) return <Crown className="size-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="size-5 text-gray-400" />;
    if (rank === 3) return <Medal className="size-5 text-amber-600" />;
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-fuchsia-50 rounded-xl p-6 shadow-sm border border-fuchsia-200">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-sm text-gray-600 mb-1">Season Standings</div>
            <h2 className="text-3xl font-bold text-gray-900">Leaderboard</h2>
            <p className="text-sm text-gray-600 mt-2">Ranked by total wins</p>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-700">
            <div className="rounded-lg bg-white px-3 py-2 border border-fuchsia-100">
              <div className="text-xs text-gray-500">Your Rank</div>
              <div className="text-lg font-semibold text-gray-900">#{currentRank}</div>
            </div>
            <div className="rounded-lg bg-white px-3 py-2 border border-fuchsia-100">
              <div className="text-xs text-gray-500">Your Points</div>
              <div className="text-lg font-semibold text-gray-900">{currentPoints}</div>
            </div>
            <div className="rounded-lg bg-white px-3 py-2 border border-fuchsia-100">
              <div className="text-xs text-gray-500">Points Behind</div>
              <div className="text-lg font-semibold text-gray-900">{pointsBehind}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="space-y-3">
        {players.map((player, index) => {
          const rank = index + 1;
          const isCurrentUser = player.id === currentPlayer.id;

          return (
            <div
              key={player.id}
              className={`rounded-lg p-5 transition-all shadow-sm hover:shadow-md ${
                isCurrentUser
                  ? 'bg-fuchsia-50 border-2 border-fuchsia-300'
                  : 'bg-white border border-gray-200'
              }`}
            >
              <div className="flex items-center gap-4 mb-3">
                {/* Rank */}
                <div className="flex items-center justify-center w-10 h-10 shrink-0">
                  {getMedalIcon(rank) || (
                    <div
                      className={`text-xl ${
                        isCurrentUser ? 'text-gray-900' : 'text-gray-600'
                      }`}
                    >
                      {rank}
                    </div>
                  )}
                </div>

                {/* Player Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="font-medium text-gray-900">
                      {player.name}
                    </div>
                    {isCurrentUser && (
                      <span className="text-xs bg-fuchsia-600 text-white px-2 py-0.5 rounded-full">
                        You
                      </span>
                    )}
                  </div>
                  <div className="text-sm mt-0.5 text-gray-600">
                    {player.teams.length} teams
                  </div>
                </div>

                {/* Points */}
                <div className="text-right">
                  <div className="text-3xl font-bold text-gray-900">{player.livePoints}</div>
                  <div className="text-xs text-gray-500">
                    points
                  </div>
                </div>
              </div>

              {/* Teams List */}
              <div className={`pt-3 border-t ${isCurrentUser ? 'border-fuchsia-200' : 'border-gray-200'}`}>
                <div className="space-y-2">
                  {[...player.teams].sort(
                    (a, b) =>
                      resolveTeamRecord(b, standings).wins -
                      resolveTeamRecord(a, standings).wins,
                  ).map((team) => {
                    const teamInfo = getTeamById(team.teamId);
                    const record = resolveTeamRecord(team, standings);
                    const teamPoints = getTeamPoints(team.teamId, standings, playoffs);
                    if (!teamInfo) return null;

                    return (
                      <div
                        key={team.teamId}
                        className="flex items-center gap-2 text-sm text-gray-700"
                      >
                        <TeamLogo teamId={team.teamId} size="sm" />
                        <span className="truncate flex-1">{teamInfo.name}</span>
                        <span className="font-medium shrink-0 text-gray-900">
                          {teamPoints}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
