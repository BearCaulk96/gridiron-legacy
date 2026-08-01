import { applyDevelopment, autoPickUntilUser } from './draft';
import { buildSchedule, createLeague, generateDraftClass, playerName } from './generate';
import { createRng, randInt, shuffle } from './rng';
import { getDifficulty } from './difficulty';
import { teamPower, positionalNeed } from './ratings';
import {
  freeAgents,
  maxAllowedCap,
  refreshTeamCapHits,
  suggestedContract,
  teamCapHit,
  teamCapSpace,
} from './salary';
import { describeGame, simulateWeek } from './simulation';
import type { Difficulty, LeagueState, Team } from './types';

export function startNewGame(userTeamId: string, difficulty: Difficulty): LeagueState {
  return createLeague(userTeamId, difficulty);
}

export function beginSeason(state: LeagueState): void {
  state.week = 1;
  state.phase = 'regular';
  state.messages.unshift(`Season ${state.season} Week 1 kicks off.`);
}

export function advanceWeek(state: LeagueState): void {
  if (state.phase !== 'regular') return;
  const games = simulateWeek(state);
  const userGame = games.find(
    (g) => g.homeId === state.userTeamId || g.awayId === state.userTeamId,
  );
  if (userGame) {
    state.messages.unshift(`Week ${state.week}: ${describeGame(state, userGame)}`);
  }

  if (state.week >= 17) {
    finishRegularSeason(state);
  } else {
    state.week += 1;
  }
}

function standingsSort(a: Team, b: Team): number {
  const pct = (t: Team) => (t.wins + t.ties * 0.5) / Math.max(1, t.wins + t.losses + t.ties);
  return pct(b) - pct(a) || b.pointsFor - a.pointsFor;
}

function simMatch(state: LeagueState, a: string, b: string, rng: () => number): string {
  const pa = teamPower(state, a) + rng() * 6;
  const pb = teamPower(state, b) + rng() * 6;
  return pa >= pb ? a : b;
}

function simBracket(state: LeagueState, ids: string[], rng: () => number): string {
  let round = [...ids];
  while (round.length > 1) {
    const next: string[] = [];
    for (let i = 0; i < round.length; i += 2) {
      next.push(simMatch(state, round[i]!, round[i + 1]!, rng));
    }
    round = next;
  }
  return round[0]!;
}

function finishRegularSeason(state: LeagueState): void {
  state.phase = 'playoffs';
  const east = state.teams
    .filter((t) => t.conference === 'East')
    .sort(standingsSort)
    .slice(0, 4);
  const west = state.teams
    .filter((t) => t.conference === 'West')
    .sort(standingsSort)
    .slice(0, 4);

  const rng = createRng(state.season * 17 + 99);
  const eastChamp = simBracket(
    state,
    east.map((t) => t.id),
    rng,
  );
  const westChamp = simBracket(
    state,
    west.map((t) => t.id),
    rng,
  );
  const championId = simMatch(state, eastChamp, westChamp, rng);
  const champ = state.teams.find((t) => t.id === championId)!;
  state.messages.unshift(`${champ.city} ${champ.name} win the Gridiron Cup!`);
  if (championId === state.userTeamId) {
    state.messages.unshift('Dynasty moment: you are champions.');
  }
  state.phase = 'offseason';
  state.messages.unshift('Offseason begins — develop talent, then draft your future.');
}

export function enterDraft(state: LeagueState): void {
  if (state.phase !== 'offseason' && state.phase !== 'draft') return;
  applyDevelopment(state);

  for (const c of Object.values(state.coaches)) {
    c.contractYears -= 1;
    if (c.contractYears <= 0) {
      c.contractYears = randInt(createRng(hash(c.id) + state.season), 2, 4);
    }
  }

  const existingProspects = Object.values(state.players).filter((p) => p.isProspect && !p.teamId);
  for (const p of existingProspects) {
    delete state.players[p.id];
  }
  const rng = createRng(state.season * 1337);
  const cls = generateDraftClass(rng, state.season);
  const cfg = getDifficulty(state.difficulty);
  cls
    .sort((a, b) => b.potential - a.potential)
    .slice(0, cfg.freeScoutedProspects)
    .forEach((p) => {
      p.scouted = true;
    });
  for (const p of cls) state.players[p.id] = p;

  state.phase = 'draft';
  state.scoutingPoints =
    state.difficulty === 'veteran' ? 6 : state.difficulty === 'pro' ? 10 : state.difficulty === 'rookie' ? 18 : 40;
  state.messages.unshift(`The ${state.season} Gridiron Draft is open.`);
  autoPickUntilUser(state);
}

export function completeOffseasonToNextSeason(state: LeagueState): void {
  for (const t of state.teams) {
    t.wins = 0;
    t.losses = 0;
    t.ties = 0;
    t.pointsFor = 0;
    t.pointsAgainst = 0;
    const futureYear = state.season + 2;
    for (let round = 1; round <= 7; round++) {
      const exists = t.draftPicks.some(
        (pk) => pk.year === futureYear && pk.round === round && pk.originalTeamId === t.id,
      );
      if (!exists) {
        t.draftPicks.push({
          year: futureYear,
          round,
          originalTeamId: t.id,
          ownerTeamId: t.id,
        });
      }
    }
  }

  state.season += 1;
  state.week = 0;
  state.phase = 'preseason';
  const rng = createRng(state.season * 9001);
  state.schedule = buildSchedule(state, rng);
  refreshTeamCapHits(state);
  state.messages.unshift(`Training camp ${state.season} is underway.`);
}

export function signFreeAgent(state: LeagueState, playerId: string, years = 2): string | null {
  const player = state.players[playerId];
  if (!player || player.teamId || player.isProspect) return 'Player unavailable.';

  const contract = suggestedContract(player.overall, player.age, years);
  const projected = teamCapHit(state, state.userTeamId) + contract.annualSalary;
  if (projected > maxAllowedCap(state)) {
    return 'Signing would exceed the salary cap for this difficulty.';
  }

  player.teamId = state.userTeamId;
  player.contract = { ...contract, yearsRemaining: years };
  player.morale = Math.min(99, player.morale + 8);
  refreshTeamCapHits(state);
  state.messages.unshift(
    `Signed ${playerName(player)} for ${years} yr / $${(contract.annualSalary / 1e6).toFixed(1)}M.`,
  );
  return null;
}

export function releasePlayer(state: LeagueState, playerId: string): string | null {
  const player = state.players[playerId];
  if (!player || player.teamId !== state.userTeamId) return 'Not on your roster.';
  const name = playerName(player);
  player.teamId = null;
  player.contract = null;
  refreshTeamCapHits(state);
  state.messages.unshift(`Released ${name}.`);
  return null;
}

export function aiSignFreeAgents(state: LeagueState): void {
  const rng = createRng(state.season * 42 + 7);
  const agents = freeAgents(state).filter((p) => p.overall >= 70);
  const teams = shuffle(
    rng,
    state.teams.filter((t) => t.id !== state.userTeamId),
  );

  for (const team of teams) {
    if (teamCapSpace(state, team.id) < 2_000_000) continue;
    const needs = positionalNeed(state, team.id);
    const target = agents.find((p) => {
      if (p.teamId) return false;
      if (!needs.slice(0, 4).includes(p.position)) return false;
      const sal = suggestedContract(p.overall, p.age).annualSalary;
      return teamCapHit(state, team.id) + sal <= maxAllowedCap(state);
    });
    if (!target) continue;
    const c = suggestedContract(target.overall, target.age, 2);
    target.teamId = team.id;
    target.contract = { ...c, yearsRemaining: 2 };
  }
  refreshTeamCapHits(state);
}

export function hireCoachHint(state: LeagueState): string {
  const team = state.teams.find((t) => t.id === state.userTeamId)!;
  const coaches = team.coachIds.map((id) => state.coaches[id]!);
  const hc = coaches.find((c) => c.role === 'HC');
  const cfg = getDifficulty(state.difficulty);
  if (!hc) return 'Hire a head coach to stabilize the locker room.';
  if (cfg.schemeMatter < 0.3) {
    return `${hc.name} runs a ${hc.scheme} system — scheme fit is soft on this difficulty.`;
  }
  return `${hc.name} (${hc.scheme}) — match OC/DC schemes for bigger in-game bonuses.`;
}

export function userTeam(state: LeagueState) {
  return state.teams.find((t) => t.id === state.userTeamId)!;
}

export function standings(state: LeagueState) {
  return [...state.teams].sort(standingsSort);
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}
