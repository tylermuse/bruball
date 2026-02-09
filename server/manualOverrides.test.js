import { describe, expect, it } from "vitest";
import {
  applyManualConferenceWinners,
  applyManualPlayoffOverrides,
  applyManualSuperBowlWinner,
  applyManualTies,
  getManualPostseasonSchedule,
} from "./manualOverrides.js";

describe("manualOverrides", () => {
  it("sets conference winners when missing", () => {
    const games = [
      {
        homeTeamName: "New England Patriots",
        awayTeamName: "Denver Broncos",
        winnerName: null,
        completed: false,
      },
    ];
    const updated = applyManualConferenceWinners(games, 3, 3, "Conference Round");
    expect(updated[0].winnerName).toBe("New England Patriots");
    expect(updated[0].completed).toBe(true);
  });

  it("sets Super Bowl winner when missing", () => {
    const games = [
      {
        homeTeamName: "New England Patriots",
        awayTeamName: "Seattle Seahawks",
        winnerName: null,
        completed: false,
      },
    ];
    const updated = applyManualSuperBowlWinner(games, 3, 4, "Super Bowl");
    expect(updated[0].winnerName).toBe("Seattle Seahawks");
    expect(updated[0].completed).toBe(true);
  });

  it("adds wildcard, divisional, conference, and Super Bowl wins with byes", () => {
    const result = applyManualPlayoffOverrides({}, {});
    expect(result.playoffWins["Chicago Bears"].wildCard).toBe(1);
    expect(result.playoffWins["New England Patriots"].divisional).toBe(1);
    expect(result.playoffWins["New England Patriots"].conference).toBe(1);
    expect(result.playoffWins["Seattle Seahawks"].divisional).toBe(1);
    expect(result.playoffWins["Seattle Seahawks"].conference).toBe(1);
    expect(result.playoffWins["Seattle Seahawks"].superBowl).toBe(1);
    expect(result.wildcardByes["New England Patriots"]).toBe(true);
    expect(result.wildcardByes["Seattle Seahawks"]).toBe(true);
  });

  it("returns manual conference schedule for week 3", () => {
    const games = getManualPostseasonSchedule(3);
    expect(games?.length).toBe(2);
    expect(games?.[0].pointsAtStake).toBe(3.5);
  });

  it("returns manual super bowl schedule for week 4", () => {
    const games = getManualPostseasonSchedule(4);
    expect(games?.length).toBe(1);
    expect(games?.[0].pointsAtStake).toBe(5);
  });

  it("applies manual ties to teams", () => {
    const teams = {
      "Dallas Cowboys": { wins: 10, losses: 5, ties: 0 },
      "Green Bay Packers": { wins: 9, losses: 6, ties: 0 },
    };
    const updated = applyManualTies(teams);
    expect(updated["Dallas Cowboys"].ties).toBe(1);
    expect(updated["Green Bay Packers"].ties).toBe(1);
  });
});
