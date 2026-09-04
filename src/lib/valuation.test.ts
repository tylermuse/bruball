import { describe, expect, it } from 'vitest';
import { buildValuationBoard, devigTitleProbabilities, VALUATION_BOARD_2026 } from './valuation';
import { ODDS_SNAPSHOT_2026 } from '../data/oddsSnapshot2026';

describe('devigTitleProbabilities', () => {
  it('normalizes implied probabilities to sum to 1', () => {
    const title = devigTitleProbabilities(ODDS_SNAPSHOT_2026.entries);
    const sum = [...title.values()].reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1, 6);
  });

  it('the raw (un-devigged) book sums to roughly 122.5% per spec §2.2', () => {
    const raw = ODDS_SNAPSHOT_2026.entries.map((e) =>
      e.superBowlOdds >= 0 ? 100 / (e.superBowlOdds + 100) : -e.superBowlOdds / (-e.superBowlOdds + 100),
    );
    const rawSum = raw.reduce((a, b) => a + b, 0);
    expect(rawSum).toBeGreaterThan(1.2);
    expect(rawSum).toBeLessThan(1.25);
  });
});

describe('buildValuationBoard', () => {
  it('produces 32 teams, one per division slot', () => {
    expect(VALUATION_BOARD_2026.teams).toHaveLength(32);
  });

  it('pool sums to ~313.0 points and par to ~78.25 per spec §2.4', () => {
    expect(VALUATION_BOARD_2026.poolPoints).toBeCloseTo(313.0, 0);
    expect(VALUATION_BOARD_2026.parPoints).toBeCloseTo(78.25, 0);
  });

  it('matches spec §6 reference points for spot-checked teams within rounding tolerance', () => {
    const spotChecks: Array<[string, number]> = [
      ['los-angeles-rams', 15.5],
      ['baltimore-ravens', 14.15],
      ['seattle-seahawks', 12.98],
      ['buffalo-bills', 13.15],
      ['arizona-cardinals', 3.65],
    ];
    spotChecks.forEach(([teamId, expected]) => {
      expect(VALUATION_BOARD_2026.byId[teamId].points).toBeCloseTo(expected, 0);
    });
  });

  it('ranks teams the same as their title probability within a round (rank-preserving fit)', () => {
    const sorted = [...VALUATION_BOARD_2026.teams].sort((a, b) => b.title - a.title);
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i - 1].pDivisional).toBeGreaterThanOrEqual(sorted[i].pDivisional - 1e-9);
    }
  });

  it('every probability field stays within [0, 1]', () => {
    VALUATION_BOARD_2026.teams.forEach((t) => {
      [t.title, t.pMakePlayoffs, t.pDivisional, t.pConference, t.pSuperBowl].forEach((p) => {
        expect(p).toBeGreaterThanOrEqual(0);
        expect(p).toBeLessThanOrEqual(1);
      });
    });
  });

  it('scales par by managerCount', () => {
    const board = buildValuationBoard(ODDS_SNAPSHOT_2026, 8);
    expect(board.parPoints).toBeCloseTo(board.poolPoints / 8, 6);
  });
});
