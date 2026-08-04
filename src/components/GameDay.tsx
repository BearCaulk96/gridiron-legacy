import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import type { LeagueState } from '../game/types';
import {
  ballSpotLabel,
  createLiveGame,
  formatClock,
  stepPlay,
  stepUntilFinal,
  stepUntilQuarterChange,
  totalYards,
  type LiveGameState,
  type PlayKind,
} from '../game/playByPlay';
import { currentCalendar, formatCalendarLabel } from '../game/calendar';
import { userGameThisWeek } from '../game/season';
import { TeamLogo } from './TeamLogo';

interface Props {
  state: LeagueState;
  onFinish: (live: LiveGameState) => void;
  onBack: () => void;
}

interface Marker {
  id: string;
  kind: 'O' | 'X';
  x: number;
  y: number;
}

interface FieldFx {
  key: number;
  kind: PlayKind | 'idle';
  from: number;
  to: number;
  los: number;
  firstDown: number;
  dir: 1 | -1;
}

function yardToLeft(yard: number): number {
  return 12 + (Math.min(100, Math.max(0, yard)) / 100) * 76;
}

function firstDownYard(live: LiveGameState): number {
  if (live.possession === 'home') return Math.min(100, live.ballOn + live.distance);
  return Math.max(0, live.ballOn - live.distance);
}

function GoalPosts({ side }: { side: 'left' | 'right' }) {
  return (
    <svg
      className={`gameday-posts ${side}`}
      viewBox="0 0 40 80"
      aria-hidden
    >
      <rect x="18" y="48" width="4" height="28" fill="#c0c0c0" />
      <rect x="4" y="46" width="32" height="3.5" fill="#e8e8e8" />
      <rect x="4" y="8" width="3.5" height="40" fill="#f0f0f0" />
      <rect x="32.5" y="8" width="3.5" height="40" fill="#f0f0f0" />
    </svg>
  );
}

/**
 * Place O (offense) / X (defense) with play-specific movement so the
 * board reads like a real snap — dropbacks, routes, run fits, kicks.
 */
function formationMarkers(live: LiveGameState, fx: FieldFx): Marker[] {
  const los = yardToLeft(fx.kind === 'idle' ? live.ballOn : fx.los);
  const dir = fx.dir;
  const kind = fx.kind;
  const oBack = -dir * 3.1;
  const dFwd = dir * 3.2;

  let offense: Array<[number, number]> = [
    [oBack - dir * 2.0, 50], // QB
    [oBack, 30],
    [oBack, 40],
    [oBack, 50], // C
    [oBack, 60],
    [oBack, 70],
    [oBack + dir * 1.2, 20], // TE/slot
    [oBack + dir * 1.2, 80],
    [oBack - dir * 4.2, 44], // RB
    [oBack + dir * 4.0, 18], // WR
    [oBack + dir * 4.0, 82], // WR
  ];

  let defense: Array<[number, number]> = [
    [dFwd, 34],
    [dFwd, 46],
    [dFwd, 54],
    [dFwd, 66],
    [dFwd + dir * 2.0, 22],
    [dFwd + dir * 2.0, 78],
    [dFwd + dir * 4.2, 38],
    [dFwd + dir * 4.2, 50],
    [dFwd + dir * 4.2, 62],
    [dFwd + dir * 7.2, 28],
    [dFwd + dir * 7.2, 72],
  ];

  if (kind === 'pass' || kind === 'sack') {
    offense = [
      [oBack - dir * 4.5, 50], // QB drop
      [oBack, 30],
      [oBack, 40],
      [oBack, 50],
      [oBack, 60],
      [oBack, 70],
      [oBack + dir * 5.5, 16], // dig
      [oBack + dir * 8.5, 78], // go
      [oBack - dir * 2.5, 58], // check RB
      [oBack + dir * 9.5, 24], // deep out
      [oBack + dir * 7.0, 50], // seam
    ];
    defense = [
      [dFwd + dir * 1.5, 34],
      [dFwd + dir * 1.5, 50],
      [dFwd + dir * 1.5, 66],
      [dFwd + dir * 3.5, 20],
      [dFwd + dir * 3.5, 80],
      [dFwd + dir * 6.0, 30],
      [dFwd + dir * 6.0, 50],
      [dFwd + dir * 6.0, 70],
      [dFwd + dir * 9.0, 22],
      [dFwd + dir * 9.0, 50],
      [dFwd + dir * 9.0, 78],
    ];
    if (kind === 'sack') {
      offense[0] = [oBack - dir * 3.2, 50];
      defense[1] = [oBack - dir * 2.5, 50];
    }
  } else if (kind === 'run') {
    const lane = dir * 5.5;
    offense = [
      [oBack - dir * 1.2, 50],
      [oBack + dir * 1.5, 34],
      [oBack + dir * 1.5, 42],
      [oBack + dir * 1.5, 50],
      [oBack + dir * 1.5, 58],
      [oBack + dir * 1.5, 66],
      [oBack + dir * 2.5, 22],
      [oBack + lane, 48], // RB through hole
      [oBack + dir * 3.5, 18],
      [oBack + dir * 3.5, 82],
      [oBack + dir * 0.5, 55],
    ];
    defense = [
      [dFwd - dir * 0.5, 36],
      [dFwd - dir * 0.5, 50],
      [dFwd - dir * 0.5, 64],
      [dFwd + dir * 1.5, 28],
      [dFwd + dir * 1.5, 72],
      [dFwd + dir * 3.0, 44],
      [dFwd + dir * 3.0, 56],
      [dFwd + dir * 5.0, 40],
      [dFwd + dir * 5.0, 60],
      [dFwd + dir * 7.0, 32],
      [dFwd + dir * 7.0, 68],
    ];
  } else if (kind === 'fieldGoal' || kind === 'extraPoint') {
    offense = [
      [oBack - dir * 5.5, 50], // holder/kicker cluster
      [oBack - dir * 7.0, 50],
      [oBack, 28],
      [oBack, 36],
      [oBack, 44],
      [oBack, 56],
      [oBack, 64],
      [oBack, 72],
      [oBack - dir * 2.0, 40],
      [oBack - dir * 2.0, 60],
      [oBack + dir * 0.5, 50],
    ];
    defense = [
      [dFwd, 30],
      [dFwd, 40],
      [dFwd, 50],
      [dFwd, 60],
      [dFwd, 70],
      [dFwd + dir * 2.0, 35],
      [dFwd + dir * 2.0, 50],
      [dFwd + dir * 2.0, 65],
      [dFwd + dir * 4.0, 45],
      [dFwd + dir * 4.0, 55],
      [dFwd + dir * 6.0, 50],
    ];
  } else if (kind === 'punt' || kind === 'kickoff') {
    offense = [
      [oBack - dir * 6.0, 50],
      [oBack, 25],
      [oBack, 35],
      [oBack, 45],
      [oBack, 55],
      [oBack, 65],
      [oBack, 75],
      [oBack - dir * 2.0, 30],
      [oBack - dir * 2.0, 70],
      [oBack + dir * 2.0, 40],
      [oBack + dir * 2.0, 60],
    ];
    defense = [
      [dFwd + dir * 8.0, 50],
      [dFwd + dir * 2.0, 25],
      [dFwd + dir * 2.0, 40],
      [dFwd + dir * 2.0, 60],
      [dFwd + dir * 2.0, 75],
      [dFwd + dir * 5.0, 35],
      [dFwd + dir * 5.0, 50],
      [dFwd + dir * 5.0, 65],
      [dFwd + dir * 10.0, 30],
      [dFwd + dir * 10.0, 50],
      [dFwd + dir * 10.0, 70],
    ];
  }

  const clampX = (x: number) => Math.min(94, Math.max(6, x));
  const markers: Marker[] = [];
  offense.forEach(([dx, y], i) => {
    markers.push({ id: `o${i}`, kind: 'O', x: clampX(los + dx), y });
  });
  defense.forEach(([dx, y], i) => {
    markers.push({ id: `x${i}`, kind: 'X', x: clampX(los + dx), y });
  });
  return markers;
}

function BoxTable({
  title,
  stats,
}: {
  title: string;
  stats: LiveGameState['homeStats'];
}) {
  return (
    <div className="gameday-box">
      <h3>{title}</h3>
      <dl>
        <div>
          <dt>Total yards</dt>
          <dd>{totalYards(stats)}</dd>
        </div>
        <div>
          <dt>Passing</dt>
          <dd>
            {stats.completions}/{stats.attempts}, {stats.passYards} yd, {stats.passTd} TD
          </dd>
        </div>
        <div>
          <dt>Rushing</dt>
          <dd>
            {stats.rushes} att, {stats.rushYards} yd, {stats.rushTd} TD
          </dd>
        </div>
        <div>
          <dt>First downs</dt>
          <dd>{stats.firstDowns}</dd>
        </div>
        <div>
          <dt>Turnovers</dt>
          <dd>{stats.turnovers}</dd>
        </div>
        <div>
          <dt>Sacks / INT</dt>
          <dd>
            {stats.sacks} / {stats.ints}
          </dd>
        </div>
      </dl>
    </div>
  );
}

function ballClass(kind: PlayKind | 'idle'): string {
  if (kind === 'pass') return 'fly-pass';
  if (kind === 'fieldGoal' || kind === 'extraPoint') return 'fly-kick';
  if (kind === 'punt' || kind === 'kickoff') return 'fly-punt';
  if (kind === 'run') return 'fly-run';
  return 'fly-idle';
}

export function GameDay({ state, onFinish, onBack }: Props) {
  const matchup = useMemo(() => userGameThisWeek(state), [state]);
  const [live, setLive] = useState<LiveGameState | null>(() =>
    matchup ? createLiveGame(state, matchup) : null,
  );
  const [watching, setWatching] = useState(false);
  const [pulse, setPulse] = useState(0);
  const fxKey = useRef(0);
  const [fx, setFx] = useState<FieldFx>(() => ({
    key: 0,
    kind: 'idle',
    from: 25,
    to: 25,
    los: 25,
    firstDown: 35,
    dir: 1,
  }));

  const home = state.teams.find((t) => t.id === live?.homeId);
  const away = state.teams.find((t) => t.id === live?.awayId);

  const applyStep = (prev: LiveGameState): LiveGameState => {
    const from = prev.ballOn;
    const los = prev.ballOn;
    const firstDown = firstDownYard(prev);
    const dir: 1 | -1 = prev.possession === 'home' ? 1 : -1;
    const next = structuredClone(prev);
    stepPlay(state, next);
    const kind = next.lastPlay?.kind ?? 'idle';
    let to = next.ballOn;
    // Field goals / XP fly toward the uprights at the far end line
    if (kind === 'fieldGoal' || kind === 'extraPoint') {
      to = dir === 1 ? 100 : 0;
    } else if (kind === 'punt' || kind === 'kickoff') {
      to = next.ballOn;
    } else if (kind === 'pass') {
      // Incomplete / short throws still show an air arc downfield
      if (Math.abs(to - from) < 3) {
        to = Math.min(100, Math.max(0, from + dir * 12));
      }
    } else if (kind === 'sack') {
      to = from;
    }
    fxKey.current += 1;
    setFx({
      key: fxKey.current,
      kind,
      from,
      to,
      los,
      firstDown,
      dir,
    });
    setPulse((p) => p + 1);
    return next;
  };

  useEffect(() => {
    if (!watching) return;
    const id = window.setInterval(() => {
      setLive((prev) => {
        if (!prev || prev.phase === 'final') {
          setWatching(false);
          return prev;
        }
        const next = applyStep(prev);
        if (next.phase === 'final') setWatching(false);
        return next;
      });
    }, 1100);
    return () => window.clearInterval(id);
  }, [watching, state]);

  // Settle back to idle markers after the flight finishes
  useEffect(() => {
    if (!live || fx.kind === 'idle') return;
    const t = window.setTimeout(() => {
      setFx((prev) => ({
        ...prev,
        kind: 'idle',
        from: live.ballOn,
        to: live.ballOn,
        los: live.ballOn,
        firstDown: firstDownYard(live),
        dir: live.possession === 'home' ? 1 : -1,
      }));
    }, 950);
    return () => window.clearTimeout(t);
  }, [fx.key, live]);

  if (!matchup || !live || !home || !away) {
    return (
      <div className="gameday-root">
        <div className="gameday-empty panel">
          <p>No game to watch this week.</p>
          <button type="button" className="btn btn-primary" onClick={onBack}>
            Back to Office
          </button>
        </div>
      </div>
    );
  }

  const markers = formationMarkers(live, fx);
  const possTeam = live.possession === 'home' ? home : away;
  const spot = ballSpotLabel(live, home.abbrev, away.abbrev);
  const downDist =
    live.phase === 'kickoff'
      ? 'Kickoff'
      : live.phase === 'final'
        ? 'Final'
        : `${live.down}${live.down === 1 ? 'st' : live.down === 2 ? 'nd' : live.down === 3 ? 'rd' : 'th'} & ${live.distance}`;

  const showLos = fx.kind === 'idle' ? live.ballOn : fx.los;
  const showFd = fx.kind === 'idle' ? firstDownYard(live) : fx.firstDown;
  const ballFrom = yardToLeft(fx.from);
  const ballTo = yardToLeft(fx.kind === 'idle' ? live.ballOn : fx.to);

  const nextPlay = () => {
    setWatching(false);
    setLive((prev) => {
      if (!prev || prev.phase === 'final') return prev;
      return applyStep(prev);
    });
  };

  const simQuarter = () => {
    setWatching(false);
    setLive((prev) => {
      if (!prev || prev.phase === 'final') return prev;
      const next = structuredClone(prev);
      stepUntilQuarterChange(state, next);
      setFx({
        key: ++fxKey.current,
        kind: 'idle',
        from: next.ballOn,
        to: next.ballOn,
        los: next.ballOn,
        firstDown: firstDownYard(next),
        dir: next.possession === 'home' ? 1 : -1,
      });
      setPulse((p) => p + 1);
      return next;
    });
  };

  const simGame = () => {
    setWatching(false);
    setLive((prev) => {
      if (!prev) return prev;
      const next = structuredClone(prev);
      stepUntilFinal(state, next);
      setPulse((p) => p + 1);
      return next;
    });
  };

  if (live.phase === 'final') {
    return (
      <div className="gameday-root gameday-final">
        <header className="gameday-final-head">
          <p className="eyebrow">Final</p>
          <div className="gameday-final-score">
            <div>
              <TeamLogo team={away} size={48} />
              <span>
                {away.city} {away.name}
              </span>
              <strong>{live.awayScore}</strong>
            </div>
            <span className="gameday-at">@</span>
            <div>
              <TeamLogo team={home} size={48} />
              <span>
                {home.city} {home.name}
              </span>
              <strong>{live.homeScore}</strong>
            </div>
          </div>
        </header>
        <div className="gameday-boxes">
          <BoxTable title={`${away.abbrev} stats`} stats={live.awayStats} />
          <BoxTable title={`${home.abbrev} stats`} stats={live.homeStats} />
        </div>
        <div className="gameday-final-actions">
          <button type="button" className="btn btn-primary" onClick={() => onFinish(live)}>
            Return to Office
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="gameday-root"
      style={
        {
          '--home-primary': home.primary,
          '--home-secondary': home.secondary,
          '--home-accent': home.accent,
          '--away-primary': away.primary,
          '--away-secondary': away.secondary,
        } as CSSProperties
      }
    >
      <header className="gameday-top">
        <button type="button" className="btn btn-ghost" onClick={onBack}>
          Office
        </button>
        <div className="gameday-matchup">
          <span>
            {away.abbrev} @ {home.abbrev}
          </span>
          <small>
            {formatCalendarLabel(currentCalendar(state), state.season)} · {home.city}
          </small>
        </div>
        <span className="gameday-scheme">
          {live.possession === 'home' ? home.abbrev : away.abbrev} ·{' '}
          {live.possession === 'home' ? live.homeScheme : live.awayScheme}
        </span>
      </header>

      <div className={`gameday-field ${pulse % 2 === 0 ? 'pulse-a' : 'pulse-b'}`} aria-label="Football field">
        <div className="gameday-endzone left">
          <GoalPosts side="left" />
          <TeamLogo team={home} size={40} />
          <span>
            {home.city}
            <br />
            {home.name}
          </span>
        </div>

        <div className="gameday-grid">
          <div className="gameday-hashes" aria-hidden />
          {[10, 20, 30, 40, 50, 40, 30, 20, 10].map((n, i) => (
            <div key={i} className="gameday-yard" data-n={n} />
          ))}

          <div
            className="gameday-los"
            style={{ left: `${yardToLeft(showLos)}%` }}
            title="Line of scrimmage"
          />
          <div
            className="gameday-fd"
            style={{ left: `${yardToLeft(showFd)}%` }}
            title="First down"
          />

          {markers.map((m) => (
            <span
              key={m.id}
              className={`gameday-marker kind-${m.kind}`}
              style={{ left: `${m.x}%`, top: `${m.y}%` }}
            >
              {m.kind}
            </span>
          ))}

          <div
            key={`ball-${fx.key}-${fx.kind}`}
            className={`gameday-ball ${ballClass(fx.kind)}`}
            style={
              {
                '--ball-from': `${ballFrom}%`,
                '--ball-to': `${ballTo}%`,
              } as CSSProperties
            }
            aria-hidden
          />
        </div>

        <div className="gameday-endzone right">
          <GoalPosts side="right" />
          <TeamLogo team={away} size={40} />
          <span>
            {away.city}
            <br />
            {away.name}
          </span>
        </div>
      </div>

      <section className="gameday-board">
        <div className="gameday-scoreline">
          <div className={live.possession === 'away' ? 'has-ball' : ''}>
            <TeamLogo team={away} size={28} />
            <span>{away.abbrev}</span>
            <strong>{live.awayScore}</strong>
          </div>
          <div className="gameday-clock">
            <span>
              Q{live.quarter} · {formatClock(live.clock)}
            </span>
            <small>
              {downDist} · Ball on {spot}
            </small>
          </div>
          <div className={live.possession === 'home' ? 'has-ball' : ''}>
            <strong>{live.homeScore}</strong>
            <span>{home.abbrev}</span>
            <TeamLogo team={home} size={28} />
          </div>
        </div>
        <p className="gameday-possession">
          Possession: {possTeam.city} {possTeam.name}
        </p>
        <p className="gameday-play" key={pulse}>
          {live.lastPlay?.text ?? live.log[0] ?? 'Ready for kickoff.'}
        </p>
        <div className="gameday-controls">
          <button type="button" className="btn btn-primary" onClick={nextPlay}>
            Next play
          </button>
          <button
            type="button"
            className={`btn ${watching ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setWatching((w) => !w)}
          >
            {watching ? 'Pause watch' : 'Watch plays'}
          </button>
          <button type="button" className="btn btn-ghost" onClick={simQuarter}>
            Sim quarter
          </button>
          <button type="button" className="btn btn-ghost" onClick={simGame}>
            Sim game
          </button>
        </div>
      </section>
    </div>
  );
}
