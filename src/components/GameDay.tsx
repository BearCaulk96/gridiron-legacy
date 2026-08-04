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
  role?: string;
}

type FormationId =
  | 'shotgun'
  | 'pistol'
  | 'iForm'
  | 'singleback'
  | 'trips'
  | 'empty'
  | 'goalLine'
  | 'kick'
  | 'punt'
  | 'kickoff';

interface FieldFx {
  key: number;
  kind: PlayKind | 'idle';
  from: number;
  to: number;
  los: number;
  firstDown: number;
  dir: 1 | -1;
  formation: FormationId;
  /** Ball start/end as % of the pitch layer (includes end zones). */
  ballFromX: number;
  ballFromY: number;
  ballToX: number;
  ballToY: number;
  handoffX: number;
  handoffY: number;
  made: boolean;
  /** Possession side when the play snapped (for O/X team colors). */
  offenseSide: 'home' | 'away';
  /** How long this play should be enjoyed before the next one. */
  durationMs: number;
  deep: boolean;
}

/** Map 0–100 yard line onto the playable grid (goal line to goal line). */
function yardToLeft(yard: number): number {
  return Math.min(100, Math.max(0, yard));
}

/** Yard line → % across the full pitch (end zone + field + end zone). */
function yardToPitch(yard: number): number {
  return 8.5 + (Math.min(100, Math.max(0, yard)) / 100) * 83;
}

const YARD_NUMBERS = [
  { n: 10, at: 10 },
  { n: 20, at: 20 },
  { n: 30, at: 30 },
  { n: 40, at: 40 },
  { n: 50, at: 50 },
  { n: 40, at: 60 },
  { n: 30, at: 70 },
  { n: 20, at: 80 },
  { n: 10, at: 90 },
] as const;

function firstDownYard(live: LiveGameState): number {
  if (live.possession === 'home') return Math.min(100, live.ballOn + live.distance);
  return Math.max(0, live.ballOn - live.distance);
}

function GoalPosts({ side }: { side: 'left' | 'right' }) {
  return (
    <svg className={`gameday-posts ${side}`} viewBox="0 0 48 100" aria-hidden>
      <rect x="22" y="62" width="4" height="34" fill="#f5c518" />
      <rect x="6" y="58" width="36" height="4.5" rx="1" fill="#ffd84d" />
      <rect x="6" y="10" width="4" height="50" rx="1" fill="#ffd84d" />
      <rect x="38" y="10" width="4" height="50" rx="1" fill="#ffd84d" />
    </svg>
  );
}

function FootballIcon() {
  return (
    <svg className="gameday-ball-svg" viewBox="0 0 48 28" aria-hidden>
      <defs>
        <radialGradient id="fb-leather" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#a5673f" />
          <stop offset="55%" stopColor="#6b3a1f" />
          <stop offset="100%" stopColor="#3d2110" />
        </radialGradient>
      </defs>
      <ellipse cx="24" cy="14" rx="22" ry="12" fill="url(#fb-leather)" stroke="#2a160c" strokeWidth="1" />
      <path
        d="M6 14 Q24 6.5 42 14"
        fill="none"
        stroke="rgba(245,230,210,0.35)"
        strokeWidth="1.1"
      />
      <path
        d="M6 14 Q24 21.5 42 14"
        fill="none"
        stroke="rgba(0,0,0,0.25)"
        strokeWidth="1"
      />
      <line x1="15" y1="14" x2="33" y2="14" stroke="#f7f1e6" strokeWidth="1.6" strokeLinecap="round" />
      {[18, 21, 24, 27, 30].map((x) => (
        <line
          key={x}
          x1={x}
          y1="11.2"
          x2={x}
          y2="16.8"
          stroke="#f7f1e6"
          strokeWidth="1.25"
          strokeLinecap="round"
        />
      ))}
      <ellipse cx="24" cy="14" rx="22" ry="12" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="0.8" />
    </svg>
  );
}

function clamp(n: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, n));
}

function pickFormation(live: LiveGameState, kind: PlayKind | 'idle', seed: number): FormationId {
  if (kind === 'fieldGoal' || kind === 'extraPoint') return 'kick';
  if (kind === 'punt') return 'punt';
  if (kind === 'kickoff' || live.phase === 'kickoff') return 'kickoff';

  const toGoal =
    live.possession === 'home' ? 100 - live.ballOn : live.ballOn;
  if (toGoal <= 5 || (kind === 'run' && toGoal <= 8)) return 'goalLine';

  const options: FormationId[] =
    kind === 'pass' || kind === 'sack'
      ? ['shotgun', 'shotgun', 'pistol', 'trips', 'empty', 'singleback']
      : kind === 'run'
        ? ['iForm', 'singleback', 'pistol', 'shotgun', 'goalLine']
        : live.down >= 3 && live.distance >= 6
          ? ['shotgun', 'trips', 'empty', 'pistol']
          : ['singleback', 'shotgun', 'iForm', 'pistol', 'trips'];

  return options[Math.abs(seed) % options.length]!;
}

type Spot = [number, number]; // dx from LOS in yard-%, y 0-100

function olLine(_dir: 1 | -1, depth = 0): Spot[] {
  return [
    [depth, 34],
    [depth, 42],
    [depth, 50],
    [depth, 58],
    [depth, 66],
  ];
}

function defenseBase(dir: 1 | -1, front: 'odd' | 'even' | 'nickel' = 'odd'): Spot[] {
  const d = dir * 3.0;
  if (front === 'nickel') {
    return [
      [d, 36],
      [d, 50],
      [d, 64],
      [d + dir * 2.2, 24],
      [d + dir * 2.2, 76],
      [d + dir * 4.5, 32],
      [d + dir * 4.5, 50],
      [d + dir * 4.5, 68],
      [d + dir * 8.5, 20],
      [d + dir * 8.5, 50],
      [d + dir * 8.5, 80],
    ];
  }
  if (front === 'even') {
    return [
      [d, 32],
      [d, 44],
      [d, 56],
      [d, 68],
      [d + dir * 3.2, 26],
      [d + dir * 3.2, 74],
      [d + dir * 5.0, 40],
      [d + dir * 5.0, 60],
      [d + dir * 8.0, 22],
      [d + dir * 8.0, 50],
      [d + dir * 8.0, 78],
    ];
  }
  return [
    [d, 34],
    [d, 46],
    [d, 54],
    [d, 66],
    [d + dir * 2.2, 22],
    [d + dir * 2.2, 78],
    [d + dir * 4.5, 38],
    [d + dir * 4.5, 50],
    [d + dir * 4.5, 62],
    [d + dir * 8.0, 26],
    [d + dir * 8.0, 74],
  ];
}

function preSnapOffense(formation: FormationId, dir: 1 | -1): { spots: Spot[]; roles: string[] } {
  const back = -dir;
  switch (formation) {
    case 'shotgun':
      return {
        roles: ['qb', 'ol', 'ol', 'ol', 'ol', 'ol', 'te', 'rb', 'wr', 'wr', 'wr'],
        spots: [
          [back * 5.5, 50],
          ...olLine(dir, back * 0.2),
          [back * 0.8, 28],
          [back * 5.5, 62],
          [back * 1.0 + dir * 0.5, 14],
          [back * 1.0 + dir * 0.5, 86],
          [back * 0.6 + dir * 1.2, 22],
        ],
      };
    case 'pistol':
      return {
        roles: ['qb', 'ol', 'ol', 'ol', 'ol', 'ol', 'te', 'rb', 'wr', 'wr', 'wr'],
        spots: [
          [back * 4.2, 50],
          ...olLine(dir, back * 0.2),
          [back * 0.6, 72],
          [back * 6.5, 50],
          [back * 1.0, 14],
          [back * 1.0, 86],
          [back * 0.8, 24],
        ],
      };
    case 'iForm':
      return {
        roles: ['qb', 'ol', 'ol', 'ol', 'ol', 'ol', 'te', 'fb', 'rb', 'wr', 'wr'],
        spots: [
          [back * 2.4, 50],
          ...olLine(dir, back * 0.2),
          [back * 0.5, 28],
          [back * 5.0, 50],
          [back * 7.2, 50],
          [back * 1.0, 14],
          [back * 1.0, 86],
        ],
      };
    case 'singleback':
      return {
        roles: ['qb', 'ol', 'ol', 'ol', 'ol', 'ol', 'te', 'rb', 'wr', 'wr', 'wr'],
        spots: [
          [back * 2.4, 50],
          ...olLine(dir, back * 0.2),
          [back * 0.6, 70],
          [back * 6.0, 50],
          [back * 1.0, 12],
          [back * 1.0, 88],
          [back * 0.8, 22],
        ],
      };
    case 'trips':
      return {
        roles: ['qb', 'ol', 'ol', 'ol', 'ol', 'ol', 'te', 'rb', 'wr', 'wr', 'wr'],
        spots: [
          [back * 5.2, 50],
          ...olLine(dir, back * 0.2),
          [back * 0.6, 72],
          [back * 5.2, 60],
          [back * 1.0, 14],
          [back * 0.8, 20],
          [back * 0.6, 26],
        ],
      };
    case 'empty':
      return {
        roles: ['qb', 'ol', 'ol', 'ol', 'ol', 'ol', 'wr', 'wr', 'wr', 'wr', 'wr'],
        spots: [
          [back * 5.5, 50],
          ...olLine(dir, back * 0.2),
          [back * 1.0, 12],
          [back * 0.8, 20],
          [back * 0.8, 80],
          [back * 1.0, 88],
          [back * 0.6, 30],
        ],
      };
    case 'goalLine':
      return {
        roles: ['qb', 'ol', 'ol', 'ol', 'ol', 'ol', 'te', 'te', 'fb', 'rb', 'wr'],
        spots: [
          [back * 2.0, 50],
          ...olLine(dir, back * 0.15),
          [back * 0.3, 26],
          [back * 0.3, 74],
          [back * 4.2, 46],
          [back * 5.8, 54],
          [back * 0.8, 16],
        ],
      };
    case 'kick':
      return {
        roles: ['k', 'h', 'ol', 'ol', 'ol', 'ol', 'ol', 'ol', 'ol', 'ol', 'ol'],
        spots: [
          [back * 8.0, 50],
          [back * 6.2, 50],
          [back * 0.2, 26],
          [back * 0.2, 34],
          [back * 0.2, 42],
          [back * 0.2, 50],
          [back * 0.2, 58],
          [back * 0.2, 66],
          [back * 0.2, 74],
          [back * 2.5, 38],
          [back * 2.5, 62],
        ],
      };
    case 'punt':
      return {
        roles: ['p', 'ol', 'ol', 'ol', 'ol', 'ol', 'ol', 'ol', 'ol', 'g', 'g'],
        spots: [
          [back * 7.5, 50],
          [back * 0.2, 26],
          [back * 0.2, 34],
          [back * 0.2, 42],
          [back * 0.2, 50],
          [back * 0.2, 58],
          [back * 0.2, 66],
          [back * 0.2, 74],
          [back * 2.0, 30],
          [back * 2.0, 70],
          [back * 3.5, 50],
        ],
      };
    case 'kickoff':
      return {
        roles: ['k', 'st', 'st', 'st', 'st', 'st', 'st', 'st', 'st', 'st', 'st'],
        spots: [
          [back * 2.0, 50],
          [0, 18],
          [0, 26],
          [0, 34],
          [0, 42],
          [0, 58],
          [0, 66],
          [0, 74],
          [0, 82],
          [back * 1.0, 40],
          [back * 1.0, 60],
        ],
      };
    default:
      return preSnapOffense('singleback', dir);
  }
}

/**
 * Develop the play from pre-snap: QB throw, RB run, routes, kick.
 * Pass routes are scaled to the actual throw depth so a receiver is
 * always at the catch point when the ball arrives.
 */
function playSpots(
  formation: FormationId,
  kind: PlayKind | 'idle',
  dir: 1 | -1,
  yards: number,
  seed: number,
): { offense: Spot[]; defense: Spot[]; roles: string[]; qb: Spot; target: Spot; handoff: Spot } {
  const pre = preSnapOffense(formation, dir);
  const offense = pre.spots.map((s) => [...s] as Spot);
  const roles = [...pre.roles];
  let defense = defenseBase(dir, kind === 'pass' || kind === 'sack' ? 'nickel' : 'odd');

  const qbIdx = roles.findIndex((r) => r === 'qb' || r === 'k' || r === 'p');
  const rbIdx = roles.findIndex((r) => r === 'rb' || r === 'fb');
  const wrIdxs = roles
    .map((r, i) => (r === 'wr' || r === 'te' ? i : -1))
    .filter((i) => i >= 0);

  let qb: Spot = offense[qbIdx >= 0 ? qbIdx : 0] ?? [-dir * 3, 50];
  let target: Spot = [dir * 8, 40];
  let handoff: Spot = qb;

  if (kind === 'pass' || kind === 'sack') {
    const drop = kind === 'sack' ? 3.2 : 5.2;
    qb = [-dir * drop, 48 + (seed % 5)];
    if (qbIdx >= 0) offense[qbIdx] = qb;

    const depth = Math.max(6, Math.abs(yards) || 12);
    const catchY = [18, 26, 74, 50, 84, 22, 78][seed % 7]!;
    const catchIdx = wrIdxs.length ? wrIdxs[seed % wrIdxs.length]! : -1;

    // Primary receiver runs TO the catch depth (fixes empty deep balls)
    if (catchIdx >= 0) {
      offense[catchIdx] = [dir * depth, catchY];
      target = offense[catchIdx]!;
    } else {
      target = [dir * depth, catchY];
    }

    // Other receivers run complementary routes at varied depths
    wrIdxs.forEach((idx, i) => {
      if (idx === catchIdx) return;
      const altDepth = clamp(depth * (0.35 + (i % 3) * 0.2), 5, Math.max(8, depth - 3));
      const altY = catchY < 50 ? 70 + (i % 3) * 6 : 18 + (i % 3) * 6;
      offense[idx] = [dir * altDepth, clamp(altY, 12, 88)];
    });

    if (rbIdx >= 0 && roles[rbIdx] === 'rb') {
      offense[rbIdx] = [-dir * 2.2, 62];
    }

    if (kind === 'sack') {
      target = qb;
      defense[1] = [qb[0] + dir * 0.8, qb[1]];
    } else {
      // Coverage trails the throw
      defense = defense.map((s, i) => {
        if (i >= 8) {
          return [
            dir * (depth - 2 + (i - 8) * 1.5),
            clamp(catchY + (i === 8 ? -6 : i === 9 ? 0 : 6), 14, 86),
          ];
        }
        if (i >= 5) return [s[0] + dir * (depth * 0.35), s[1]];
        return [s[0] + dir * 1.4, s[1]];
      }) as Spot[];
    }
  } else if (kind === 'run') {
    const laneY = [42, 48, 54, 38, 58][seed % 5]!;
    const gain = Math.max(2, Math.abs(yards) || 4);
    handoff = [-dir * 1.2, laneY];
    qb = [-dir * 2.0, 50];
    if (qbIdx >= 0) offense[qbIdx] = qb;
    for (let i = 1; i <= 5; i++) {
      if (offense[i]) offense[i] = [dir * 1.8, offense[i]![1]];
    }
    target = [dir * gain, laneY];
    if (rbIdx >= 0) offense[rbIdx] = target;
    wrIdxs.forEach((idx, i) => {
      offense[idx] = [dir * (2.5 + i * 1.2), offense[idx]![1] < 50 ? 18 : 82];
    });
    defense = defense.map((s, i) =>
      i < 4
        ? [s[0] - dir * 0.6, clamp(laneY + (i - 1.5) * 5, 20, 80)]
        : [s[0] + dir * Math.min(gain * 0.6, 6), s[1]],
    ) as Spot[];
  } else if (kind === 'fieldGoal' || kind === 'extraPoint') {
    qb = [-dir * 8.0, 50];
    handoff = [-dir * 6.2, 50];
    target = [dir * 40, 50];
    if (qbIdx >= 0) offense[qbIdx] = qb;
    const hIdx = roles.findIndex((r) => r === 'h');
    if (hIdx >= 0) offense[hIdx] = handoff;
  } else if (kind === 'punt' || kind === 'kickoff') {
    qb = offense[0] ?? [-dir * 7, 50];
    target = [dir * Math.max(20, Math.abs(yards) || 40), 50];
    handoff = qb;
  } else {
    target = [0, 50];
    handoff = qb;
  }

  return { offense, defense, roles, qb, target, handoff };
}

function formationMarkers(live: LiveGameState, fx: FieldFx): Marker[] {
  const los = yardToLeft(fx.kind === 'idle' ? live.ballOn : fx.los);
  const dir = fx.dir;
  const developed = fx.kind !== 'idle';
  const yards = developed ? Math.abs(fx.to - fx.from) : 0;

  const pack = developed
    ? playSpots(fx.formation, fx.kind, dir, Math.max(yards, 6), fx.key)
    : (() => {
        const pre = preSnapOffense(fx.formation, dir);
        return {
          offense: pre.spots,
          defense: defenseBase(dir, fx.formation === 'shotgun' || fx.formation === 'empty' ? 'nickel' : 'odd'),
          roles: pre.roles,
          qb: pre.spots[0]!,
          target: pre.spots[0]!,
          handoff: pre.spots[0]!,
        };
      })();

  const clampX = (x: number) => clamp(x, 2, 98);
  const markers: Marker[] = [];
  pack.offense.forEach(([dx, y], i) => {
    const role = pack.roles[i];
    const isTarget =
      developed &&
      fx.kind === 'pass' &&
      (role === 'wr' || role === 'te') &&
      Math.abs(los + dx - yardToLeft(fx.to)) < 1.5;
    markers.push({
      id: `o${i}`,
      kind: 'O',
      x: clampX(los + dx),
      y,
      role: isTarget ? 'target' : role,
    });
  });
  pack.defense.forEach(([dx, y], i) => {
    markers.push({
      id: `x${i}`,
      kind: 'X',
      x: clampX(los + dx),
      y,
      role: 'def',
    });
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

function ballClass(kind: PlayKind | 'idle', made: boolean, deep: boolean): string {
  if (kind === 'pass') return deep ? 'fly-pass-deep' : 'fly-pass';
  if (kind === 'fieldGoal' || kind === 'extraPoint') return made ? 'fly-kick-good' : 'fly-kick-miss';
  if (kind === 'punt' || kind === 'kickoff') return 'fly-punt';
  if (kind === 'run') return 'fly-run';
  if (kind === 'sack') return 'fly-sack';
  return 'fly-idle';
}

function playDurationMs(kind: PlayKind | 'idle', yards: number, deep: boolean): number {
  if (kind === 'idle') return 900;
  if (kind === 'pass') return deep ? 4200 : 3400;
  if (kind === 'run') return Math.abs(yards) > 12 ? 3800 : 3200;
  if (kind === 'fieldGoal' || kind === 'extraPoint') return 3600;
  if (kind === 'punt' || kind === 'kickoff') return 3800;
  if (kind === 'sack') return 2800;
  return 3000;
}

function buildFx(
  prev: LiveGameState,
  next: LiveGameState,
  key: number,
): FieldFx {
  const from = prev.ballOn;
  const los = prev.ballOn;
  const firstDown = firstDownYard(prev);
  const dir: 1 | -1 = prev.possession === 'home' ? 1 : -1;
  const kind = next.lastPlay?.kind ?? 'idle';
  const made = Boolean(next.lastPlay?.scoreKind === 'fg' || next.lastPlay?.scoreKind === 'xp');
  const formation = pickFormation(prev, kind, key + prev.down * 3 + prev.distance);
  const yards = next.lastPlay?.yards ?? 0;
  const incomplete = kind === 'pass' && Math.abs(yards) < 1 && !next.lastPlay?.turnover;
  const throwDepth =
    kind === 'pass'
      ? incomplete
        ? 10 + (key % 10)
        : Math.max(6, Math.abs(yards))
      : Math.abs(yards);
  const deep = kind === 'pass' && throwDepth >= 18;

  const pack = playSpots(formation, kind, dir, kind === 'pass' ? throwDepth : yards, key);
  const losPitch = yardToPitch(los);

  let ballFromX = losPitch;
  let ballFromY = 50;
  let ballToX = yardToPitch(next.ballOn);
  let ballToY = 50;
  let handoffX = losPitch;
  let handoffY = 50;

  if (kind === 'pass') {
    ballFromX = yardToPitch(clamp(los + pack.qb[0], 0, 100));
    ballFromY = pack.qb[1];
    // Ball meets the receiver at the same spot players run to
    const catchYard = clamp(los + dir * throwDepth, 0, 100);
    ballToX = yardToPitch(catchYard);
    ballToY = pack.target[1];
    handoffX = ballFromX;
    handoffY = ballFromY;
  } else if (kind === 'run') {
    ballFromX = yardToPitch(clamp(los + pack.qb[0], 0, 100));
    ballFromY = pack.qb[1];
    handoffX = yardToPitch(clamp(los + pack.handoff[0], 0, 100));
    handoffY = pack.handoff[1];
    ballToX = yardToPitch(next.ballOn);
    ballToY = pack.target[1];
  } else if (kind === 'fieldGoal' || kind === 'extraPoint') {
    ballFromX = yardToPitch(clamp(los + pack.handoff[0], 0, 100));
    ballFromY = 50;
    handoffX = ballFromX;
    handoffY = 50;
    if (dir === 1) {
      ballToX = made ? 102.5 : 96;
      ballToY = made ? 28 : 12;
    } else {
      ballToX = made ? -2.5 : 4;
      ballToY = made ? 28 : 12;
    }
  } else if (kind === 'punt' || kind === 'kickoff') {
    ballFromX = yardToPitch(clamp(los + pack.qb[0], 0, 100));
    ballFromY = 50;
    ballToX = yardToPitch(next.ballOn);
    ballToY = 42 + (key % 10);
    handoffX = ballFromX;
    handoffY = ballFromY;
  } else if (kind === 'sack') {
    ballFromX = yardToPitch(clamp(los + pack.qb[0], 0, 100));
    ballFromY = pack.qb[1];
    ballToX = ballFromX;
    ballToY = ballFromY;
    handoffX = ballFromX;
    handoffY = ballFromY;
  }

  return {
    key,
    kind,
    from,
    to: kind === 'pass' ? clamp(los + dir * throwDepth, 0, 100) : next.ballOn,
    los,
    firstDown,
    dir,
    formation,
    ballFromX,
    ballFromY,
    ballToX,
    ballToY,
    handoffX,
    handoffY,
    made,
    offenseSide: prev.possession,
    durationMs: playDurationMs(kind, yards, deep),
    deep,
  };
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
    formation: 'shotgun',
    ballFromX: yardToPitch(25),
    ballFromY: 50,
    ballToX: yardToPitch(25),
    ballToY: 50,
    handoffX: yardToPitch(25),
    handoffY: 50,
    made: false,
    offenseSide: 'home',
    durationMs: 900,
    deep: false,
  }));

  const home = state.teams.find((t) => t.id === live?.homeId);
  const away = state.teams.find((t) => t.id === live?.awayId);

  const applyStep = (prev: LiveGameState): LiveGameState => {
    const next = structuredClone(prev);
    stepPlay(state, next);
    fxKey.current += 1;
    setFx(buildFx(prev, next, fxKey.current));
    setPulse((p) => p + 1);
    return next;
  };

  // Watch mode: wait for each play to finish before snapping the next
  useEffect(() => {
    if (!watching) return;
    const delay = fx.kind === 'idle' ? 700 : fx.durationMs;
    const id = window.setTimeout(() => {
      setLive((prev) => {
        if (!prev || prev.phase === 'final') {
          setWatching(false);
          return prev;
        }
        const next = applyStep(prev);
        if (next.phase === 'final') setWatching(false);
        return next;
      });
    }, delay);
    return () => window.clearTimeout(id);
    // Only re-arm when a new play starts (or watch toggles) — not on settle-to-idle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watching, fx.key, state]);

  // Settle back to idle markers after the play animation finishes
  useEffect(() => {
    if (!live || fx.kind === 'idle') return;
    const settleAt = Math.max(2200, fx.durationMs - 900);
    const t = window.setTimeout(() => {
      const formation = pickFormation(live, 'idle', fx.key + 11);
      setFx((prev) => ({
        ...prev,
        kind: 'idle',
        from: live.ballOn,
        to: live.ballOn,
        los: live.ballOn,
        firstDown: firstDownYard(live),
        dir: live.possession === 'home' ? 1 : -1,
        formation,
        ballFromX: yardToPitch(live.ballOn),
        ballFromY: 50,
        ballToX: yardToPitch(live.ballOn),
        ballToY: 50,
        handoffX: yardToPitch(live.ballOn),
        handoffY: 50,
        made: false,
        offenseSide: live.possession,
        durationMs: 900,
        deep: false,
      }));
    }, settleAt);
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
      const formation = pickFormation(next, 'idle', fxKey.current + 3);
      setFx({
        key: ++fxKey.current,
        kind: 'idle',
        from: next.ballOn,
        to: next.ballOn,
        los: next.ballOn,
        firstDown: firstDownYard(next),
        dir: next.possession === 'home' ? 1 : -1,
        formation,
        ballFromX: yardToPitch(next.ballOn),
        ballFromY: 50,
        ballToX: yardToPitch(next.ballOn),
        ballToY: 50,
        handoffX: yardToPitch(next.ballOn),
        handoffY: 50,
        made: false,
        offenseSide: next.possession,
        durationMs: 900,
        deep: false,
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

  const offenseTeam = fx.offenseSide === 'home' ? home : away;
  const defenseTeam = fx.offenseSide === 'home' ? away : home;

  const ballStyle = {
    '--ball-from': `${fx.ballFromX}%`,
    '--ball-to': `${fx.ballToX}%`,
    '--ball-from-y': `${fx.ballFromY}%`,
    '--ball-to-y': `${fx.ballToY}%`,
    '--ball-hand-x': `${fx.handoffX}%`,
    '--ball-hand-y': `${fx.handoffY}%`,
  } as CSSProperties;

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
          '--off-primary': offenseTeam.primary,
          '--def-primary': defenseTeam.primary,
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
          {fx.kind === 'idle' ? ` · ${fx.formation}` : ''}
        </span>
      </header>

      <div
        className={`gameday-field ${pulse % 2 === 0 ? 'pulse-a' : 'pulse-b'}`}
        aria-label="Football field"
      >
        <div className="gameday-field-shell">
          <GoalPosts side="left" />

          <div className="gameday-pitch">
            <div className="gameday-endzone left">
              <span className="gameday-ez-word">{home.name}</span>
              <TeamLogo team={home} size={36} />
            </div>

            <div className="gameday-grid">
              <div className="gameday-turf" aria-hidden />
              <div className="gameday-yardlines" aria-hidden />
              <div className="gameday-hash-row top" aria-hidden />
              <div className="gameday-hash-row bottom" aria-hidden />
              <div className="gameday-goal-line left" aria-hidden />
              <div className="gameday-goal-line right" aria-hidden />

              {YARD_NUMBERS.map((row) => (
                <div
                  key={`yn-${row.at}`}
                  className="gameday-yardnum"
                  style={{ left: `${row.at}%` }}
                  data-n={row.n}
                  aria-hidden
                />
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
                  className={`gameday-marker kind-${m.kind}${m.role === 'rb' && fx.kind === 'run' ? ' is-carrier' : ''}${m.role === 'qb' && (fx.kind === 'pass' || fx.kind === 'sack') ? ' is-qb' : ''}${m.role === 'target' ? ' is-target' : ''}${m.role === 'wr' || m.role === 'te' || m.role === 'target' ? ' role-skill' : ''}${m.role === 'ol' || m.role === 'h' ? ' role-line' : ''}`}
                  style={{ left: `${m.x}%`, top: `${m.y}%` }}
                  data-role={m.role}
                >
                  {m.kind}
                </span>
              ))}
            </div>

            <div className="gameday-endzone right">
              <span className="gameday-ez-word">{away.name}</span>
              <TeamLogo team={away} size={36} />
            </div>

            <div
              key={`ball-${fx.key}-${fx.kind}`}
              className={`gameday-ball ${ballClass(fx.kind, fx.made, fx.deep)}`}
              style={ballStyle}
              aria-hidden
            >
              <FootballIcon />
            </div>
          </div>

          <GoalPosts side="right" />
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
