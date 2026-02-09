import { describe, expect, it } from 'vitest';
import manualOverrides from './manualOverrides.js';

const {
  applyManualConferenceWinners,
  applyManualPlayoffOverrides,
  applyManualSuperBowlWinner,
  getManualPostseasonSchedule,
} = manualOverrides;

describe('manualOverrides (api)', () => {
  it('adds manual divisional, conference, and Super Bowl wins with byes', () => {
    const result = applyManualPlayoffOverrides({}, {});
    expect(result.playoffWins['New England Patriots'].divisional).toBe(1);
    expect(result.playoffWins['New England Patriots'].conference).toBe(1);
    expect(result.playoffWins['Seattle Seahawks'].divisional).toBe(1);
    expect(result.playoffWins['Seattle Seahawks'].conference).toBe(1);
    expect(result.playoffWins['Seattle Seahawks'].superBowl).toBe(1);
    expect(result.wildcardByes['New England Patriots']).toBe(true);
    expect(result.wildcardByes['Seattle Seahawks']).toBe(true);
  });

  it('returns manual conference schedule for week 3', () => {
    const games = getManualPostseasonSchedule(3);
    expect(games?.length).toBe(2);
    expect(games?.[0].pointsAtStake).toBe(3.5);
  });

  it('returns manual super bowl schedule for week 4', () => {
    const games = getManualPostseasonSchedule(4);
    expect(games?.length).toBe(1);
    expect(games?.[0].pointsAtStake).toBe(5);
  });

  it('applies manual winners to schedule games', () => {
    const games = [
      { homeTeamName: 'Denver Broncos', awayTeamName: 'New England Patriots', winnerName: null },
    ];
    const updated = applyManualConferenceWinners(games, 3, 3, 'Conference Round');
    expect(updated[0].winnerName).toBe('New England Patriots');

    const sbGames = [
      { homeTeamName: 'New England Patriots', awayTeamName: 'Seattle Seahawks', winnerName: null },
    ];
    const updatedSuper = applyManualSuperBowlWinner(sbGames, 3, 4, 'Super Bowl');
    expect(updatedSuper[0].winnerName).toBe('Seattle Seahawks');
  });
});
