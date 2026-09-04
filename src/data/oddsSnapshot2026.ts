// Market snapshot backing the draft valuation model (draft-engine-spec.md §2, §6).
// Frozen at draft time — do not recompute against live odds mid-season.
import type { Team } from './teams';

export interface OddsEntry {
  teamId: Team['id'];
  /** Sportsbook regular-season win total. */
  winTotal: number;
  /** American odds to win the Super Bowl, stored as the number after the sign
   * (e.g. 1000 for "+1000", -150 for "-150"). */
  superBowlOdds: number;
}

export interface OddsSnapshot {
  season: number;
  capturedAt: string;
  sources: {
    winTotals: string;
    superBowlFutures: string;
  };
  entries: OddsEntry[];
}

export const ODDS_SNAPSHOT_2026: OddsSnapshot = {
  season: 2026,
  capturedAt: '2026-08-26T00:00:00.000Z',
  sources: {
    winTotals: 'BetMGM',
    superBowlFutures: 'DraftKings',
  },
  entries: [
    { teamId: 'buffalo-bills', winTotal: 10.5, superBowlOdds: 1000 },
    { teamId: 'new-england-patriots', winTotal: 9.5, superBowlOdds: 1600 },
    { teamId: 'new-york-jets', winTotal: 5.5, superBowlOdds: 20000 },
    { teamId: 'miami-dolphins', winTotal: 3.5, superBowlOdds: 35000 },
    { teamId: 'baltimore-ravens', winTotal: 11.5, superBowlOdds: 1000 },
    { teamId: 'cincinnati-bengals', winTotal: 10.5, superBowlOdds: 2000 },
    { teamId: 'pittsburgh-steelers', winTotal: 8.5, superBowlOdds: 5000 },
    { teamId: 'cleveland-browns', winTotal: 5.5, superBowlOdds: 20000 },
    { teamId: 'houston-texans', winTotal: 9.5, superBowlOdds: 1800 },
    { teamId: 'jacksonville-jaguars', winTotal: 8.5, superBowlOdds: 3000 },
    { teamId: 'indianapolis-colts', winTotal: 7.5, superBowlOdds: 6000 },
    { teamId: 'tennessee-titans', winTotal: 6.5, superBowlOdds: 13000 },
    { teamId: 'kansas-city-chiefs', winTotal: 10.5, superBowlOdds: 1600 },
    { teamId: 'los-angeles-chargers', winTotal: 9.5, superBowlOdds: 1700 },
    { teamId: 'denver-broncos', winTotal: 9.5, superBowlOdds: 2000 },
    { teamId: 'las-vegas-raiders', winTotal: 5.5, superBowlOdds: 15000 },
    { teamId: 'philadelphia-eagles', winTotal: 10.5, superBowlOdds: 1600 },
    { teamId: 'dallas-cowboys', winTotal: 9.5, superBowlOdds: 2500 },
    { teamId: 'washington-commanders', winTotal: 7.5, superBowlOdds: 6000 },
    { teamId: 'new-york-giants', winTotal: 7.5, superBowlOdds: 7000 },
    { teamId: 'detroit-lions', winTotal: 10.5, superBowlOdds: 1900 },
    { teamId: 'green-bay-packers', winTotal: 9.5, superBowlOdds: 1800 },
    { teamId: 'chicago-bears', winTotal: 9.5, superBowlOdds: 2400 },
    { teamId: 'minnesota-vikings', winTotal: 8.5, superBowlOdds: 5000 },
    { teamId: 'tampa-bay-buccaneers', winTotal: 8.5, superBowlOdds: 5500 },
    { teamId: 'new-orleans-saints', winTotal: 7.5, superBowlOdds: 9000 },
    { teamId: 'carolina-panthers', winTotal: 7.5, superBowlOdds: 9000 },
    { teamId: 'atlanta-falcons', winTotal: 7.5, superBowlOdds: 13000 },
    { teamId: 'los-angeles-rams', winTotal: 11.5, superBowlOdds: 550 },
    { teamId: 'seattle-seahawks', winTotal: 10.5, superBowlOdds: 1100 },
    { teamId: 'san-francisco-49ers', winTotal: 10.5, superBowlOdds: 1900 },
    { teamId: 'arizona-cardinals', winTotal: 3.5, superBowlOdds: 50000 },
  ],
};
