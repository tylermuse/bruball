import { describe, expect, it } from 'vitest';
import manualOverrides from './manualOverrides.js';

const {
  applyManualConferenceWinners,
  applyManualPlayoffOverrides,
  applyManualSuperBowlWinner,
  applyManualTies,
  getManualPostseasonSchedule,
} = manualOverrides;

const MANUAL_SEASON = 2025;

describe('manualOverrides (api)', () => {
  it('adds wildcard, divisional, conference, and Super Bowl wins with byes for the 2025 season', () => {
    const result = applyManualPlayoffOverrides({}, {}, MANUAL_SEASON);
    expect(result.playoffWins['Chicago Bears'].wildCard).toBe(1);
    expect(result.playoffWins['New England Patriots'].divisional).toBe(1);
    expect(result.playoffWins['New England Patriots'].conference).toBe(1);
    expect(result.playoffWins['Seattle Seahawks'].divisional).toBe(1);
    expect(result.playoffWins['Seattle Seahawks'].conference).toBe(1);
    expect(result.playoffWins['Seattle Seahawks'].superBowl).toBe(1);
    expect(result.wildcardByes['New England Patriots']).toBe(true);
    expect(result.wildcardByes['Seattle Seahawks']).toBe(true);
  });

  it('returns manual conference schedule for week 3 of the 2025 season', () => {
    const games = getManualPostseasonSchedule(3, MANUAL_SEASON);
    expect(games?.length).toBe(2);
    expect(games?.[0].pointsAtStake).toBe(3.5);
  });

  it('returns manual super bowl schedule for week 4 of the 2025 season', () => {
    const games = getManualPostseasonSchedule(4, MANUAL_SEASON);
    expect(games?.length).toBe(1);
    expect(games?.[0].pointsAtStake).toBe(5);
  });

  it('applies manual winners to schedule games for the 2025 season', () => {
    const games = [
      { homeTeamName: 'Denver Broncos', awayTeamName: 'New England Patriots', winnerName: null },
    ];
    const updated = applyManualConferenceWinners(games, 3, 3, 'Conference Round', MANUAL_SEASON);
    expect(updated[0].winnerName).toBe('New England Patriots');

    const sbGames = [
      { homeTeamName: 'New England Patriots', awayTeamName: 'Seattle Seahawks', winnerName: null },
    ];
    const updatedSuper = applyManualSuperBowlWinner(sbGames, 3, 4, 'Super Bowl', MANUAL_SEASON);
    expect(updatedSuper[0].winnerName).toBe('Seattle Seahawks');
  });

  it('applies manual ties to teams for the 2025 season', () => {
    const teams = {
      'Dallas Cowboys': { wins: 10, losses: 5, ties: 0 },
      'Green Bay Packers': { wins: 9, losses: 6, ties: 0 },
    };
    const updated = applyManualTies(teams, MANUAL_SEASON);
    expect(updated['Dallas Cowboys'].ties).toBe(1);
    expect(updated['Green Bay Packers'].ties).toBe(1);
  });

  it('does not apply any 2025 overrides to a different season', () => {
    const games = [
      { homeTeamName: 'Denver Broncos', awayTeamName: 'New England Patriots', winnerName: null },
    ];
    expect(applyManualConferenceWinners(games, 3, 3, 'Conference Round', 2026)[0].winnerName).toBe(null);
    expect(getManualPostseasonSchedule(3, 2026)).toBe(null);
    expect(applyManualPlayoffOverrides({}, {}, 2026)).toEqual({ playoffWins: {}, wildcardByes: {} });
    expect(applyManualTies({ 'Dallas Cowboys': { ties: 0 } }, 2026)['Dallas Cowboys'].ties).toBe(0);
  });
});
