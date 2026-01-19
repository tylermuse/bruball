import { getAllPlayers } from '../lib/gameData';
import { Medal, Crown } from 'lucide-react';
import { TeamLogo } from '../lib/teamLogos';
import { getTeamById } from '../data/teams';
import { getPlayerPoints, getTeamPoints, resolveTeamRecord, usePlayoffs, useStandings } from '../lib/standings';

export function Leaderboard() {
  const { standings } = useStandings();
  const { playoffs } = usePlayoffs();
  const players = getAllPlayers()
    .map((player) => ({
      ...player,
      livePoints: getPlayerPoints(player, standings, playoffs),
    }))
    .sort((a, b) => b.livePoints - a.livePoints);

  const getMedalIcon = (rank: number) => {
    if (rank === 1) return <Crown className="size-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="size-5 text-gray-400" />;
    if (rank === 3) return <Medal className="size-5 text-amber-600" />;
    return null;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-xl text-gray-900 mb-2">Season Standings</h2>
        <p className="text-fuchsia-600 text-sm">Ranked by total wins</p>
      </div>

      {/* Leaderboard */}
      <div className="space-y-3">
        {players.map((player, index) => {
          const rank = index + 1;

          return (
            <div
              key={player.id}
              className="rounded-lg p-4 transition-all shadow-sm bg-white border border-gray-200"
            >
              <div className="flex items-center gap-4 mb-3">
                {/* Rank */}
                <div className="flex items-center justify-center w-10 h-10 shrink-0">
                  {getMedalIcon(rank) || (
                    <div
                      className="text-xl text-gray-600"
                    >
                      {rank}
                    </div>
                  )}
                </div>

                {/* Player Info */}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900">
                    {player.name}
                  </div>
                  <div className="text-sm mt-0.5 text-gray-600">
                    {player.teams.length} teams
                  </div>
                </div>

                {/* Points */}
                <div className="text-right">
                  <div className="text-2xl text-gray-900">{player.livePoints}</div>
                  <div className="text-xs text-gray-500">
                    points
                  </div>
                </div>
              </div>

              {/* Teams List */}
              <div className="pt-3 border-t border-gray-200">
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
