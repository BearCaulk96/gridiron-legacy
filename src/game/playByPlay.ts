import { createRng, clamp, pick, randInt } from './rng';
import { teamPower } from './ratings';
import type { Coach, GameResult, LeagueState } from './types';

export type Side = 'home' | 'away';

export interface TeamBoxScore {
  passYards: number;
  rushYards: number;
  passTd: number;
  rushTd: number;
  turnovers: number;
  firstDowns: number;
  completions: number;
  attempts: number;
  rushes: number;
  sacks: number;
  ints: number;
}

export type PlayKind =
  | 'run'
  | 'pass'
  | 'sack'
  | 'punt'
  | 'fieldGoal'
  | 'kickoff'
  | 'extraPoint'
  | 'kneel';

export interface PlayEvent {
  kind: PlayKind;
  text: string;
  yards: number;
  turnover: boolean;
  scoreKind: 'td' | 'fg' | 'safety' | 'xp' | null;
  clockRun: number;
}

export interface LiveGameState {
  gameId: string;
  homeId: string;
  awayId: string;
  quarter: number;
  clock: number; // seconds remaining in quarter
  homeScore: number;
  awayScore: number;
  possession: Side;
  /** Yards from home end zone (0–100). */
  ballOn: number;
  down: number;
  distance: number;
  homeStats: TeamBoxScore;
  awayStats: TeamBoxScore;
  lastPlay: PlayEvent | null;
  log: string[];
  phase: 'kickoff' | 'playing' | 'halftime' | 'final';
  homeScheme: Coach['scheme'];
  awayScheme: Coach['scheme'];
  waitingAfterScore: boolean;
  seed: number;
  playCount: number;
}

function emptyBox(): TeamBoxScore {
  return {
    passYards: 0,
    rushYards: 0,
    passTd: 0,
    rushTd: 0,
    turnovers: 0,
    firstDowns: 0,
    completions: 0,
    attempts: 0,
    rushes: 0,
    sacks: 0,
    ints: 0,
  };
}

function schemeOf(state: LeagueState, teamId: string, role: 'OC' | 'DC' | 'HC'): Coach['scheme'] {
  const team = state.teams.find((t) => t.id === teamId)!;
  const coaches = team.coachIds.map((id) => state.coaches[id]).filter(Boolean) as Coach[];
  return (
    coaches.find((c) => c.role === role)?.scheme ??
    coaches.find((c) => c.role === 'HC')?.scheme ??
    'balanced'
  );
}

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function formatClock(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, '0')}`;
}

/** Ball location label from absolute yard line + possession. */
export function ballSpotLabel(
  state: LiveGameState,
  homeAbbrev: string,
  awayAbbrev: string,
): string {
  const on = Math.round(clamp(state.ballOn, 0, 100));
  if (on <= 0) return `${homeAbbrev} GL`;
  if (on >= 100) return `${awayAbbrev} GL`;
  if (on === 50) return '50';
  if (on < 50) return `${homeAbbrev} ${on}`;
  return `${awayAbbrev} ${100 - on}`;
}

export function yardsToEndzone(state: LiveGameState): number {
  return state.possession === 'home' ? 100 - state.ballOn : state.ballOn;
}

export function createLiveGame(state: LeagueState, game: GameResult): LiveGameState {
  const seed = hashString(`${game.id}:live:${state.season}`);
  return {
    gameId: game.id,
    homeId: game.homeId,
    awayId: game.awayId,
    quarter: 1,
    clock: 15 * 60,
    homeScore: 0,
    awayScore: 0,
    possession: 'away', // kickoff receive by away typically
    ballOn: 25,
    down: 1,
    distance: 10,
    homeStats: emptyBox(),
    awayStats: emptyBox(),
    lastPlay: null,
    log: ['Kickoff — away team receives.'],
    phase: 'kickoff',
    homeScheme: schemeOf(state, game.homeId, 'OC'),
    awayScheme: schemeOf(state, game.awayId, 'OC'),
    waitingAfterScore: false,
    seed,
    playCount: 0,
  };
}

function offenseScheme(live: LiveGameState): Coach['scheme'] {
  return live.possession === 'home' ? live.homeScheme : live.awayScheme;
}

function offenseBox(live: LiveGameState): TeamBoxScore {
  return live.possession === 'home' ? live.homeStats : live.awayStats;
}

function defenseBox(live: LiveGameState): TeamBoxScore {
  return live.possession === 'home' ? live.awayStats : live.homeStats;
}

function runBias(scheme: Coach['scheme']): number {
  switch (scheme) {
    case 'power':
      return 0.62;
    case 'spread':
      return 0.32;
    case 'blitz':
      return 0.38;
    case 'cover':
      return 0.55;
    default:
      return 0.48;
  }
}

function powerEdge(state: LeagueState, live: LiveGameState): number {
  const offId = live.possession === 'home' ? live.homeId : live.awayId;
  const defId = live.possession === 'home' ? live.awayId : live.homeId;
  const edge = teamPower(state, offId) - teamPower(state, defId) + (live.possession === 'home' ? 1.5 : 0);
  return edge / 40; // small modifier
}

function advanceBall(live: LiveGameState, yards: number): void {
  if (live.possession === 'home') live.ballOn = clamp(live.ballOn + yards, 0, 100);
  else live.ballOn = clamp(live.ballOn - yards, 0, 100);
}

function flipPossession(live: LiveGameState): void {
  live.possession = live.possession === 'home' ? 'away' : 'home';
  live.down = 1;
  live.distance = 10;
}

function markFirstDown(live: LiveGameState, gained: number): void {
  if (gained >= live.distance) {
    offenseBox(live).firstDowns += 1;
    live.down = 1;
    live.distance = Math.min(10, yardsToEndzone(live));
  } else {
    live.down += 1;
    live.distance -= gained;
  }
}

function scoreTd(live: LiveGameState): void {
  if (live.possession === 'home') live.homeScore += 6;
  else live.awayScore += 6;
  live.waitingAfterScore = true;
}

function doKickoff(live: LiveGameState, rng: () => number): PlayEvent {
  // Receiver already set; place at ~25 with return variance
  const ret = randInt(rng, 18, 38);
  live.ballOn = live.possession === 'home' ? ret : 100 - ret;
  live.down = 1;
  live.distance = 10;
  live.phase = 'playing';
  live.clock = Math.max(0, live.clock - randInt(rng, 4, 8));
  return {
    kind: 'kickoff',
    text: `Kickoff returned to the ${Math.round(live.possession === 'home' ? live.ballOn : 100 - live.ballOn)}.`,
    yards: ret,
    turnover: false,
    scoreKind: null,
    clockRun: 6,
  };
}

function doExtraPoint(live: LiveGameState, rng: () => number): PlayEvent {
  const good = rng() < 0.94;
  if (good) {
    if (live.possession === 'home') live.homeScore += 1;
    else live.awayScore += 1;
  }
  // Kickoff to other team
  flipPossession(live);
  live.waitingAfterScore = false;
  live.phase = 'kickoff';
  live.clock = Math.max(0, live.clock - 3);
  return {
    kind: 'extraPoint',
    text: good ? 'Extra point is good.' : 'Extra point is NO good.',
    yards: 0,
    turnover: false,
    scoreKind: good ? 'xp' : null,
    clockRun: 3,
  };
}

function choosePlay(live: LiveGameState, rng: () => number, edge: number): PlayEvent {
  const toGoal = yardsToEndzone(live);
  const scheme = offenseScheme(live);
  const box = offenseBox(live);
  const dbox = defenseBox(live);

  // End of half kneel
  if (live.clock < 20 && live.down === 1 && toGoal > 40 && rng() < 0.7) {
    live.clock = 0;
    return {
      kind: 'kneel',
      text: 'Kneel down — clock expires.',
      yards: -1,
      turnover: false,
      scoreKind: null,
      clockRun: 20,
    };
  }

  // 4th down decisions
  if (live.down >= 4) {
    if (toGoal <= 38 && rng() < 0.78) {
      // FG
      const chance = clamp(0.92 - toGoal * 0.012 + edge * 0.05, 0.45, 0.95);
      const good = rng() < chance;
      live.clock = Math.max(0, live.clock - randInt(rng, 4, 7));
      if (good) {
        if (live.possession === 'home') live.homeScore += 3;
        else live.awayScore += 3;
        flipPossession(live);
        live.phase = 'kickoff';
        return {
          kind: 'fieldGoal',
          text: `${30 + toGoal}-yard field goal is GOOD.`,
          yards: 0,
          turnover: false,
          scoreKind: 'fg',
          clockRun: 5,
        };
      }
      // Miss — other team at spot (~LOS)
      flipPossession(live);
      return {
        kind: 'fieldGoal',
        text: 'Field goal is NO good.',
        yards: 0,
        turnover: false,
        scoreKind: null,
        clockRun: 5,
      };
    }
    // Punt
    const punt = randInt(rng, 38, 52);
    const hang = randInt(rng, 0, 8);
    advanceBall(live, punt - hang);
    // clamp inside 5
    if (live.possession === 'home' && live.ballOn > 95) live.ballOn = 95;
    if (live.possession === 'away' && live.ballOn < 5) live.ballOn = 5;
    flipPossession(live);
    live.clock = Math.max(0, live.clock - randInt(rng, 5, 9));
    return {
      kind: 'punt',
      text: `Punt — ${punt} yards.`,
      yards: punt,
      turnover: false,
      scoreKind: null,
      clockRun: 7,
    };
  }

  const wantRun = rng() < runBias(scheme) + (toGoal < 5 ? 0.15 : 0);
  const clockRun = randInt(rng, 18, 42);

  if (!wantRun) {
    // Pass
    box.attempts += 1;
    const sackChance = clamp(0.08 - edge * 0.04 + (scheme === 'spread' ? -0.02 : 0.01), 0.03, 0.16);
    if (rng() < sackChance) {
      const loss = randInt(rng, 4, 9);
      advanceBall(live, -loss);
      box.passYards -= loss;
      dbox.sacks += 1;
      markFirstDown(live, -loss);
      live.clock = Math.max(0, live.clock - randInt(rng, 5, 9));
      if (live.down > 4) {
        flipPossession(live);
        return {
          kind: 'sack',
          text: `Sacked for a loss of ${loss}. Turnover on downs.`,
          yards: -loss,
          turnover: true,
          scoreKind: null,
          clockRun: 7,
        };
      }
      return {
        kind: 'sack',
        text: `Sacked for a loss of ${loss}.`,
        yards: -loss,
        turnover: false,
        scoreKind: null,
        clockRun: 7,
      };
    }

    const complete = rng() < clamp(0.58 + edge * 0.12 + (scheme === 'spread' ? 0.04 : 0), 0.4, 0.78);
    if (!complete) {
      const intChance = clamp(0.04 - edge * 0.02, 0.015, 0.08);
      live.clock = Math.max(0, live.clock - randInt(rng, 4, 8));
      if (rng() < intChance) {
        dbox.ints += 1;
        box.turnovers += 1;
        flipPossession(live);
        // return spot near mid of previous
        live.ballOn = clamp(live.ballOn + (live.possession === 'home' ? -5 : 5), 10, 90);
        return {
          kind: 'pass',
          text: 'INTERCEPTION!',
          yards: 0,
          turnover: true,
          scoreKind: null,
          clockRun: 6,
        };
      }
      live.down += 1;
      if (live.down > 4) {
        flipPossession(live);
        return {
          kind: 'pass',
          text: 'Incomplete. Turnover on downs.',
          yards: 0,
          turnover: true,
          scoreKind: null,
          clockRun: 5,
        };
      }
      return {
        kind: 'pass',
        text: 'Incomplete pass.',
        yards: 0,
        turnover: false,
        scoreKind: null,
        clockRun: 5,
      };
    }

    const deep = scheme === 'spread' ? rng() < 0.28 : rng() < 0.16;
    let gained = deep ? randInt(rng, 14, 38) : randInt(rng, 4, 16);
    gained = Math.round(gained * (1 + edge * 0.15));
    if (gained >= toGoal) {
      box.completions += 1;
      box.passYards += toGoal;
      box.passTd += 1;
      advanceBall(live, toGoal);
      scoreTd(live);
      live.clock = Math.max(0, live.clock - clockRun);
      return {
        kind: 'pass',
        text: deep ? 'Deep ball — TOUCHDOWN!' : 'Touchdown pass!',
        yards: toGoal,
        turnover: false,
        scoreKind: 'td',
        clockRun,
      };
    }
    box.completions += 1;
    box.passYards += gained;
    advanceBall(live, gained);
    markFirstDown(live, gained);
    live.clock = Math.max(0, live.clock - clockRun);
    if (live.down > 4) {
      flipPossession(live);
      return {
        kind: 'pass',
        text: `Pass for ${gained}. Turnover on downs.`,
        yards: gained,
        turnover: true,
        scoreKind: null,
        clockRun,
      };
    }
    const names = ['slant', 'out', 'curl', 'seam', 'screen', 'cross'];
    return {
      kind: 'pass',
      text: `${deep ? 'Deep' : 'Short'} ${pick(rng, names)} — gain of ${gained}.`,
      yards: gained,
      turnover: false,
      scoreKind: null,
      clockRun,
    };
  }

  // Run
  box.rushes += 1;
  const big = scheme === 'power' && rng() < 0.12;
  let gained = big ? randInt(rng, 10, 28) : randInt(rng, -2, 9);
  if (rng() < 0.08) gained = randInt(rng, 12, 22);
  gained = Math.round(gained + edge * 3);
  // fumble
  if (rng() < 0.025) {
    box.turnovers += 1;
    flipPossession(live);
    live.clock = Math.max(0, live.clock - randInt(rng, 5, 9));
    return {
      kind: 'run',
      text: 'FUMBLE — defense recovers!',
      yards: 0,
      turnover: true,
      scoreKind: null,
      clockRun: 7,
    };
  }
  if (gained >= toGoal) {
    box.rushYards += toGoal;
    box.rushTd += 1;
    advanceBall(live, toGoal);
    scoreTd(live);
    live.clock = Math.max(0, live.clock - clockRun);
    return {
      kind: 'run',
      text: 'Touchdown run!',
      yards: toGoal,
      turnover: false,
      scoreKind: 'td',
      clockRun,
    };
  }
  box.rushYards += Math.max(0, gained);
  advanceBall(live, gained);
  markFirstDown(live, gained);
  live.clock = Math.max(0, live.clock - clockRun);
  if (live.down > 4) {
    flipPossession(live);
    return {
      kind: 'run',
      text: `Run for ${gained}. Turnover on downs.`,
      yards: gained,
      turnover: true,
      scoreKind: null,
      clockRun,
    };
  }
  const lanes = ['left', 'middle', 'right', 'off tackle', 'draw'];
  return {
    kind: 'run',
    text: `Run ${pick(rng, lanes)} — ${gained >= 0 ? `gain of ${gained}` : `loss of ${-gained}`}.`,
    yards: gained,
    turnover: false,
    scoreKind: null,
    clockRun,
  };
}

function handleQuarterEnd(live: LiveGameState): void {
  if (live.clock > 0) return;
  if (live.quarter === 2) {
    live.phase = 'halftime';
    live.quarter = 3;
    live.clock = 15 * 60;
    // Second half kickoff — trailing or home receives simply: home receives
    live.possession = 'home';
    live.log.unshift('Halftime.');
    live.phase = 'kickoff';
    return;
  }
  if (live.quarter >= 4) {
    live.phase = 'final';
    live.log.unshift('Final.');
    return;
  }
  live.quarter += 1;
  live.clock = 15 * 60;
  live.log.unshift(`End of quarter — Q${live.quarter} begins.`);
}

/** Advance one snap. Returns the play event. */
export function stepPlay(league: LeagueState, live: LiveGameState): PlayEvent {
  if (live.phase === 'final') {
    return {
      kind: 'kneel',
      text: 'Game over.',
      yards: 0,
      turnover: false,
      scoreKind: null,
      clockRun: 0,
    };
  }

  live.playCount += 1;
  const rng = createRng(live.seed + live.playCount * 9973);
  const edge = powerEdge(league, live);

  let play: PlayEvent;
  if (live.phase === 'kickoff' || (live.waitingAfterScore && live.lastPlay?.scoreKind === 'td')) {
    if (live.waitingAfterScore && live.lastPlay?.scoreKind === 'td') {
      play = doExtraPoint(live, rng);
    } else {
      play = doKickoff(live, rng);
    }
  } else if (live.waitingAfterScore) {
    play = doExtraPoint(live, rng);
  } else {
    play = choosePlay(live, rng, edge);
  }

  live.lastPlay = play;
  live.log.unshift(play.text);
  if (live.log.length > 40) live.log.length = 40;

  handleQuarterEnd(live);

  // Safety check rare
  if (live.phase === 'playing' && (live.ballOn <= 0 || live.ballOn >= 100) && !live.waitingAfterScore) {
    // Ball in endzone without TD flag — treat as touchback / already scored handled
    if (live.ballOn <= 0) live.ballOn = 1;
    if (live.ballOn >= 100) live.ballOn = 99;
  }

  return play;
}

export function stepUntilQuarterChange(league: LeagueState, live: LiveGameState): void {
  const q = live.quarter;
  let guard = 0;
  while (guard++ < 400) {
    if (live.phase === 'final' || live.quarter !== q) return;
    const beforeClock = live.clock;
    stepPlay(league, live);
    // if stuck with clock not moving
    if (live.clock === beforeClock && live.phase === 'playing') {
      live.clock = Math.max(0, live.clock - 1);
    }
  }
}

export function stepUntilFinal(league: LeagueState, live: LiveGameState): void {
  let guard = 0;
  while (live.phase !== 'final' && guard++ < 1200) {
    stepPlay(league, live);
  }
  live.phase = 'final';
}

export function totalYards(box: TeamBoxScore): number {
  return box.passYards + box.rushYards;
}
