import { describe, expect, it } from "vitest";
import { mapSportsDataStandings } from "./standings.js";

describe("mapSportsDataStandings", () => {
  it("maps SportsData standings entries into a standings map", () => {
    const standings = [
      {
        Team: "NE",
        City: "New England",
        Name: "Patriots",
        FullName: "New England Patriots",
        Wins: 12,
        Losses: 5,
        Ties: 0,
        Division: "AFC East",
        Conference: "AFC",
        PlayoffSeed: 2,
      },
    ];

    const mapped = mapSportsDataStandings(standings);

    expect(mapped["New England Patriots"]).toEqual({
      wins: 12,
      losses: 5,
      ties: 0,
      abbreviation: "NE",
      division: "AFC East",
      conference: "AFC",
      seed: 2,
    });
  });
});
