import { describe, expect, it } from "vitest";
import { getRoundPoints } from "./roundPoints.js";

describe("getRoundPoints", () => {
  it("returns 5 for Super Bowl label without week number", () => {
    expect(getRoundPoints("Super Bowl", 3, null)).toBe(5);
  });

  it("returns 3.5 for Conference label without week number", () => {
    expect(getRoundPoints("Conference Round", 3, null)).toBe(3.5);
  });

  it("returns 2.5 for Divisional label without week number", () => {
    expect(getRoundPoints("Divisional Round", 3, null)).toBe(2.5);
  });

  it("returns 1.5 for Wild Card label without week number", () => {
    expect(getRoundPoints("Wild Card", 3, null)).toBe(1.5);
  });
});
