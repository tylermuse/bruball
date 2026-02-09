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

  it('returns null when cache version is stale', () => {
    const stale = JSON.stringify({
      totals: { tyler: 10 },
      updatedAt: '2026-02-08T00:00:00.000Z',
      version: 1,
    });
    expect(readLeaderboardCache(stale, '2026-02-08T00:00:00.000Z')).toBeNull();
  });
});
