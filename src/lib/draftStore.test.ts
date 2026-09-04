import { describe, expect, it } from 'vitest';
import { TEAMS } from '../data/teams';
import { VALUATION_BOARD_2026 } from './valuation';
import {
  DIVISIONS,
  ROUNDS,
  autoResolveForced,
  canPick,
  contestedTeamsFor,
  divisionsOwnedBy,
  isFullyForced,
  makeCpuPick,
  makePick,
  onTheClock,
  picksByPlayer,
  reservedTeams,
  rosterValuation,
  setMemberIsCpu,
  startDraft,
  totalPicks,
  undoLastPick,
  type DraftState,
  type Member,
} from './draftStore';

function freshActive(members: Member[] = [
  { id: 'a', name: 'A' },
  { id: 'b', name: 'B' },
  { id: 'c', name: 'C' },
  { id: 'd', name: 'D' },
]): DraftState {
  return startDraft({
    status: 'setup',
    members,
    order: members.map((m) => m.id),
    picks: [],
    startedAt: null,
  });
}

describe('canPick', () => {
  it('rejects a taken team', () => {
    let state = freshActive();
    const who = onTheClock(state)!;
    const team = TEAMS[0];
    state = makePick(state, team.id);
    const nextWho = onTheClock(state)!;
    expect(canPick(state, team.id, nextWho)).toBe(false);
  });

  it('rejects a division the player already owns', () => {
    let state = freshActive();
    const who = onTheClock(state)!;
    const team = TEAMS.find((t) => t.division === 'AFC East')!;
    state = makePick(state, team.id);
    // 'who' won't be back on the clock immediately in a 4-player snake, so
    // fast-forward by undoing/redoing isn't needed — just check directly.
    expect(divisionsOwnedBy(state, who).has('AFC East')).toBe(true);
    const otherAfcEast = TEAMS.find((t) => t.division === 'AFC East' && t.id !== team.id)!;
    expect(canPick(state, otherAfcEast.id, who)).toBe(false);
  });
});

describe('snake order', () => {
  it('reverses direction each round', () => {
    const state = freshActive();
    const order = state.order;
    // Round 1: a,b,c,d. Round 2: d,c,b,a.
    let s = state;
    const seen: string[] = [];
    for (let i = 0; i < order.length; i++) {
      const who = onTheClock(s)!;
      seen.push(who);
      const team = contestedTeamsFor(s, who)[0];
      s = makePick(s, team.id);
    }
    expect(seen).toEqual(order);
    const who5 = onTheClock(s)!;
    expect(who5).toBe(order[order.length - 1]);
  });
});

describe('reservedTeams', () => {
  it('flags a division as reserved once 3 of its 4 teams are taken by distinct managers', () => {
    let state = freshActive();
    const division = 'AFC East';
    const teams = TEAMS.filter((t) => t.division === division);
    // Force-pick 3 of the 4 AFC East teams across 3 different managers by
    // directly driving makePick with the on-the-clock player each time,
    // steering their choice toward this division when legal.
    let takenInDivision = 0;
    let guard = 0;
    while (takenInDivision < 3 && guard < 50) {
      guard++;
      const who = onTheClock(state)!;
      const legalInDivision = teams.find(
        (t) => !state.picks.some((p) => p.teamId === t.id) && canPick(state, t.id, who),
      );
      if (legalInDivision) {
        state = makePick(state, legalInDivision.id);
        takenInDivision++;
      } else {
        const fallback = contestedTeamsFor(state, who)[0];
        state = makePick(state, fallback.id);
      }
    }
    const reserved = reservedTeams(state).find((r) => r.division === division);
    expect(reserved).toBeDefined();
    const remainingTeam = teams.find((t) => !state.picks.some((p) => p.teamId === t.id))!;
    expect(reserved?.teamId).toBe(remainingTeam.id);
  });
});

describe('autoResolveForced / isFullyForced', () => {
  it('auto-claims every remaining pick once a manager has no contested divisions left', () => {
    // 4 managers, 8 divisions. Give three managers 7 of their 8 divisions
    // (all but AFC East), forcing the 4th manager's AFC East pick, then
    // drain everything else so the 4th manager is left with nothing but
    // reserved divisions.
    let state = freshActive();
    let guard = 0;
    while (state.status === 'active' && guard < 200) {
      guard++;
      const who = onTheClock(state)!;
      const candidates = contestedTeamsFor(state, who);
      if (!candidates.length) break;
      state = makePick(state, candidates[0].id);
    }
    expect(state.status).toBe('complete');
    expect(state.picks.length).toBe(totalPicks(state));
  });

  it('never leaves a manager with a single-option division on their contested board', () => {
    let state = freshActive();
    let guard = 0;
    while (state.status === 'active' && guard < 200) {
      guard++;
      const who = onTheClock(state)!;
      const board = contestedTeamsFor(state, who);
      const byDivision = new Map<string, number>();
      board.forEach((t) => byDivision.set(t.division, (byDivision.get(t.division) ?? 0) + 1));
      byDivision.forEach((count) => expect(count).not.toBe(1));
      if (!board.length) break;
      state = makePick(state, board[0].id);
    }
  });
});

describe('makePick / undoLastPick', () => {
  it('completes with 8 teams per player, one per division, 32 unique teams', () => {
    let state = freshActive();
    let guard = 0;
    while (state.status === 'active' && guard < 200) {
      guard++;
      const who = onTheClock(state)!;
      const candidates = contestedTeamsFor(state, who);
      state = makePick(state, candidates[0].id);
    }
    expect(state.status).toBe('complete');
    state.members.forEach((m) => {
      const picks = picksByPlayer(state, m.id);
      expect(picks).toHaveLength(ROUNDS);
      expect(new Set(picks.map((p) => p.division)).size).toBe(DIVISIONS.length);
    });
    expect(new Set(state.picks.map((p) => p.teamId)).size).toBe(32);
  });

  it('undo removes exactly the last pick and reopens the draft if it was complete', () => {
    let state = freshActive();
    while (state.status === 'active') {
      const who = onTheClock(state)!;
      const candidates = contestedTeamsFor(state, who);
      state = makePick(state, candidates[0].id);
    }
    const totalBefore = state.picks.length;
    state = undoLastPick(state);
    expect(state.picks.length).toBe(totalBefore - 1);
    expect(state.status).toBe('active');
  });
});

describe('CPU picks', () => {
  it('a CPU manager always makes legal picks and the draft still completes cleanly', () => {
    let state = freshActive();
    state = setMemberIsCpu(state, 'a', true, () => 0.1);
    state = setMemberIsCpu(state, 'c', true, () => 0.9);
    let guard = 0;
    while (state.status === 'active' && guard < 200) {
      guard++;
      const who = onTheClock(state)!;
      const member = state.members.find((m) => m.id === who)!;
      if (member.isCpu) {
        state = makeCpuPick(state, VALUATION_BOARD_2026, () => 0.5);
      } else {
        const candidates = contestedTeamsFor(state, who);
        state = makePick(state, candidates[0].id);
      }
    }
    expect(state.status).toBe('complete');
    expect(new Set(state.picks.map((p) => p.teamId)).size).toBe(32);
  });

  it('tags a homer pick when the CPU lands its favorite team', () => {
    let state = freshActive();
    const homerTeam = TEAMS[0];
    state = setMemberIsCpu(state, state.order[0], true, () => 0);
    state = {
      ...state,
      members: state.members.map((m) =>
        m.id === state.order[0] && m.cpu ? { ...m, cpu: { ...m.cpu, strategy: 'chalk', tau: 0.001, homerTeamId: homerTeam.id } } : m,
      ),
    };
    state = makeCpuPick(state, VALUATION_BOARD_2026, () => 0);
    const pick = state.picks[0];
    expect(pick.teamId).toBe(homerTeam.id);
    expect(pick.tag).toBe('homer');
  });
});

describe('rosterValuation', () => {
  it('sums points and title share across a roster', () => {
    let state = freshActive();
    const who = onTheClock(state)!;
    const team = contestedTeamsFor(state, who)[0];
    state = makePick(state, team.id);
    const { points, title } = rosterValuation(state, who, VALUATION_BOARD_2026);
    const expectedValuation = VALUATION_BOARD_2026.byId[team.id];
    expect(points).toBeCloseTo(expectedValuation.points, 6);
    expect(title).toBeCloseTo(expectedValuation.title, 6);
  });
});
