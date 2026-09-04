import { useEffect, useMemo, useState } from 'react';
import { Undo2, RotateCcw, Shuffle, CheckCircle2, ChevronUp, ChevronDown, ChevronLeft, Bot, User, Lock, FlaskConical, X } from 'lucide-react';
import { toast } from 'sonner';
import { TEAMS, getTeamById } from '../data/teams';
import { TeamLogo } from '../lib/teamLogos';
import { VALUATION_BOARD_2026 } from '../lib/valuation';
import { TAU_PRESETS, type CpuStrategy } from '../lib/cpuAI';
import {
  loadDraft,
  saveDraft,
  clearDraft,
  startDraft,
  shuffleOrder,
  makePick,
  makeCpuPick,
  undoLastPick,
  resetDraft,
  onTheClock,
  currentRound,
  totalPicks,
  takenTeamIds,
  divisionsOwnedBy,
  picksByPlayer,
  memberName,
  divisionChoiceBoard,
  reservedForPlayer,
  rosterValuation,
  setMemberIsCpu,
  setMemberCpuStrategy,
  setMemberCpuTau,
  DIVISIONS,
  ROUNDS,
  LIVE_KEY,
  SIM_KEY,
  type DraftState,
  type PickTag,
} from '../lib/draftStore';

const shortDiv = (d: string) => {
  const [conf, region] = d.split(' ');
  return `${conf} ${region[0]}`;
};

const STRATEGY_LABEL: Record<CpuStrategy, string> = {
  chalk: 'Chalk',
  scarcity: 'Scarcity',
  blocker: 'Blocker',
};

const TAG_LABEL: Record<PickTag, string> = {
  homer: 'Homer',
  reach: 'Reach',
  reserved: 'Reserved',
};

function TagBadge({ tag }: { tag?: PickTag }) {
  if (!tag) return null;
  return <span className={`dr-tag dr-tag-${tag}`}>{TAG_LABEL[tag]}</span>;
}

function pct(v: number) {
  return `${(v * 100).toFixed(1)}%`;
}

export function Draft() {
  // Simulation mode is a fully separate storage key (SIM_KEY vs LIVE_KEY) —
  // running a test draft here can never touch the real draft, and
  // rostersAsPlayers() (leaderboard/schedule) only ever reads LIVE_KEY.
  const [simulate, setSimulate] = useState(false);
  const storageKey = simulate ? SIM_KEY : LIVE_KEY;
  const [state, setState] = useState<DraftState>(() => loadDraft(storageKey));
  const [selectedDivision, setSelectedDivision] = useState<string | null>(null);
  const board = VALUATION_BOARD_2026;

  useEffect(() => {
    setState(loadDraft(storageKey));
    setSelectedDivision(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  const apply = (next: DraftState) => {
    setState(next);
    saveDraft(next, storageKey);
  };

  const move = (index: number, dir: -1 | 1) => {
    const order = [...state.order];
    const j = index + dir;
    if (j < 0 || j >= order.length) return;
    [order[index], order[j]] = [order[j], order[index]];
    apply({ ...state, order });
  };

  const [resetArmed, setResetArmed] = useState(false);
  const handleReset = () => {
    if (resetArmed) {
      setResetArmed(false);
      apply(resetDraft(state));
    } else {
      setResetArmed(true);
      window.setTimeout(() => setResetArmed(false), 3000);
    }
  };

  const clock = useMemo(() => onTheClock(state), [state]);
  const clockMember = useMemo(() => state.members.find((m) => m.id === clock) ?? null, [state, clock]);
  const taken = useMemo(() => takenTeamIds(state), [state]);
  const ownedDivs = useMemo(
    () => (clock ? divisionsOwnedBy(state, clock) : new Set<string>()),
    [state, clock],
  );
  const reservedForClock = useMemo(
    () => (clock ? reservedForPlayer(state, clock) : []),
    [state, clock],
  );
  const choiceBoard = useMemo(
    () => (clock ? divisionChoiceBoard(state, clock, board) : []),
    [state, clock],
  );

  // Reset the two-step selection whenever the clock changes hands.
  useEffect(() => {
    setSelectedDivision(null);
  }, [clock]);

  // Auto-play CPU turns. Chains naturally: applying a pick updates `state`,
  // which re-runs this effect and schedules the next CPU turn if the new
  // manager on the clock is also a CPU.
  useEffect(() => {
    if (state.status !== 'active' || !clockMember?.isCpu) return;
    const timer = window.setTimeout(() => {
      const next = makeCpuPick(state, board);
      if (next === state) return;
      const last = next.picks[next.picks.length - 1];
      const t = last ? getTeamById(last.teamId) : null;
      apply(next);
      if (t && last?.tag !== 'reserved') {
        toast(`${t.name} to ${memberName(state, clockMember.id)}`, {
          description: `Pick ${last!.pickNumber} of ${totalPicks(state)}`,
        });
      }
    }, 650);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const round = currentRound(state);
  const overall = state.picks.length + 1;
  const total = totalPicks(state);
  const divisionsLeft = ROUNDS - ownedDivs.size;
  const decidedPicks = state.picks.filter((p) => p.tag !== 'reserved').length;

  const styles = (
    <style>{`
      .dr-root { display: flex; flex-direction: column; gap: 16px; }
      .dr-card { background: #fff; border: 1px solid #e6e8eb; border-radius: 14px; padding: 16px;
        box-shadow: 0 1px 2px rgba(16,24,40,.04), 0 6px 20px rgba(16,24,40,.05); }
      .dr-title { font-size: 20px; font-weight: 700; color: #16202b; letter-spacing: -0.01em; }
      .dr-sub { font-size: 13px; color: #64748b; margin-top: 4px; }
      .dr-eyebrow { font-size: 11px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; color: #c2410c; }
      .dr-btn { display: inline-flex; align-items: center; justify-content: center; gap: 7px;
        font-size: 14px; font-weight: 600; border-radius: 10px; padding: 10px 16px; cursor: pointer;
        border: 1px solid transparent; transition: background .15s, border-color .15s, opacity .15s; }
      .dr-btn-primary { background: #ea580c; color: #fff; }
      .dr-btn-primary:hover { background: #c2410c; }
      .dr-btn-ghost { background: #fff; color: #334155; border-color: #d5dae0; }
      .dr-btn-ghost:hover { background: #f6f8fa; }
      .dr-btn:disabled { opacity: .45; cursor: not-allowed; }
      .dr-move { display: inline-flex; align-items: center; justify-content: center; width: 36px; height: 36px; border-radius: 9px; border: 1px solid #d5dae0; background: #fff; color: #334155; cursor: pointer; }
      .dr-move:disabled { opacity: .35; cursor: not-allowed; }
      .dr-move:active { background: #f1f3f5; }
      .dr-clock { background: linear-gradient(135deg, #ea580c, #c2410c); color: #fff; border-radius: 16px;
        padding: 18px; box-shadow: 0 10px 28px rgba(234,88,12,.30); }
      .dr-clock-name { font-size: 26px; font-weight: 800; line-height: 1.05; display: flex; align-items: center; gap: 10px; }
      .dr-chip-row { display: flex; flex-wrap: wrap; gap: 8px; }
      .dr-mini { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
      .dr-mini-cell { border-radius: 10px; padding: 8px 6px; text-align: center; border: 1px solid #e6e8eb;
        background: #f7f8fa; min-height: 46px; display: flex; flex-direction: column; justify-content: center; }
      .dr-mini-lbl { font-size: 10px; font-weight: 700; letter-spacing: .04em; }
      .dr-mini-team { font-size: 11px; font-weight: 600; margin-top: 2px; }
      .dr-divhead { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
      .dr-divname { font-size: 13px; font-weight: 700; color: #16202b; letter-spacing: .02em; }
      .dr-divstate { font-size: 12px; font-weight: 600; }
      .dr-teamrow { display: flex; align-items: center; gap: 10px; padding: 9px 10px; border-radius: 10px;
        border: 1px solid #edf0f2; background: #fff; }
      .dr-teamname { flex: 1; min-width: 0; font-size: 14px; font-weight: 600; color: #16202b; }
      .dr-teamsub { font-size: 11px; color: #94a3b8; }
      .dr-owned { background: #f4f6f8; }
      .dr-taken { opacity: .55; }
      .dr-draft { background: #ea580c; color: #fff; font-weight: 700; font-size: 12px; letter-spacing: .04em;
        border: 0; border-radius: 8px; padding: 7px 14px; cursor: pointer; text-transform: uppercase; }
      .dr-draft:hover { background: #c2410c; }
      .dr-pill { font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 999px; }
      .dr-band { display: flex; height: 6px; width: 100%; border-radius: 999px; overflow: hidden; margin: 10px 0; }
      .dr-divbtn { display: flex; justify-content: space-between; align-items: center; gap: 10px;
        padding: 12px 14px; border-radius: 12px; border: 1px solid #e6e8eb; background: #fff;
        cursor: pointer; text-align: left; width: 100%; }
      .dr-divbtn:hover { background: #f7f8fa; }
      .dr-divbtn-name { font-size: 14px; font-weight: 700; color: #16202b; }
      .dr-divbtn-meta { font-size: 11px; color: #94a3b8; margin-top: 2px; }
      .dr-divbtn-best { font-size: 12px; font-weight: 700; color: #c2410c; text-align: right; white-space: nowrap; }
      .dr-back { display: inline-flex; align-items: center; gap: 4px; font-size: 13px; font-weight: 600;
        color: #64748b; cursor: pointer; background: none; border: 0; padding: 4px 0; margin-bottom: 4px; }
      .dr-tag { font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: .04em;
        padding: 2px 6px; border-radius: 6px; white-space: nowrap; }
      .dr-tag-homer { background: #fef3c7; color: #92400e; }
      .dr-tag-reach { background: #fee2e2; color: #991b1b; }
      .dr-tag-reserved { background: #dbeafe; color: #1e40af; }
      .dr-cpu-badge { display: inline-flex; align-items: center; gap: 4px; font-size: 10px; font-weight: 700;
        padding: 2px 7px; border-radius: 999px; background: rgba(255,255,255,.2); color: #fff; text-transform: uppercase; }
      .dr-cpu-badge-light { display: inline-flex; align-items: center; gap: 4px; font-size: 10px; font-weight: 700;
        padding: 2px 7px; border-radius: 999px; background: #ede9fe; color: #5b21b6; text-transform: uppercase; }
      .dr-reserved-chip { display: flex; align-items: center; gap: 8px; padding: 8px 10px; border-radius: 10px;
        background: #eff6ff; border: 1px solid #bfdbfe; font-size: 12px; color: #1e40af; }
      .dr-pts { font-size: 11px; color: #94a3b8; }
      .dr-setup-row { display: flex; flex-direction: column; gap: 8px; padding: 10px; border-radius: 10px;
        border: 1px solid #edf0f2; background: #fff; }
      .dr-cpu-toggle { display: inline-flex; border-radius: 999px; overflow: hidden; border: 1px solid #d5dae0; }
      .dr-cpu-toggle button { font-size: 11px; font-weight: 700; padding: 5px 10px; border: 0; background: #fff;
        color: #64748b; cursor: pointer; display: inline-flex; align-items: center; gap: 4px; }
      .dr-cpu-toggle button.active { background: #16202b; color: #fff; }
      .dr-strategy-select { font-size: 12px; padding: 6px 8px; border-radius: 8px; border: 1px solid #d5dae0; background: #fff; }
      .dr-tau-row { display: flex; gap: 6px; }
      .dr-tau-btn { flex: 1; font-size: 11px; font-weight: 700; padding: 6px; border-radius: 8px;
        border: 1px solid #d5dae0; background: #fff; cursor: pointer; }
      .dr-tau-btn.active { background: #ea580c; color: #fff; border-color: #ea580c; }
      .dr-homer-note { font-size: 11px; color: #92400e; }
      .dr-sim-banner { display: flex; align-items: center; gap: 10px; padding: 10px 14px; border-radius: 12px;
        background: #ecfeff; border: 1px solid #a5f3fc; color: #0e7490; font-size: 12px; font-weight: 600; }
      .dr-sim-banner button { margin-left: auto; display: inline-flex; align-items: center; gap: 4px;
        font-size: 11px; font-weight: 700; border: 0; background: none; color: #0e7490; cursor: pointer;
        padding: 4px 6px; border-radius: 6px; }
      .dr-sim-banner button:hover { background: rgba(14,116,144,.1); }
      .dr-sim-entry { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 600;
        color: #0e7490; background: none; border: 0; cursor: pointer; padding: 4px 0; }
    `}</style>
  );

  const simBanner = simulate ? (
    <div className="dr-sim-banner">
      <FlaskConical className="size-4" />
      <span>Simulation — this test draft is isolated from your real 2026 draft.</span>
      <button
        onClick={() => {
          setSimulate(false);
        }}
      >
        <X className="size-3" /> Exit simulation
      </button>
    </div>
  ) : (
    <button className="dr-sim-entry" onClick={() => setSimulate(true)}>
      <FlaskConical className="size-3" /> Try a simulated draft (won't touch your real draft)
    </button>
  );

  // ---------------- SETUP ----------------
  if (state.status === 'setup') {
    return (
      <div className="dr-root">
        {styles}
        {simBanner}
        <div className="dr-card">
          <div className="dr-eyebrow">2026 Season</div>
          <div className="dr-title" style={{ marginTop: 4 }}>Run the draft</div>
          <div className="dr-sub">
            Snake draft, {ROUNDS} rounds. Each player drafts one team from every NFL division —
            once you take a team, that whole division is off the board for you.
          </div>
          <div className="dr-sub">Reorder players below, shuffle for a random order, or hand a seat to a CPU manager.</div>

          <div style={{ margin: '16px 0 6px', fontSize: 12, fontWeight: 700, color: '#64748b', letterSpacing: '.06em', textTransform: 'uppercase' }}>
            Draft order
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {state.order.map((id, i) => {
              const member = state.members.find((m) => m.id === id);
              const isCpu = !!member?.isCpu;
              const homer = isCpu && member?.cpu?.homerTeamId ? getTeamById(member.cpu.homerTeamId) : null;
              return (
                <div key={id} className="dr-setup-row">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 26, height: 26, borderRadius: 999, background: '#fff3ec', color: '#c2410c', fontWeight: 800, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {i + 1}
                    </div>
                    <div className="dr-teamname">{memberName(state, id)}</div>
                    <div className="dr-cpu-toggle">
                      <button
                        className={!isCpu ? 'active' : ''}
                        onClick={() => apply(setMemberIsCpu(state, id, false))}
                      >
                        <User className="size-3" /> Human
                      </button>
                      <button
                        className={isCpu ? 'active' : ''}
                        onClick={() => apply(setMemberIsCpu(state, id, true))}
                      >
                        <Bot className="size-3" /> CPU
                      </button>
                    </div>
                    <div style={{ display: 'flex', gap: 6, marginLeft: 'auto' }}>
                      <button
                        className="dr-move"
                        aria-label={`Move ${memberName(state, id)} up`}
                        disabled={i === 0}
                        onClick={() => move(i, -1)}
                      >
                        <ChevronUp className="size-4" />
                      </button>
                      <button
                        className="dr-move"
                        aria-label={`Move ${memberName(state, id)} down`}
                        disabled={i === state.order.length - 1}
                        onClick={() => move(i, 1)}
                      >
                        <ChevronDown className="size-4" />
                      </button>
                    </div>
                  </div>
                  {isCpu && member?.cpu && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, paddingLeft: 36 }}>
                      <select
                        className="dr-strategy-select"
                        value={member.cpu.strategy}
                        onChange={(e) => apply(setMemberCpuStrategy(state, id, e.target.value as CpuStrategy))}
                      >
                        {(['chalk', 'scarcity', 'blocker'] as CpuStrategy[]).map((s) => (
                          <option key={s} value={s}>{STRATEGY_LABEL[s]}</option>
                        ))}
                      </select>
                      <div className="dr-tau-row" style={{ minWidth: 180 }}>
                        {(Object.entries(TAU_PRESETS) as Array<[string, number]>).map(([label, tau]) => (
                          <button
                            key={label}
                            className={`dr-tau-btn ${member.cpu?.tau === tau ? 'active' : ''}`}
                            onClick={() => apply(setMemberCpuTau(state, id, tau))}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                      {homer && <div className="dr-homer-note">Homer: {homer.name}</div>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button className="dr-btn dr-btn-ghost" onClick={() => apply(shuffleOrder(state))}>
              <Shuffle className="size-4" /> Shuffle
            </button>
            <button className="dr-btn dr-btn-primary" style={{ flex: 1 }} onClick={() => apply(startDraft(state))}>
              Start draft
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---------------- COMPLETE ----------------
  if (state.status === 'complete') {
    return (
      <div className="dr-root">
        {styles}
        {simBanner}
        <div className="dr-card" style={{ borderColor: '#bbf7d0', background: '#f0fdf4' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <CheckCircle2 className="size-6" style={{ color: '#16a34a' }} />
            <div>
              <div className="dr-title" style={{ fontSize: 18 }}>Draft complete</div>
              <div className="dr-sub" style={{ marginTop: 2 }}>All {total} picks are in. Rosters are set for the 2026 season.</div>
            </div>
          </div>
        </div>

        {state.members.map((m) => {
          const picks = picksByPlayer(state, m.id);
          const { points, title } = rosterValuation(state, m.id, board);
          return (
            <div key={m.id} className="dr-card">
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <div className="dr-title" style={{ fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  {m.name}
                  {m.isCpu && <span className="dr-cpu-badge-light"><Bot className="size-3" /> CPU</span>}
                </div>
                <div className="dr-teamsub">{picks.length} teams</div>
              </div>
              <div className="dr-sub" style={{ marginTop: 2 }}>
                {points.toFixed(1)} projected pts ({((points / board.poolPoints) * 100).toFixed(1)}% of pool) · {pct(title)} title share
              </div>
              <div className="dr-band">
                {picks.map((p) => {
                  const t = getTeamById(p.teamId);
                  return <span key={p.teamId} style={{ flex: 1, backgroundColor: t?.primaryColor ?? '#d1d5db' }} />;
                })}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {picks.map((p) => {
                  const t = getTeamById(p.teamId);
                  const v = board.byId[p.teamId];
                  return (
                    <div key={p.teamId} className="dr-teamrow" style={{ borderLeft: `4px solid ${t?.primaryColor ?? '#d1d5db'}` }}>
                      <TeamLogo teamId={p.teamId} size="sm" />
                      <div className="dr-teamname">{t?.name ?? p.teamId}</div>
                      <div className="dr-teamsub">{p.division}</div>
                      {v && <div className="dr-pts">{v.points.toFixed(1)} pts</div>}
                      <TagBadge tag={p.tag} />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        <button
          className="dr-btn dr-btn-ghost"
          style={resetArmed ? { borderColor: '#dc2626', color: '#dc2626' } : undefined}
          onClick={handleReset}
        >
          <RotateCcw className="size-4" /> {resetArmed ? 'Tap again to reset' : 'Reset draft'}
        </button>
      </div>
    );
  }

  // ---------------- ACTIVE ----------------
  const clockName = memberName(state, clock);
  const rosterProjection = clock ? rosterValuation(state, clock, board) : { points: 0, title: 0 };

  const pick = (teamId: string) => {
    const next = makePick(state, teamId);
    if (next === state) return;
    const t = getTeamById(teamId);
    apply(next);
    setSelectedDivision(null);
    toast.success(`${t?.name ?? 'Team'} to ${clockName}`, { description: `Pick ${overall} of ${total}` });
  };

  const selectedDivisionTeams = selectedDivision
    ? TEAMS.filter((t) => t.division === selectedDivision && !taken.has(t.id))
        .map((t) => ({ team: t, valuation: board.byId[t.id] }))
        .sort((a, b) => (b.valuation?.points ?? 0) - (a.valuation?.points ?? 0))
    : [];

  return (
    <div className="dr-root">
      {styles}
      {simBanner}

      {/* On the clock */}
      <div className="dr-clock">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,.85)' }}>
            On the clock
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,.85)' }}>
            Round {round} / {ROUNDS} · Pick {overall} / {total}
          </div>
        </div>
        <div className="dr-clock-name" style={{ marginTop: 4 }}>
          {clockName}
          {clockMember?.isCpu && (
            <span className="dr-cpu-badge">
              <Bot className="size-3" /> CPU · {STRATEGY_LABEL[clockMember.cpu?.strategy ?? 'chalk']}
            </span>
          )}
        </div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,.9)', marginTop: 4 }}>
          {divisionsLeft} division{divisionsLeft === 1 ? '' : 's'} left to fill
          {clockMember?.isCpu && ' · thinking…'}
        </div>
      </div>

      {/* This player's division board */}
      <div className="dr-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', letterSpacing: '.06em', textTransform: 'uppercase' }}>
            {clockName}'s board
          </div>
          <div className="dr-pts">{rosterProjection.points.toFixed(1)} pts · {pct(rosterProjection.title)} title share</div>
        </div>
        <div className="dr-mini">
          {DIVISIONS.map((d) => {
            const owned = picksByPlayer(state, clock ?? '').find((p) => p.division === d);
            const t = owned ? getTeamById(owned.teamId) : null;
            const isReserved = reservedForClock.some((r) => r.division === d);
            return (
              <div
                key={d}
                className="dr-mini-cell"
                style={owned ? { background: t?.primaryColor ?? '#334155', borderColor: 'transparent', color: '#fff' } : {}}
              >
                <div className="dr-mini-lbl" style={{ color: owned ? 'rgba(255,255,255,.85)' : '#94a3b8' }}>{shortDiv(d)}</div>
                <div className="dr-mini-team" style={{ color: owned ? '#fff' : '#cbd5e1' }}>
                  {t ? t.city : isReserved ? <Lock className="size-3" /> : '—'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Reserved-but-not-yet-claimed teams for the manager on the clock */}
      {reservedForClock.length > 0 && (
        <div className="dr-card">
          <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 8 }}>
            Locked in for {clockName}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {reservedForClock.map((r) => {
              const t = getTeamById(r.teamId);
              return (
                <div key={r.division} className="dr-reserved-chip">
                  <Lock className="size-3" />
                  <TeamLogo teamId={r.teamId} size="sm" />
                  <div style={{ flex: 1 }}>{t?.name ?? r.teamId}</div>
                  <div>{r.division}</div>
                </div>
              );
            })}
          </div>
          <div className="dr-sub" style={{ marginTop: 6 }}>
            No one else can take these — they'll be added automatically once your other picks are made.
          </div>
        </div>
      )}

      {/* Two-step choice board: division, then team. Human turns only. */}
      {!clockMember?.isCpu && (
        <div className="dr-card">
          {!selectedDivision ? (
            <>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', letterSpacing: '.06em', textTransform: 'uppercase' }}>
                Pick a division for {clockName}
              </div>
              <div className="dr-sub" style={{ marginBottom: 10 }}>
                Divisions {clockName} has already locked or has reserved are hidden.
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {choiceBoard.map((d) => (
                  <button
                    key={d.division}
                    className="dr-divbtn"
                    onClick={() => {
                      if (d.availableCount === 1) {
                        pick(d.bestTeamId);
                      } else {
                        setSelectedDivision(d.division);
                      }
                    }}
                  >
                    <div>
                      <div className="dr-divbtn-name">{d.division}</div>
                      <div className="dr-divbtn-meta">{d.availableCount} team{d.availableCount === 1 ? '' : 's'} available</div>
                    </div>
                    <div className="dr-divbtn-best">
                      Best: {getTeamById(d.bestTeamId)?.name ?? '—'}
                      <div className="dr-pts">{d.bestPoints.toFixed(1)} pts</div>
                    </div>
                  </button>
                ))}
                {choiceBoard.length === 0 && (
                  <div className="dr-sub">Nothing contested right now — resolving automatically…</div>
                )}
              </div>
            </>
          ) : (
            <>
              <button className="dr-back" onClick={() => setSelectedDivision(null)}>
                <ChevronLeft className="size-4" /> All divisions
              </button>
              <div className="dr-divname" style={{ marginBottom: 8 }}>{selectedDivision}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {selectedDivisionTeams.map(({ team, valuation }) => (
                  <div key={team.id} className="dr-teamrow" style={{ borderLeft: `4px solid ${team.primaryColor}` }}>
                    <TeamLogo teamId={team.id} size="sm" />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="dr-teamname">{team.name}</div>
                      {valuation && (
                        <div className="dr-pts">{valuation.points.toFixed(1)} pts · {pct(valuation.title)} title</div>
                      )}
                    </div>
                    <button className="dr-draft" onClick={() => pick(team.id)}>Draft</button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Controls */}
      <div style={{ display: 'flex', gap: 10 }}>
        <button className="dr-btn dr-btn-ghost" style={{ flex: 1 }} disabled={state.picks.length === 0} onClick={() => apply(undoLastPick(state))}>
          <Undo2 className="size-4" /> Undo pick
        </button>
        <button
          className="dr-btn dr-btn-ghost"
          style={resetArmed ? { flex: 1, borderColor: '#dc2626', color: '#dc2626' } : { flex: 1 }}
          onClick={handleReset}
        >
          <RotateCcw className="size-4" /> {resetArmed ? 'Tap again' : 'Reset'}
        </button>
      </div>

      {/* Picks so far */}
      {state.picks.length > 0 && (
        <div className="dr-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', letterSpacing: '.06em', textTransform: 'uppercase' }}>
              Picks so far
            </div>
            <div className="dr-pts">{decidedPicks} decided · {state.picks.length - decidedPicks} auto-filled</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[...state.picks].reverse().map((p) => {
              const t = getTeamById(p.teamId);
              return (
                <div key={p.pickNumber} className="dr-teamrow" style={{ borderLeft: `4px solid ${t?.primaryColor ?? '#d1d5db'}`, padding: '7px 10px' }}>
                  <div className="dr-teamsub" style={{ width: 28 }}>#{p.pickNumber}</div>
                  <TeamLogo teamId={p.teamId} size="sm" />
                  <div className="dr-teamname">{t?.name ?? p.teamId}</div>
                  <TagBadge tag={p.tag} />
                  <div className="dr-teamsub">{memberName(state, p.playerId)}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
