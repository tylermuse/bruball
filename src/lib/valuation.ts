// Draft-time valuation model (draft-engine-spec.md §2).
// Turns a frozen odds snapshot into a single points currency used to value
// teams during the draft (CPU AI, "best available" hints, roster projections).
// This is independent of the live in-season scoring in standings.ts.
import { getTeamById, type Team } from '../data/teams';
import { ODDS_SNAPSHOT_2026, type OddsSnapshot } from '../data/oddsSnapshot2026';

export interface TeamValuation {
  teamId: Team['id'];
  division: Team['division'];
  winTotal: number;
  /** Probability this team wins the Super Bowl (devigged). */
  title: number;
  pMakePlayoffs: number;
  pDivisional: number;
  pConference: number;
  pSuperBowl: number;
  points: number;
}

export interface ValuationBoard {
  season: number;
  capturedAt: string;
  sources: OddsSnapshot['sources'];
  teams: TeamValuation[];
  byId: Record<string, TeamValuation>;
  /** Total points across all 32 teams. */
  poolPoints: number;
  /** poolPoints / managerCount — the "fair share" per manager. */
  parPoints: number;
}

const POINT_WEIGHTS = {
  divisional: 2,
  conference: 3,
  superBowl: 4,
  champion: 5,
} as const;

// §2.3 — rank-preserving power fit per round. Exponents are 2026-board
// defaults (spec §2.3); revisit if scoring weights change materially.
const ROUND_TARGETS: Array<{
  key: 'pMakePlayoffs' | 'pDivisional' | 'pConference' | 'pSuperBowl';
  teams: number;
  alpha: number;
}> = [
  { key: 'pMakePlayoffs', teams: 14, alpha: 0.45 },
  { key: 'pDivisional', teams: 8, alpha: 0.62 },
  { key: 'pConference', teams: 4, alpha: 0.78 },
  { key: 'pSuperBowl', teams: 2, alpha: 0.89 },
];

function americanOddsToImpliedProbability(americanOdds: number): number {
  return americanOdds >= 0
    ? 100 / (americanOdds + 100)
    : -americanOdds / (-americanOdds + 100);
}

/** §2.2 — implied probabilities normalized so they sum to exactly 1. */
export function devigTitleProbabilities(
  entries: OddsSnapshot['entries'],
): Map<string, number> {
  const raw = new Map(
    entries.map((e) => [e.teamId, americanOddsToImpliedProbability(e.superBowlOdds)]),
  );
  const sumRaw = [...raw.values()].reduce((a, b) => a + b, 0);
  const title = new Map<string, number>();
  raw.forEach((v, id) => title.set(id, v / sumRaw));
  return title;
}

/**
 * §2.3 — normalize title^alpha so the values sum to targetSum, clamping any
 * team at a 1.0 probability ceiling and redistributing the overflow among
 * the remaining teams.
 */
export function powerFitRound(
  title: Map<string, number>,
  alpha: number,
  targetSum: number,
): Map<string, number> {
  const result = new Map<string, number>();
  let active = new Map(title);
  let target = targetSum;

  for (let iter = 0; iter < 64 && active.size > 0; iter++) {
    const raw = new Map<string, number>();
    let rawSum = 0;
    active.forEach((v, id) => {
      const r = Math.pow(v, alpha);
      raw.set(id, r);
      rawSum += r;
    });

    if (rawSum <= 0) {
      const even = target / active.size;
      active.forEach((_, id) => result.set(id, Math.max(0, Math.min(1, even))));
      break;
    }

    const scale = target / rawSum;
    const clamped: string[] = [];
    active.forEach((_, id) => {
      const p = (raw.get(id) ?? 0) * scale;
      if (p >= 1) clamped.push(id);
    });

    if (clamped.length === 0) {
      active.forEach((_, id) => {
        result.set(id, (raw.get(id) ?? 0) * scale);
      });
      break;
    }

    clamped.forEach((id) => {
      result.set(id, 1);
      active.delete(id);
      target -= 1;
    });
  }

  return result;
}

/** §2.4 — combine market inputs into a single points currency. */
export function buildValuationBoard(
  snapshot: OddsSnapshot = ODDS_SNAPSHOT_2026,
  managerCount = 4,
): ValuationBoard {
  const title = devigTitleProbabilities(snapshot.entries);

  const roundProbs = new Map<string, Map<string, number>>();
  ROUND_TARGETS.forEach(({ key, teams, alpha }) => {
    roundProbs.set(key, powerFitRound(title, alpha, teams));
  });

  const teams: TeamValuation[] = snapshot.entries.map((entry) => {
    const team = getTeamById(entry.teamId);
    if (!team) {
      throw new Error(`Unknown team in odds snapshot: ${entry.teamId}`);
    }
    const t = title.get(entry.teamId) ?? 0;
    const pMakePlayoffs = roundProbs.get('pMakePlayoffs')?.get(entry.teamId) ?? 0;
    const pDivisional = roundProbs.get('pDivisional')?.get(entry.teamId) ?? 0;
    const pConference = roundProbs.get('pConference')?.get(entry.teamId) ?? 0;
    const pSuperBowl = roundProbs.get('pSuperBowl')?.get(entry.teamId) ?? 0;

    const points =
      entry.winTotal +
      POINT_WEIGHTS.divisional * pDivisional +
      POINT_WEIGHTS.conference * pConference +
      POINT_WEIGHTS.superBowl * pSuperBowl +
      POINT_WEIGHTS.champion * t;

    return {
      teamId: entry.teamId,
      division: team.division,
      winTotal: entry.winTotal,
      title: t,
      pMakePlayoffs,
      pDivisional,
      pConference,
      pSuperBowl,
      points,
    };
  });

  const poolPoints = teams.reduce((sum, t) => sum + t.points, 0);
  const byId = Object.fromEntries(teams.map((t) => [t.teamId, t]));

  return {
    season: snapshot.season,
    capturedAt: snapshot.capturedAt,
    sources: snapshot.sources,
    teams,
    byId,
    poolPoints,
    parPoints: poolPoints / managerCount,
  };
}

/** Default board built from the frozen 2026 snapshot. */
export const VALUATION_BOARD_2026: ValuationBoard = buildValuationBoard();
