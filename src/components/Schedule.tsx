import { getScheduleWithOwners, useWeeklySchedule, type SchedulePhase } from '../lib/scheduleData';
import { TeamLogo } from '../lib/teamLogos';
import { getTeamById } from '../data/teams';
import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getCurrentPlayer } from '../lib/gameData';

export function Schedule() {
  const currentPlayer = getCurrentPlayer();
  const [phase, setPhase] = useState<SchedulePhase>('current');
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const { games, weekLabel, currentWeek, currentSeasonType } = useWeeklySchedule(
    phase,
    selectedWeek,
  );
  const schedule = getScheduleWithOwners(games);

  const options = useMemo(() => {
    const weeks = Array.from({ length: 17 }, (_, index) => ({
      id: `week-${index + 1}`,
      label: `Week ${index + 1}`,
      phase: 'regular' as const,
      week: index + 1,
    }));
    const postseason = [
      { id: 'wild-card', label: 'Wild Card', phase: 'postseason' as const, week: 1 },
      { id: 'divisional', label: 'Divisional', phase: 'postseason' as const, week: 2 },
      { id: 'conference', label: 'Conference', phase: 'postseason' as const, week: 3 },
      { id: 'super-bowl', label: 'Super Bowl', phase: 'postseason' as const, week: 4 },
    ];

    const all = [...weeks, ...postseason];
    return { weeks, postseason, all };
  }, []);

  const handleSelect = (nextPhase: SchedulePhase, week: number | null) => {
    setPhase(nextPhase);
    setSelectedWeek(week);
  };

  useEffect(() => {
    if (selectedIndex !== null) return;
    if (!currentWeek) return;

    const nextPhase =
      currentSeasonType === 3 ? ('postseason' as const) : ('regular' as const);
    const target = options.all.findIndex(
      (option) => option.phase === nextPhase && option.week === currentWeek,
    );
    if (target >= 0) {
      setSelectedIndex(target);
      setPhase(nextPhase);
      setSelectedWeek(currentWeek);
    }
  }, [currentWeek, currentSeasonType, options.all, selectedIndex]);

  const activeIndex = selectedIndex ?? 0;
  const windowStart = Math.max(0, activeIndex - 2);
  const visibleOptions = options.all.slice(windowStart, activeIndex + 1);

  const cycle = (direction: 'prev' | 'next') => {
    const maxIndex = options.all.length - 1;
    const nextIndex =
      direction === 'prev'
        ? (activeIndex - 1 + options.all.length) % options.all.length
        : (activeIndex + 1) % options.all.length;
    const option = options.all[nextIndex];
    setSelectedIndex(nextIndex);
    handleSelect(option.phase, option.week);
  };
  
  // Group games by day
  const gamesByDay = schedule.reduce((acc, game) => {
    if (!acc[game.day]) {
      acc[game.day] = [];
    }
    acc[game.day].push(game);
    return acc;
  }, {} as Record<string, typeof schedule>);
  
  const dayOrder = [
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
  ];
  
  const totalGames = schedule.length;
  const yourGames = schedule.filter(
    (game) =>
      game.homeTeamOwner === currentPlayer.name ||
      game.awayTeamOwner === currentPlayer.name,
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-fuchsia-50 rounded-xl p-6 shadow-sm border border-fuchsia-200">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-sm text-gray-600 mb-1">{weekLabel}</div>
            <div className="text-3xl font-bold text-gray-900">NFL Games This Week</div>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-700">
            <div className="rounded-lg bg-white px-3 py-2 border border-fuchsia-100">
              <div className="text-xs text-gray-500">Total Games</div>
              <div className="text-lg font-semibold text-gray-900">{totalGames}</div>
            </div>
            <div className="rounded-lg bg-white px-3 py-2 border border-fuchsia-100">
              <div className="text-xs text-gray-500">Your Games</div>
              <div className="text-lg font-semibold text-gray-900">{yourGames}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Week Navigation */}
      <div className="flex items-center gap-2">
        <button
          className="h-8 w-8 shrink-0 rounded-full border border-gray-200 bg-white text-gray-700 flex items-center justify-center"
          onClick={() => cycle('prev')}
          aria-label="Previous week"
        >
          <ChevronLeft className="size-4" />
        </button>
        <div className="flex items-center gap-2">
          {visibleOptions.map((option, index) => {
            const isActive = windowStart + index === activeIndex;
            return (
              <button
                key={option.id}
                className={`text-xs px-4 py-1.5 rounded-full border whitespace-nowrap ${
                  isActive
                    ? 'bg-fuchsia-600 text-white border-fuchsia-600'
                    : 'bg-white text-gray-700 border-gray-200'
                }`}
                onClick={() => {
                  const nextIndex = windowStart + index;
                  setSelectedIndex(nextIndex);
                  handleSelect(option.phase, option.week);
                }}
              >
                {option.label}
              </button>
            );
          })}
        </div>
        <button
          className="h-8 w-8 shrink-0 rounded-full border border-gray-200 bg-white text-gray-700 flex items-center justify-center"
          onClick={() => cycle('next')}
          aria-label="Next week"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>

      {/* Games by Day */}
      {dayOrder.map((day) => {
        const games = gamesByDay[day];
        if (!games) return null;
        
        const dayYourGames = games.filter(
          (game) =>
            game.homeTeamOwner === currentPlayer.name ||
            game.awayTeamOwner === currentPlayer.name,
        ).length;

        return (
          <div key={day} className="space-y-3">
            <div className="sticky top-2 z-10 bg-white/90 backdrop-blur border-b border-gray-200 py-2 px-1 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700">{day}</h3>
              <div className="text-xs text-gray-500">
                {games.length} games{dayYourGames ? ` · ${dayYourGames} yours` : ''}
              </div>
            </div>
            <div className="space-y-2">
              {games.map((game) => {
                const hasYourTeam =
                  game.homeTeamOwner === currentPlayer.name ||
                  game.awayTeamOwner === currentPlayer.name;
                const awayTeam = getTeamById(game.awayTeamId);
                const homeTeam = getTeamById(game.homeTeamId);
                const awayIsWinner = game.winnerTeamId === game.awayTeamId;
                const homeIsWinner = game.winnerTeamId === game.homeTeamId;
                const showScores =
                  Boolean(game.completed) &&
                  game.awayScore !== null &&
                  game.awayScore !== undefined &&
                  game.homeScore !== null &&
                  game.homeScore !== undefined;
                const pointsLabel =
                  game.pointsAtStake === 1
                    ? '+1 point'
                    : `+${game.pointsAtStake} points`;

                if (!awayTeam || !homeTeam) {
                  return null;
                }
                
                return (
                  <div
                    key={game.id}
                    className={`rounded-lg p-5 shadow-sm transition-shadow hover:shadow-md ${
                      hasYourTeam
                        ? 'bg-fuchsia-50 border-2 border-fuchsia-300'
                        : 'bg-white border border-gray-200'
                    }`}
                  >
                    {/* Game Time */}
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                      <span>{game.completed ? 'Final' : game.time}</span>
                      {hasYourTeam && (
                        <span className="rounded-full bg-fuchsia-600 text-white px-2 py-0.5 text-xs font-semibold">
                          Your Game
                        </span>
                      )}
                    </div>
                    
                    {/* Away Team */}
                    <div
                      className={`flex items-center gap-3 mb-2 rounded-lg px-2 py-2 ${
                        awayIsWinner ? 'bg-emerald-50 border border-emerald-200' : ''
                      }`}
                    >
                      <TeamLogo teamId={game.awayTeamId} size="sm" />
                      <div className="flex-1 min-w-0">
                        <div
                          className={`flex flex-wrap items-center gap-2 text-sm font-semibold ${
                            awayIsWinner ? 'text-emerald-700' : 'text-gray-900'
                          }`}
                        >
                          <span>{awayTeam.name}</span>
                          {awayIsWinner && (
                            <span className="text-xs font-semibold text-emerald-700">
                              {pointsLabel}
                            </span>
                          )}
                          {game.awayTeamOwner && (
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full ${
                                game.awayTeamOwner === currentPlayer.name
                                  ? 'bg-fuchsia-600 text-white'
                                  : 'bg-gray-200 text-gray-700'
                              }`}
                            >
                              {game.awayTeamOwner}
                            </span>
                          )}
                        </div>
                      </div>
                      {showScores && (
                        <div
                          className={`text-sm font-semibold ${
                            awayIsWinner ? 'text-emerald-700' : 'text-gray-700'
                          }`}
                        >
                          {game.awayScore}
                        </div>
                      )}
                    </div>
                    
                    {/* VS Divider */}
                    <div className="flex items-center gap-2 my-2 ml-11">
                      <div className="text-xs text-gray-400">@</div>
                    </div>
                    
                    {/* Home Team */}
                    <div
                      className={`flex items-center gap-3 rounded-lg px-2 py-2 ${
                        homeIsWinner ? 'bg-emerald-50 border border-emerald-200' : ''
                      }`}
                    >
                      <TeamLogo teamId={game.homeTeamId} size="sm" />
                      <div className="flex-1 min-w-0">
                        <div
                          className={`flex flex-wrap items-center gap-2 text-sm font-semibold ${
                            homeIsWinner ? 'text-emerald-700' : 'text-gray-900'
                          }`}
                        >
                          <span>{homeTeam.name}</span>
                          {homeIsWinner && (
                            <span className="text-xs font-semibold text-emerald-700">
                              {pointsLabel}
                            </span>
                          )}
                          {game.homeTeamOwner && (
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full ${
                                game.homeTeamOwner === currentPlayer.name
                                  ? 'bg-fuchsia-600 text-white'
                                  : 'bg-gray-200 text-gray-700'
                              }`}
                            >
                              {game.homeTeamOwner}
                            </span>
                          )}
                        </div>
                      </div>
                      {showScores && (
                        <div
                          className={`text-sm font-semibold ${
                            homeIsWinner ? 'text-emerald-700' : 'text-gray-700'
                          }`}
                        >
                          {game.homeScore}
                        </div>
                      )}
                    </div>
                    
                    {/* Points at Stake */}
                    {game.pointsAtStake > 0 && !game.completed && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="text-xs text-gray-600">
                          <span className="font-medium text-fuchsia-600">{game.pointsAtStake} points</span> at stake for the winner
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
