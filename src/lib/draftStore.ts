// Client-side draft engine for NFL Bruball (2026).
// Rule: each player drafts exactly one team from each of the 8 NFL divisions.
// State persists to localStorage so a draft survives reloads. Hot-seat style:
// whoever is on the clock picks on the shared screen.
import { TEAMS, type Team } from '../data/teams';
import type { Player } from './gameData';
import { VALUATION_BOARD_2026, type ValuationBoard } from './valuation';
import {
  randomStrategy,
  softmaxSample,
  strategyScore,
  TAU_PRESETS,
  type CpuProfile,
  type CpuStrategy,
} from './cpuAI';

export interface Member {
  id: string;
  name: string;
  isCpu?: boolean;
  cpu?: CpuProfile;
}

export type DraftStatus = 'setup' | 'active' | 'complete';

/** §3.2/§4.3/§8 — why a pick happened, for the pick log. */
export type PickTag = 'homer' | 'reach' | 'reserved';

export interface DraftPickRecord {
  pickNumber: number;
  playerId: string;
  teamId: Team['id'];
  division: string;
  tag?: PickTag;
}

export interface DraftState {
  status: DraftStatus;
  members: Member[];
  order: string[]; // base (round 1) order of member ids; snake reverses each round
  picks: DraftPickRecord[];
  startedAt: string | null;
}

export const DEFAULT_MEMBERS: Member[] = [
  { id: 'tyler', name: 'Tyler' },
  { id: 'austin', name: 'Austin' },
  { id: 'lindy', name: 'Lindy' },
  { id: 'nick', name: 'Nick' },
];

export const DIVISIONS = [
  'AFC East', 'AFC North', 'AFC South', 'AFC West',
  'NFC East', 'NFC North', 'NFC South', 'NFC West',
] as const;

// One team per division => rounds equal the number of divisions.
export const ROUNDS = DIVISIONS.length; // 8

/** The real draft — this is what the leaderboard/schedule read from. */
export const LIVE_KEY = 'bruball:draft2026';
/** A fully isolated sandbox for trying out the draft flow / CPU AI. Never
 * read by rostersAsPlayers(), so it can never leak into the live league. */
export const SIM_KEY = 'bruball:draftSim2026';

function freshState(members: Member[] = DEFAULT_MEMBERS): DraftState {
  return {
    status: 'setup',
    members,
    order: members.map((m) => m.id),
    picks: [],
    startedAt: null,
  };
}

function normalize(raw: any): DraftState {
  const members: Member[] = Array.isArray(raw?.members) && raw.members.length
    ? raw.members
    : DEFAULT_MEMBERS;
  const order: string[] = Array.isArray(raw?.order) && raw.order.length
    ? raw.order
    : members.map((m) => m.id);
  const picks: DraftPickRecord[] = Array.isArray(raw?.picks) ? raw.picks : [];
  const status: DraftStatus =
    raw?.status === 'active' || raw?.status === 'complete' ? raw.status : 'setup';
  return { status, members, order, picks, startedAt: raw?.startedAt ?? null };
}

export function loadDraft(key: string = LIVE_KEY): DraftState {
  try {
    const raw = typeof window !== 'undefined' ? window.localStorage.getItem(key) : null;
    if (raw) return normalize(JSON.parse(raw));
  } catch {
    /* ignore corrupt state */
  }
  return freshState();
}

export function saveDraft(state: DraftState, key: string = LIVE_KEY): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(state));
  } catch {
    /* storage may be unavailable */
  }
}

export function clearDraft(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* storage may be unavailable */
  }
}

/** Flat list of member ids in pick order across all snake rounds. */
export function pickOrder(state: DraftState): string[] {
  const base = state.order.length ? state.order : state.members.map((m) => m.id);
  const out: string[] = [];
  for (let r = 0; r < ROUNDS; r++) {
    const row = r % 2 === 0 ? base : [...base].reverse();
    out.push(...row);
  }
  return out;
}

export function totalPicks(state: DraftState): number {
  return ROUNDS * (state.order.length || state.members.length);
}

export function onTheClock(state: DraftState): string | null {
  if (state.status !== 'active') return null;
  return pickOrder(state)[state.picks.length] ?? null;
}

export function currentRound(state: DraftState): number {
  const n = state.order.length || state.members.length || 1;
  return Math.min(ROUNDS, Math.floor(state.picks.length / n) + 1);
}

export function takenTeamIds(state: DraftState): Set<string> {
  return new Set(state.picks.map((p) => p.teamId));
}

export function ownerOfTeam(state: DraftState, teamId: string): string | null {
  return state.picks.find((p) => p.teamId === teamId)?.playerId ?? null;
}

export function divisionsOwnedBy(state: DraftState, playerId: string): Set<string> {
  return new Set(state.picks.filter((p) => p.playerId === playerId).map((p) => p.division));
}

export function picksByPlayer(state: DraftState, playerId: string): DraftPickRecord[] {
  return state.picks.filter((p) => p.playerId === playerId);
}

export function memberName(state: DraftState, id: string | null): string {
  if (!id) return '';
  return state.members.find((m) => m.id === id)?.name ?? id;
}

/** Can the player on the clock draft this team? */
export function canPick(state: DraftState, teamId: string, playerId: string | null): boolean {
  if (!playerId) return false;
  const team = TEAMS.find((t) => t.id === teamId);
  if (!team) return false;
  if (takenTeamIds(state).has(teamId)) return false;
  if (divisionsOwnedBy(state, playerId).has(team.division)) return false;
  return true;
}

function applyPick(state: DraftState, teamId: string, tag?: PickTag): DraftState {
  const who = onTheClock(state);
  if (!who || !canPick(state, teamId, who)) return state;
  const team = TEAMS.find((t) => t.id === teamId)!;
  const picks = [
    ...state.picks,
    { pickNumber: state.picks.length + 1, playerId: who, teamId, division: team.division, tag },
  ];
  const status: DraftStatus = picks.length >= totalPicks(state) ? 'complete' : 'active';
  return { ...state, picks, status };
}

/**
 * §1 invariant — if a division has exactly one available team left, the
 * other three teams are necessarily held by the other three managers, so
 * that team can only ever go to whichever single manager hasn't locked the
 * division yet. Recomputed fresh from state; nothing to invalidate.
 */
export interface ReservedTeam {
  division: string;
  teamId: string;
  playerId: string;
}

export function reservedTeams(state: DraftState): ReservedTeam[] {
  const taken = takenTeamIds(state);
  const result: ReservedTeam[] = [];
  DIVISIONS.forEach((division) => {
    const available = TEAMS.filter((t) => t.division === division && !taken.has(t.id));
    if (available.length !== 1) return;
    const openManagers = state.members.filter(
      (m) => !divisionsOwnedBy(state, m.id).has(division),
    );
    if (openManagers.length === 1) {
      result.push({ division, teamId: available[0].id, playerId: openManagers[0].id });
    }
  });
  return result;
}

/** §3.2 — divisions reserved for this player, keyed by division. */
export function reservedForPlayer(state: DraftState, playerId: string): ReservedTeam[] {
  return reservedTeams(state).filter((r) => r.playerId === playerId);
}

/** §3.2/§7 — true once every remaining open division for this player is reserved (no real choice left). */
export function isFullyForced(state: DraftState, playerId: string): boolean {
  const owned = divisionsOwnedBy(state, playerId);
  const openDivisions = DIVISIONS.filter((d) => !owned.has(d));
  if (openDivisions.length === 0) return false;
  const reserved = reservedTeams(state);
  return openDivisions.every((d) => reserved.some((r) => r.division === d && r.playerId === playerId));
}

/**
 * §3.2/§7 checklist item 6 — once a manager has no contested divisions left,
 * silently fill in the rest of their draft; there's no decision left to make.
 */
export function autoResolveForced(state: DraftState): DraftState {
  let current = state;
  // Bounded by ROUNDS * members — every iteration consumes exactly one pick.
  const maxIterations = totalPicks(state) + 1;
  for (let i = 0; i < maxIterations; i++) {
    if (current.status !== 'active') break;
    const who = onTheClock(current);
    if (!who || !isFullyForced(current, who)) break;
    const owned = divisionsOwnedBy(current, who);
    const nextDivision = DIVISIONS.find((d) => !owned.has(d));
    const claim = reservedTeams(current).find(
      (r) => r.division === nextDivision && r.playerId === who,
    );
    if (!claim) break;
    current = applyPick(current, claim.teamId, 'reserved');
  }
  return current;
}

export function makePick(state: DraftState, teamId: string): DraftState {
  const next = applyPick(state, teamId);
  if (next === state) return state;
  return autoResolveForced(next);
}

/**
 * §4 — choice board for a CPU (or "best available" hints for a human): every
 * available team in the player's open divisions, excluding divisions already
 * reserved for them (those get auto-claimed, not chosen).
 */
export function contestedTeamsFor(state: DraftState, playerId: string): Team[] {
  const taken = takenTeamIds(state);
  const owned = divisionsOwnedBy(state, playerId);
  const reserved = new Set(
    reservedTeams(state)
      .filter((r) => r.playerId === playerId)
      .map((r) => r.division),
  );
  return TEAMS.filter(
    (t) => !taken.has(t.id) && !owned.has(t.division) && !reserved.has(t.division),
  );
}

/** §4 — have the CPU manager on the clock choose a team via their strategy + softmax(TAU). */
export function cpuChoosePick(
  state: DraftState,
  board: ValuationBoard = VALUATION_BOARD_2026,
  rand: () => number = Math.random,
): { teamId: string; tag?: PickTag } | null {
  const who = onTheClock(state);
  if (!who) return null;
  const member = state.members.find((m) => m.id === who);
  const profile: CpuProfile = member?.cpu ?? { strategy: 'chalk', tau: TAU_PRESETS.competent };

  let candidates = contestedTeamsFor(state, who);
  if (!candidates.length) {
    // Safety net: nothing contested (shouldn't happen — autoResolveForced
    // would have claimed it already), fall back to any legal team.
    candidates = TEAMS.filter((t) => canPick(state, t.id, who));
  }
  if (!candidates.length) return null;

  const taken = takenTeamIds(state);
  const nextPlayerId = pickOrder(state)[state.picks.length + 1] ?? null;
  const nextOwned = nextPlayerId ? divisionsOwnedBy(state, nextPlayerId) : new Set<string>();

  const scored = candidates.map((team) => {
    const valuation = board.byId[team.id];
    const divisionMates = TEAMS.filter((t) => t.division === team.division && !taken.has(t.id))
      .map((t) => board.byId[t.id])
      .filter((v): v is NonNullable<typeof v> => Boolean(v));
    const isLegalForNext = !!nextPlayerId && !nextOwned.has(team.division);
    const value = valuation ? strategyScore(valuation, profile, divisionMates, isLegalForNext) : 0;
    return { teamId: team.id, value };
  });

  const maxValue = Math.max(...scored.map((s) => s.value));
  const teamId = softmaxSample(scored, profile.tau || TAU_PRESETS.competent, rand);
  const chosen = scored.find((s) => s.teamId === teamId)!;

  let tag: PickTag | undefined;
  if (profile.homerTeamId === teamId) tag = 'homer';
  else if (chosen.value < maxValue - 0.5) tag = 'reach';

  return { teamId, tag };
}

/** §4 — apply the CPU's chosen pick and cascade any newly-forced picks. */
export function makeCpuPick(
  state: DraftState,
  board: ValuationBoard = VALUATION_BOARD_2026,
  rand: () => number = Math.random,
): DraftState {
  const choice = cpuChoosePick(state, board, rand);
  if (!choice) return state;
  const next = applyPick(state, choice.teamId, choice.tag);
  if (next === state) return state;
  return autoResolveForced(next);
}

/** Toggle a seat between human and CPU control, assigning a fresh profile. */
export function setMemberIsCpu(
  state: DraftState,
  playerId: string,
  isCpu: boolean,
  rand: () => number = Math.random,
): DraftState {
  const members = state.members.map((m) => {
    if (m.id !== playerId) return m;
    if (!isCpu) return { ...m, isCpu: false, cpu: undefined };
    const cpu: CpuProfile =
      m.cpu ?? {
        strategy: randomStrategy(rand),
        tau: TAU_PRESETS.competent,
        homerTeamId: TEAMS[Math.floor(rand() * TEAMS.length)]?.id,
      };
    return { ...m, isCpu: true, cpu };
  });
  return { ...state, members };
}

export function setMemberCpuStrategy(
  state: DraftState,
  playerId: string,
  strategy: CpuStrategy,
): DraftState {
  const members = state.members.map((m) =>
    m.id === playerId && m.cpu ? { ...m, cpu: { ...m.cpu, strategy } } : m,
  );
  return { ...state, members };
}

export function setMemberCpuTau(state: DraftState, playerId: string, tau: number): DraftState {
  const members = state.members.map((m) =>
    m.id === playerId && m.cpu ? { ...m, cpu: { ...m.cpu, tau } } : m,
  );
  return { ...state, members };
}

export function undoLastPick(state: DraftState): DraftState {
  if (!state.picks.length) return state;
  return {
    ...state,
    picks: state.picks.slice(0, -1),
    status: state.status === 'complete' ? 'active' : state.status,
  };
}

export function startDraft(state: DraftState): DraftState {
  return {
    ...state,
    status: 'active',
    picks: [],
    startedAt: new Date().toISOString(),
  };
}

export function resetDraft(state: DraftState): DraftState {
  return freshState(state.members);
}

export function shuffleOrder(state: DraftState): DraftState {
  const order = [...(state.order.length ? state.order : state.members.map((m) => m.id))];
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return { ...state, order };
}

/** §3.1 — division-first choice board: one row per open, contested division. */
export interface DivisionChoice {
  division: string;
  availableCount: number;
  bestTeamId: string;
  bestPoints: number;
}

export function divisionChoiceBoard(
  state: DraftState,
  playerId: string,
  board: ValuationBoard = VALUATION_BOARD_2026,
): DivisionChoice[] {
  const taken = takenTeamIds(state);
  const owned = divisionsOwnedBy(state, playerId);
  const reserved = new Set(reservedForPlayer(state, playerId).map((r) => r.division));

  return DIVISIONS.filter((d) => !owned.has(d) && !reserved.has(d))
    .map((division) => {
      const available = TEAMS.filter((t) => t.division === division && !taken.has(t.id));
      const best = available.reduce<{ teamId: string; points: number } | null>((acc, t) => {
        const points = board.byId[t.id]?.points ?? 0;
        return !acc || points > acc.points ? { teamId: t.id, points } : acc;
      }, null);
      return {
        division,
        availableCount: available.length,
        bestTeamId: best?.teamId ?? '',
        bestPoints: best?.points ?? 0,
      };
    })
    .filter((d) => d.availableCount > 0);
}

/** §7 item 9 — cumulative projected points and title-share for a roster. */
export function rosterValuation(
  state: DraftState,
  playerId: string,
  board: ValuationBoard = VALUATION_BOARD_2026,
): { points: number; title: number } {
  return picksByPlayer(state, playerId).reduce(
    (acc, p) => {
      const v = board.byId[p.teamId];
      return { points: acc.points + (v?.points ?? 0), title: acc.title + (v?.title ?? 0) };
    },
    { points: 0, title: 0 },
  );
}

/** Rosters as Player[] for the leaderboard / schedule / standings. */
export function rostersAsPlayers(): Player[] {
  const s = loadDraft();
  return s.members.map((m) => ({
    id: m.id,
    name: m.name,
    totalPoints: 0,
    projectedTotal: 0,
    teams: s.picks
      .filter((p) => p.playerId === m.id)
      .map((p) => ({ teamId: p.teamId, wins: 0, losses: 0, gamesPlayed: 0, projectedWins: 0 })),
  }));
}
