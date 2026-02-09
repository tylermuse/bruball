/**
 * Returns true when SportsData playoff results include any wins or byes.
 * @param {Record<string, {wildCard: number, divisional: number, conference: number, superBowl: number}> | null | undefined} playoffWins
 * @param {Record<string, boolean> | null | undefined} wildcardByes
 * @returns {boolean}
 */
export function hasPlayoffResults(playoffWins, wildcardByes) {
  if (wildcardByes && Object.values(wildcardByes).some(Boolean)) {
    return true;
  }

  if (!playoffWins) return false;
  return Object.values(playoffWins).some((record) => {
    if (!record) return false;
    return (
      (record.wildCard ?? 0) > 0 ||
      (record.divisional ?? 0) > 0 ||
      (record.conference ?? 0) > 0 ||
      (record.superBowl ?? 0) > 0
    );
  });
}

/**
 * Returns true when SportsData has at least one schedule entry.
 * @param {Array<unknown> | null | undefined} games
 * @returns {boolean}
 */
export function hasScheduleGames(games) {
  return Array.isArray(games) && games.length > 0;
}
