function getDefaultSeason() {
  const now = new Date();
  const month = now.getMonth() + 1;
  return month < 8 ? now.getFullYear() - 1 : now.getFullYear();
}

function getStatValue(stats, statName) {
  if (!Array.isArray(stats)) return 0;
  const stat = stats.find((item) => item && item.name === statName);
  return typeof stat?.value === 'number' ? stat.value : 0;
}

function extractStandings(data) {
  const teams = {};
  const conferences = Array.isArray(data?.children) ? data.children : [];

  conferences.forEach((conference) => {
    const divisions = Array.isArray(conference?.children)
      ? conference.children
      : [];

    const conferenceEntries = Array.isArray(conference?.standings?.entries)
      ? conference.standings.entries
      : [];

    const addEntry = (entry, divisionName) => {
      const team = entry?.team;
      const displayName = team?.displayName || team?.name;
      if (!displayName) return;

      const wins = getStatValue(entry?.stats, 'wins');
      const losses = getStatValue(entry?.stats, 'losses');
      const ties = getStatValue(entry?.stats, 'ties');
      const seed = getStatValue(entry?.stats, 'seed');

      teams[displayName] = {
        name: displayName,
        abbreviation: team?.abbreviation,
        wins,
        losses,
        ties,
        seed,
        division: divisionName ?? null,
        conference: conference?.name ?? null,
      };
    };

    if (conferenceEntries.length > 0) {
      conferenceEntries.forEach((entry) => addEntry(entry, null));
      return;
    }

    divisions.forEach((division) => {
      const entries = Array.isArray(division?.standings?.entries)
        ? division.standings.entries
        : [];

      entries.forEach((entry) => addEntry(entry, division?.name ?? null));
    });
  });

  return teams;
}

async function fetchEspnStandings(season) {
  const baseParams = `season=${season}&seasontype=2&region=us&lang=en&contentorigin=espn`;
  const urls = [
    `https://site.api.espn.com/apis/site/v2/sports/football/nfl/standings?${baseParams}`,
    `https://site.api.espn.com/apis/v2/sports/football/nfl/standings?${baseParams}`,
    `https://cdn.espn.com/core/nfl/standings?xhr=1&region=us&lang=en`,
  ];

  const headers = {
    accept: 'application/json, text/plain, */*',
    'user-agent': 'Mozilla/5.0',
    referer: 'https://www.espn.com/',
  };

  for (const url of urls) {
    const response = await fetch(url, { headers });
    const text = await response.text();
    let data = null;

    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }

    const looksLite =
      data &&
      typeof data === 'object' &&
      'fullViewLink' in data &&
      !('children' in data) &&
      !('standings' in data) &&
      !('leagues' in data) &&
      !('entries' in data);

    if (response.ok && data && !looksLite) {
      return data;
    }
  }

  return null;
}

module.exports = {
  extractStandings,
  fetchEspnStandings,
  getDefaultSeason,
};
