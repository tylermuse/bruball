import { describe, expect, it } from 'vitest';
import {
  applyManualPlayoffOverrides,
  buildStandingsFromSchedule,
  getTeamPlayoffPoints,
} from './standings';

type RawScheduleGame = {
  game_type: string;
  home_team: string;
  away_team: string;
  home_score: number | null;
  away_score: number | null;
  winner: string | null;
  played: boolean;
};

describe('buildStandingsFromSchedule', () => {
  it('calculates wins, losses, and ties from regular-season games', () => {
    const games: RawScheduleGame[] = [
      {
        game_type: 'REG',
        home_team: 'AAA',
        away_team: 'BBB',
        home_score: 21,
        away_score: 14,
        winner: 'AAA',
        played: true,
      },
      {
        game_type: 'REG',
        home_team: 'BBB',
        away_team: 'AAA',
        home_score: 10,
        away_score: 10,
        winner: 'TIE',
        played: true,
      },
      {
        game_type: 'POST',
        home_team: 'AAA',
        away_team: 'BBB',
        home_score: 17,
        away_score: 20,
        winner: 'BBB',
        played: true,
      },
    ];

    const standings = buildStandingsFromSchedule(games, {
      AAA: 'Alpha Aces',
      BBB: 'Beta Bears',
    });

    expect(standings['Alpha Aces'].wins).toBe(1);
    expect(standings['Alpha Aces'].losses).toBe(0);
    expect(standings['Alpha Aces'].ties).toBe(1);
    expect(standings['Beta Bears'].wins).toBe(0);
    expect(standings['Beta Bears'].losses).toBe(1);
    expect(standings['Beta Bears'].ties).toBe(1);
  });
});

describe('getTeamPlayoffPoints', () => {
  it('sums playoff wins and wildcard byes', () => {
    const playoffs = {
      season: null,
      updatedAt: '2026-02-10T00:00:00.000Z',
      playoffWins: {
        'Seattle Seahawks': {
          wildCard: 0,
          divisional: 1,
          conference: 1,
          superBowl: 1,
        },
      },
      wildcardByes: {
        'Seattle Seahawks': true,
      },
    };

    const points = getTeamPlayoffPoints('seattle-seahawks', playoffs);
    expect(points).toBe(1.5 + 2.5 + 3.5 + 5);
  });
});

describe('applyManualPlayoffOverrides', () => {
  it('adds conference and Super Bowl wins for manual winners', () => {
    const playoffs = {
      season: null,
      updatedAt: '2026-02-10T00:00:00.000Z',
      playoffWins: {
        'New England Patriots': {
          wildCard: 0,
          divisional: 1,
          conference: 0,
          superBowl: 0,
        },
        'Seattle Seahawks': {
          wildCard: 0,
          divisional: 1,
          conference: 0,
          superBowl: 0,
        },
      },
      wildcardByes: {},
    };

    const updated = applyManualPlayoffOverrides(playoffs);
    expect(updated?.playoffWins['New England Patriots'].conference).toBe(1);
    expect(updated?.playoffWins['Seattle Seahawks'].conference).toBe(1);
    expect(updated?.playoffWins['Seattle Seahawks'].superBowl).toBe(1);
  });
});
