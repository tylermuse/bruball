import { useEffect, useState } from 'react';
import { Schedule } from './components/Schedule';
import { Leaderboard } from './components/Leaderboard';
import { DraftResults } from './components/DraftResults';
import { Calendar, Trophy, CircleCheckBig, RotateCw } from 'lucide-react';
import { useStandings } from './lib/standings';
import { ErrorBoundary } from './components/ErrorBoundary';

export default function App() {
  const [activeTab, setActiveTab] = useState<'schedule' | 'leaderboard' | 'draft'>('schedule');
  const [refreshKey, setRefreshKey] = useState(0);
  const { updatedAt } = useStandings(refreshKey);
  useEffect(() => {
    const refresh = () => setRefreshKey((value) => value + 1);
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        refresh();
      }
    };
    refresh();
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);
  const updatedLabel = updatedAt
    ? new Date(updatedAt).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : null;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-10 shadow-sm relative">
        <h1 className="text-center text-gray-900">Bruball</h1>
        <p className="text-center text-gray-600 text-sm mt-1">2025 Season</p>
        {updatedLabel && (
          <p className="text-center text-gray-400 text-xs mt-1">
            Updated {updatedLabel}
          </p>
        )}
        <button
          type="button"
          onClick={() => setRefreshKey((value) => value + 1)}
          className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50"
        >
          <RotateCw className="size-3" />
          Refresh
        </button>
      </div>

      {/* Tab Content */}
      <div className="px-4 py-6">
        {activeTab === 'schedule' && (
          <ErrorBoundary resetKey={`${activeTab}-${refreshKey}`}>
            <Schedule refreshKey={refreshKey} />
          </ErrorBoundary>
        )}
        {activeTab === 'leaderboard' && (
          <ErrorBoundary resetKey={`${activeTab}-${refreshKey}`}>
            <Leaderboard refreshKey={refreshKey} />
          </ErrorBoundary>
        )}
        {activeTab === 'draft' && <DraftResults />}
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
        <div className="flex items-center justify-around">
          <button
            onClick={() => setActiveTab('schedule')}
            className={`flex flex-col items-center gap-1 py-3 px-6 flex-1 transition-colors ${
              activeTab === 'schedule' ? 'text-fuchsia-600' : 'text-gray-500'
            }`}
          >
            <Calendar className="size-5" />
            <span className="text-xs">Schedule</span>
          </button>
          
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`flex flex-col items-center gap-1 py-3 px-6 flex-1 transition-colors ${
              activeTab === 'leaderboard' ? 'text-fuchsia-600' : 'text-gray-500'
            }`}
          >
            <Trophy className="size-5" />
            <span className="text-xs">Leaderboard</span>
          </button>
          
          <button
            onClick={() => setActiveTab('draft')}
            className={`flex flex-col items-center gap-1 py-3 px-6 flex-1 transition-colors ${
              activeTab === 'draft' ? 'text-fuchsia-600' : 'text-gray-500'
            }`}
          >
            <CircleCheckBig className="size-5" />
            <span className="text-xs">Draft</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
