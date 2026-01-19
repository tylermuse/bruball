import { getAllPlayers } from '../lib/gameData';
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

  const picksPerRound = players.length;
  const totalPicks = draftPicks.length;
  const yourPicks = draftPicks.filter((pick) => pick.playerName === currentPlayer.name).length;
  const roundGroups = Array.from({ length: rounds }, (_, index) => {
    const start = index * picksPerRound;
    return {
      round: index + 1,
      picks: draftPicks.slice(start, start + picksPerRound),
    };
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-fuchsia-50 rounded-xl p-6 shadow-sm border border-fuchsia-200">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-sm text-gray-600 mb-1">2024 Season</div>
            <div className="text-3xl font-bold text-gray-900">Draft Results</div>
            <div className="text-sm text-gray-600 mt-2">
              Snake draft · One team from each division
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-700">
            <div className="rounded-lg bg-white px-3 py-2 border border-fuchsia-100">
              <div className="text-xs text-gray-500">Total Picks</div>
              <div className="text-lg font-semibold text-gray-900">{totalPicks}</div>
            </div>
            <div className="rounded-lg bg-white px-3 py-2 border border-fuchsia-100">
              <div className="text-xs text-gray-500">Your Picks</div>
              <div className="text-lg font-semibold text-gray-900">{yourPicks}</div>
            </div>
            <div className="rounded-lg bg-white px-3 py-2 border border-fuchsia-100">
              <div className="text-xs text-gray-500">Rounds</div>
              <div className="text-lg font-semibold text-gray-900">{rounds}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Draft Picks List */}
      <div className="space-y-6">
        {roundGroups.map((group) => (
          <div key={group.round} className="space-y-3">
            <div className="flex items-center justify-between border-b border-gray-200 pb-2">
              <h3 className="text-sm font-semibold text-gray-700">Round {group.round}</h3>
              <span className="text-xs text-gray-500">{group.picks.length} picks</span>
            </div>
            <div className="space-y-3">
              {group.picks.map((pick) => {
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
                const projectedDelta = pick.fallbackRecord.projectedWins - record.wins;
                
                return (
                  <div
                    key={pick.pickNumber}
                    className={`rounded-lg p-5 shadow-sm flex items-center gap-4 transition-shadow hover:shadow-md ${
                      isYourPick
                        ? 'bg-fuchsia-50 border-2 border-fuchsia-300'
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
                      <div className="text-base font-semibold text-gray-900">{teamInfo.name}</div>
                      <div className="text-xs text-gray-500">{teamInfo.division}</div>
                    </div>

                    {/* Player Badge */}
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <div className="text-xs text-gray-600">
                          {record.wins}-{record.losses}
                        </div>
                        <div className="text-xs text-gray-500">
                          {projectedDelta >= 0 ? '+' : ''}
                          {projectedDelta} proj
                        </div>
                      </div>
                      <div
                        className={`text-xs px-2 py-1 rounded-full font-semibold ${
                          isYourPick
                            ? 'bg-fuchsia-600 text-white'
                            : 'bg-gray-200 text-gray-700'
                        }`}
                      >
                        {isYourPick ? 'Your Pick' : pick.playerName}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
