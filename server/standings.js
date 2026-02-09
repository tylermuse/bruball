/**
 * Parse numeric seed-like values from SportsData responses.
 * @param {number | string | null | undefined} value
 * @returns {number | null}
 */
export function parseSeed(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === "number" && !Number.isNaN(value)) return value;
  const match = String(value).match(/\d+/);
  return match ? Number(match[0]) : null;
}

/**
 * Map SportsData standings array to a standings map keyed by display name.
 * @param {Array<Record<string, any>> | null} standings
 * @returns {Record<string, {wins: number, losses: number, ties: number, abbreviation?: string, division?: string, conference?: string, seed?: number | null}>}
 */
export function mapSportsDataStandings(standings) {
  const teams = {};
  if (!Array.isArray(standings)) return teams;

  standings.forEach((team) => {
    const abbr = team?.Team || team?.Abbreviation;
    const city = team?.City;
    const nickname = team?.Name;
    const fullName = city && nickname ? `${city} ${nickname}` : team?.Name;
    const displayName = team?.FullName || team?.TeamName || fullName;
    if (!displayName) return;

    const wins = Number(team?.Wins ?? team?.wins ?? 0);
    const losses = Number(team?.Losses ?? team?.losses ?? 0);
    const ties = Number(team?.Ties ?? team?.ties ?? 0);
    const seedRaw =
      team?.PlayoffSeed ??
      team?.Seed ??
      team?.ConferenceSeed ??
      team?.PlayoffRank ??
      team?.ConferenceRank;
    const seed = parseSeed(seedRaw);

    teams[displayName] = {
      wins,
      losses,
      ties,
      abbreviation: abbr,
      division: team?.Division ?? null,
      conference: team?.Conference ?? null,
      seed,
    };
  });

  return teams;
}
