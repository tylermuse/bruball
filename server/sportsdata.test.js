import { describe, expect, it } from "vitest";
import { hasPlayoffResults, hasScheduleGames } from "./sportsdata.js";

describe("hasPlayoffResults", () => {
  it("returns false when no wins or byes", () => {
    expect(hasPlayoffResults({}, {})).toBe(false);
  });

  it("returns true when any win exists", () => {
    const wins = { "Team A": { wildCard: 0, divisional: 1, conference: 0, superBowl: 0 } };
    expect(hasPlayoffResults(wins, {})).toBe(true);
  });

  it("returns true when any bye exists", () => {
    expect(hasPlayoffResults({}, { "Team A": true })).toBe(true);
  });
});

describe("hasScheduleGames", () => {
  it("returns false for empty arrays", () => {
    expect(hasScheduleGames([])).toBe(false);
  });

  it("returns true for non-empty arrays", () => {
    expect(hasScheduleGames([{}])).toBe(true);
  });
});
