export function getRoundPoints(weekLabel, seasonType, weekNumber) {
  const label = (weekLabel || "").toLowerCase();
  if (label.includes("super bowl")) {
    return 5;
  }
  if (label.includes("conference")) {
    return 3.5;
  }
  if (label.includes("divisional")) {
    return 2.5;
  }
  if (label.includes("wild card") || label.includes("wildcard")) {
    return 1.5;
  }
  if (seasonType === 3) {
    if (typeof weekNumber === "number") {
      if (weekNumber === 1) return 1.5;
      if (weekNumber === 2) return 2.5;
      if (weekNumber === 3) return 3.5;
      if (weekNumber === 4) return 5;
    }
    return 1.5;
  }
  return 1;
}
