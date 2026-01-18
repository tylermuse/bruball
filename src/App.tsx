import { useState } from 'react';
import { Schedule } from './components/Schedule';
import { Leaderboard } from './components/Leaderboard';
import { DraftResults } from './components/DraftResults';
import { Calendar, Trophy, CircleCheckBig } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'schedule' | 'leaderboard' | 'draft'>('schedule');

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-10 shadow-sm">
        <h1 className="text-center text-gray-900">NFL Division Game</h1>
        <p className="text-center text-gray-600 text-sm mt-1">2024 Season Tracker</p>
      </div>

      {/* Tab Content */}
      <div className="px-4 py-6">
        {activeTab === 'schedule' && <Schedule />}
        {activeTab === 'leaderboard' && <Leaderboard />}
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