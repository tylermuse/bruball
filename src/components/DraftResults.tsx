import { getAllPlayers, getCurrentPlayer } from '../lib/gameData';
import { TeamLogo } from '../lib/teamLogos';
import { getTeamById, type Team } from '../data/teams';
import { resolveTeamRecord, useStandings } from '../lib/standings';

interface DraftPick {
  pickNumber: number;
  playerName: string;
  teamId: Team['id'];
  fallbackRecord: {
    wins: number;
    losses: number;
    gamesPlayed: number;
    projectedWins: number;
  };
}

export function DraftResults() {
  const players = getAllPlayers();
  const currentPlayer = getCurrentPlayer();
  const { standings } = useStandings();
  
  // Create draft order - alternating picks between players
  const draftPicks: DraftPick[] = [];
  
  // Simulate a snake draft order
  const rounds = 8; // 8 teams per player
  for (let round = 0; round < rounds; round++) {
    const isEvenRound = round % 2 === 0;
    const playerOrder = isEvenRound ? players : [...players].reverse();
    
    playerOrder.forEach((player) => {
      const team = player.teams[round];
      if (team) {
        draftPicks.push({
          pickNumber: draftPicks.length + 1,
          playerName: player.name,
          teamId: team.teamId,
          fallbackRecord: {
            wins: team.wins,
            losses: team.losses,
            gamesPlayed: team.gamesPlayed,
            projectedWins: team.projectedWins,
          },
        });
      }
    });
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-fuchsia-50 rounded-xl p-5 shadow-sm border border-fuchsia-200">
        <div className="text-sm text-gray-600 mb-1">2024 Season</div>
        <div className="text-2xl text-gray-900">Draft Results</div>
        <div className="text-sm text-gray-600 mt-2">Snake draft - One team from each division</div>
      </div>

      {/* Draft Picks List */}
      <div className="space-y-2">
        {draftPicks.map((pick) => {
          const isYourPick = pick.playerName === currentPlayer.name;
          const teamInfo = getTeamById(pick.teamId);
          if (!teamInfo) return null;
          const record = resolveTeamRecord(
            {
              teamId: pick.teamId,
              ...pick.fallbackRecord,
            },
            standings,
          );
          
          return (
            <div
              key={pick.pickNumber}
              className={`rounded-lg p-3 shadow-sm flex items-center gap-3 ${
                isYourPick
                  ? 'bg-fuchsia-50 border border-fuchsia-200'
                  : 'bg-white border border-gray-200'
              }`}
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
                <div
                  className={`text-xs px-2 py-1 rounded-full ${
                    isYourPick
                      ? 'bg-fuchsia-600 text-white'
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  {pick.playerName}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
