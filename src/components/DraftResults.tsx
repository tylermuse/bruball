import { draftPicks, getAllPlayers } from '../lib/gameData';
import { TeamLogo } from '../lib/teamLogos';
import { getTeamById, type Team } from '../data/teams';
import { resolveTeamRecord, useStandings } from '../lib/standings';

export function DraftResults() {
  const players = getAllPlayers();
  const playerById = new Map(players.map((player) => [player.id, player]));
  const { standings } = useStandings();
  const getFallbackRecord = (teamId: Team['id']) => ({
    wins: 0,
    losses: 0,
    gamesPlayed: 0,
    projectedWins: 0,
    ...players.flatMap((player) => player.teams).find((team) => team.teamId === teamId),
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-fuchsia-50 rounded-xl p-5 shadow-sm border border-fuchsia-200">
        <div className="text-sm text-gray-600 mb-1">2025 Season</div>
        <div className="text-2xl text-gray-900">Draft Results</div>
        <div className="text-sm text-gray-600 mt-2">Draft order - One team from each division</div>
      </div>

      {/* Draft Picks List */}
      <div className="space-y-2">
        {draftPicks.map((pick) => {
          const teamInfo = getTeamById(pick.teamId);
          if (!teamInfo) return null;
          const record = resolveTeamRecord(
            { teamId: pick.teamId, ...getFallbackRecord(pick.teamId) },
            standings,
          );
          const player = playerById.get(pick.playerId);
          
          return (
            <div
              key={pick.pickNumber}
              className="rounded-lg p-3 shadow-sm flex items-center gap-3 bg-white border border-gray-200"
            >
              {/* Pick Number */}
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 text-gray-700 font-semibold shrink-0">
                {pick.pickNumber}
              </div>

              {/* Team Logo */}
              <TeamLogo teamId={pick.teamId} size="sm" />

              {/* Team Info */}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900">{teamInfo.name}</div>
                <div className="text-xs text-gray-500">{teamInfo.division}</div>
              </div>

              {/* Player Badge */}
              <div className="flex items-center gap-2 shrink-0">
                <div className="text-xs text-gray-600">
                  {record.wins}-{record.losses}
                </div>
                <div className="text-xs px-2 py-1 rounded-full bg-gray-200 text-gray-700">
                  {player?.name ?? 'Unknown'}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
