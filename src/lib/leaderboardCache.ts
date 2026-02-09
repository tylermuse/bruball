export type LeaderboardTotals = Record<string, number>;

const CACHE_VERSION = 2;

type LeaderboardCachePayload = {
  totals: LeaderboardTotals;
  updatedAt: string | null;
  version: number;
};

export function readLeaderboardCache(
  raw: string | null,
  updatedAt: string | null,
): LeaderboardTotals | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as LeaderboardCachePayload;
    if (!parsed?.totals) return null;
    if (parsed.version !== CACHE_VERSION) return null;
    if (updatedAt && parsed.updatedAt && parsed.updatedAt !== updatedAt) {
      return null;
    }
    return parsed.totals;
  } catch {
    return null;
  }
}

export function buildLeaderboardCache(
  totals: LeaderboardTotals,
  updatedAt: string | null,
): string {
  return JSON.stringify({
    totals,
    updatedAt,
    version: CACHE_VERSION,
  } satisfies LeaderboardCachePayload);
}
