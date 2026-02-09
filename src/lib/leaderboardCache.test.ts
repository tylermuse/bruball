import { describe, expect, it } from 'vitest';
import { buildLeaderboardCache, readLeaderboardCache } from './leaderboardCache';

describe('leaderboard cache', () => {
  it('returns null when updatedAt changes', () => {
    const raw = buildLeaderboardCache({ tyler: 10 }, '2026-02-08T00:00:00.000Z');
    expect(readLeaderboardCache(raw, '2026-02-09T00:00:00.000Z')).toBeNull();
  });

  it('returns totals when updatedAt matches', () => {
    const raw = buildLeaderboardCache({ tyler: 10 }, '2026-02-08T00:00:00.000Z');
    expect(readLeaderboardCache(raw, '2026-02-08T00:00:00.000Z')).toEqual({ tyler: 10 });
  });
});
