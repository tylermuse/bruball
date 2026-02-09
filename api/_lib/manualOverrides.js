const MANUAL_CONFERENCE_WINNERS = ['New England Patriots', 'Seattle Seahawks'];
const MANUAL_SUPER_BOWL_WINNER = 'Seattle Seahawks';
const MANUAL_WILDCARD_WINNERS = ['Chicago Bears'];
const MANUAL_TIE_TEAMS = ['Dallas Cowboys', 'Green Bay Packers'];

function applyManualConferenceWinners(games, seasonType, weekNumber, weekLabel) {
  const isConferenceRound =
    seasonType === 3 &&
    (weekNumber === 3 ||
      String(weekLabel || '').toLowerCase().includes('conference'));
  if (!isConferenceRound) return games;

  return games.map((game) => {
    if (game.winnerName) return game;
    const winner = MANUAL_CONFERENCE_WINNERS.find((team) => {
      return team === game.homeTeamName || team === game.awayTeamName;
    });
    if (!winner) return game;
    return { ...game, winnerName: winner, completed: true };
  });
}

function applyManualSuperBowlWinner(games, seasonType, weekNumber, weekLabel) {
  const isSuperBowl =
    seasonType === 3 &&
    (weekNumber === 4 || String(weekLabel || '').toLowerCase().includes('super bowl'));
  if (!isSuperBowl) return games;

  return games.map((game) => {
    if (game.winnerName) return game;
    if (
      game.homeTeamName === MANUAL_SUPER_BOWL_WINNER ||
      game.awayTeamName === MANUAL_SUPER_BOWL_WINNER
    ) {
      return { ...game, winnerName: MANUAL_SUPER_BOWL_WINNER, completed: true };
    }
    return game;
  });
}

function applyManualPlayoffOverrides(playoffWins, wildcardByes) {
  const nextWins = { ...(playoffWins ?? {}) };
  const nextByes = { ...(wildcardByes ?? {}) };

  MANUAL_WILDCARD_WINNERS.forEach((teamName) => {
    const current = nextWins[teamName] ?? {
      wildCard: 0,
      divisional: 0,
      conference: 0,
      superBowl: 0,
    };
    nextWins[teamName] = {
      ...current,
      wildCard: Math.max(current.wildCard ?? 0, 1),
    };
  });

  MANUAL_CONFERENCE_WINNERS.forEach((teamName) => {
    const current = nextWins[teamName] ?? {
      wildCard: 0,
      divisional: 0,
      conference: 0,
      superBowl: 0,
    };
    nextWins[teamName] = {
      ...current,
      divisional: Math.max(current.divisional ?? 0, 1),
      conference: Math.max(current.conference ?? 0, 1),
    };
    nextByes[teamName] = true;
  });

  if (MANUAL_SUPER_BOWL_WINNER) {
    const current = nextWins[MANUAL_SUPER_BOWL_WINNER] ?? {
      wildCard: 0,
      divisional: 0,
      conference: 0,
      superBowl: 0,
    };
    nextWins[MANUAL_SUPER_BOWL_WINNER] = {
      ...current,
      superBowl: Math.max(current.superBowl ?? 0, 1),
    };
  }

  return { playoffWins: nextWins, wildcardByes: nextByes };
}

function getManualPostseasonSchedule(week) {
  if (week === 3) {
    return [
      {
        id: 'manual-conference-afc',
        date: '2026-01-25T15:00:00Z',
        homeTeamName: 'Denver Broncos',
        awayTeamName: 'New England Patriots',
        pointsAtStake: 3.5,
        completed: true,
        winnerName: 'New England Patriots',
      },
      {
        id: 'manual-conference-nfc',
        date: '2026-01-25T18:30:00Z',
        homeTeamName: 'Seattle Seahawks',
        awayTeamName: 'Los Angeles Rams',
        pointsAtStake: 3.5,
        completed: true,
        winnerName: 'Seattle Seahawks',
      },
    ];
  }

  if (week === 4) {
    return [
      {
        id: 'manual-super-bowl',
        date: '2026-02-08T23:30:00Z',
        homeTeamName: 'New England Patriots',
        awayTeamName: 'Seattle Seahawks',
        pointsAtStake: 5,
        completed: true,
        winnerName: 'Seattle Seahawks',
      },
    ];
  }

  return null;
}

function applyManualTies(teams) {
  const nextTeams = { ...teams };
  MANUAL_TIE_TEAMS.forEach((teamName) => {
    if (nextTeams[teamName]) {
      nextTeams[teamName] = {
        ...nextTeams[teamName],
        ties: (nextTeams[teamName].ties ?? 0) + 1,
      };
    }
  });
  return nextTeams;
}

module.exports = {
  applyManualConferenceWinners,
  applyManualPlayoffOverrides,
  applyManualSuperBowlWinner,
  applyManualTies,
  getManualPostseasonSchedule,
};
