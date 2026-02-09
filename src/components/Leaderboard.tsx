import { getAllPlayers } from '../lib/gameData';
import { Medal, Crown } from 'lucide-react';
import { TeamLogo } from '../lib/teamLogos';
import { getTeamById } from '../data/teams';
import { getPlayerPoints, getTeamPoints, resolveTeamRecord, usePlayoffs, useStandings } from '../lib/standings';
import { useEffect, useMemo, useState } from 'react';
import { buildLeaderboardCache, readLeaderboardCache } from '../lib/leaderboardCache';

type LeaderboardProps = {
  refreshKey?: number;
};

export function Leaderboard({ refreshKey }: LeaderboardProps) {
  const { standings } = useStandings(refreshKey);
  const { playoffs } = usePlayoffs(refreshKey);
  const [showConfetti, setShowConfetti] = useState(false);
  const [frozenTotals, setFrozenTotals] = useState<Record<string, number> | null>(null);
  const hasSuperBowlWinner = useMemo(() => {
    return Object.values(playoffs?.playoffWins ?? {}).some((record) => {
      return (record?.superBowl ?? 0) > 0;
    });
  }, [playoffs]);
  const { players, playerError } = useMemo(() => {
    try {
      const allPlayers = getAllPlayers();
      const safePlayers = Array.isArray(allPlayers) ? allPlayers : [];
      const nextPlayers = safePlayers
        .map((player) => ({
          ...player,
          teams: Array.isArray(player.teams) ? player.teams : [],
          livePoints: getPlayerPoints(player, standings, playoffs),
        }))
        .sort((a, b) => b.livePoints - a.livePoints);
      return { players: nextPlayers, playerError: null };
    } catch (error) {
      return {
        players: [],
        playerError:
          error instanceof Error ? error.message : 'Failed to load leaderboard data.',
      };
    }
  }, [standings, playoffs]);

  const storedPlayers = useMemo(() => {
    if (!frozenTotals) return players;
    const withFrozen = players
      .map((player) => ({
        ...player,
        livePoints: frozenTotals[player.id] ?? player.livePoints,
      }))
      .sort((a, b) => b.livePoints - a.livePoints);
    return withFrozen;
  }, [players, frozenTotals]);
  const champion = hasSuperBowlWinner ? storedPlayers[0] : null;
  const getMedalIcon = (rank: number) => {
    if (rank === 1) return <Crown className="size-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="size-5 text-gray-400" />;
    if (rank === 3) return <Medal className="size-5 text-amber-600" />;
    return null;
  };

  useEffect(() => {
    const stored = window.localStorage.getItem('bruball:leaderboardTotals');
    const totals = readLeaderboardCache(stored, playoffs?.updatedAt ?? null);
    if (totals) {
      setFrozenTotals(totals);
    } else if (stored) {
      window.localStorage.removeItem('bruball:leaderboardTotals');
    }
  }, [playoffs?.updatedAt]);

  useEffect(() => {
    if (!hasSuperBowlWinner) return;
    if (players.length === 0) return;
    if (frozenTotals) return;
    const totals = players.reduce<Record<string, number>>((acc, player) => {
      acc[player.id] = player.livePoints;
      return acc;
    }, {});
    window.localStorage.setItem(
      'bruball:leaderboardTotals',
      buildLeaderboardCache(totals, playoffs?.updatedAt ?? null),
    );
    setFrozenTotals(totals);
  }, [hasSuperBowlWinner, players, frozenTotals, playoffs?.updatedAt]);

  useEffect(() => {
    if (!champion || players.length === 0) return;
    setShowConfetti(true);
    const timeoutId = window.setTimeout(() => setShowConfetti(false), 3000);
    return () => window.clearTimeout(timeoutId);
  }, [champion?.id, players.length]);

  return (
    <div className="space-y-4">
      <style>{`
        @keyframes confetti-fall {
          0% { transform: translate3d(0, -10px, 0) rotate(0deg); opacity: 0; }
          10% { opacity: 1; }
          100% { transform: translate3d(0, 420px, 0) rotate(240deg); opacity: 0; }
        }
      `}</style>
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-xl text-gray-900 mb-2">Season Standings</h2>
        <p className="text-fuchsia-600 text-sm">Ranked by total points</p>
      </div>

      {showConfetti && (
        <div className="pointer-events-none fixed inset-0 z-50">
          {Array.from({ length: 30 }).map((_, index) => {
            const colors = ['#ec4899', '#f59e0b', '#10b981', '#3b82f6'];
            const left = 2 + (index * 96) / 29;
            const delay = (index % 10) * 0.08;
            const duration = 2 + (index % 5) * 0.2;
            const size = 6 + (index % 4) * 2;
            return (
              <span
                key={`confetti-overlay-${index}`}
                className="absolute top-0 rounded-sm"
                style={{
                  left: `${left}%`,
                  width: `${size}px`,
                  height: `${size * 1.8}px`,
                  backgroundColor: colors[index % colors.length],
                  animation: `confetti-fall ${duration}s ease-in-out ${delay}s 1`,
                }}
              />
            );
          })}
        </div>
      )}

      {/* Leaderboard */}
      <div className="space-y-3">
        {playerError && (
          <div className="rounded-lg p-4 shadow-sm bg-white border border-gray-200 text-sm text-gray-600">
            {playerError}
          </div>
        )}
        {!playerError && storedPlayers.map((player, index) => {
          const rank = index + 1;
          const isChampion = champion?.id === player.id;

          return (
            <div
              key={player.id}
              className={`rounded-lg p-4 transition-all shadow-sm border ${
                isChampion
                  ? 'border-fuchsia-400 bg-fuchsia-50/60 ring-1 ring-fuchsia-300'
                  : 'bg-white border-gray-200'
              }`}
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
                    {isChampion && (
                      <span className="ml-2 rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-semibold text-yellow-800">
                        Bruball Champ
                      </span>
                    )}
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
                      getTeamPoints(b.teamId, standings, playoffs) -
                      getTeamPoints(a.teamId, standings, playoffs),
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
