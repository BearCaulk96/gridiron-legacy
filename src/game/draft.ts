import { getDifficulty } from './difficulty';
import { createRng, clamp } from './rng';
import { positionalNeed } from './ratings';
import { suggestedContract } from './salary';
import type { DifficultyConfig, LeagueState, Player } from './types';
import { playerName } from './generate';

export function prospects(state: LeagueState): Player[] {
  return Object.values(state.players)
    .filter((p) => p.isProspect && p.teamId === null)
    .sort((a, b) => draftBoardScore(state, b) - draftBoardScore(state, a));
}

export function draftBoardScore(state: LeagueState, p: Player): number {
  const cfg = getDifficulty(state.difficulty);
  if (p.scouted || cfg.draftFog === 0) {
    return p.potential * 0.55 + p.overall * 0.45;
  }
  // Fog: noisy ranking
  const noise = ((hash(p.id) % 100) / 100 - 0.5) * 20 * cfg.draftFog;
  return p.overall + noise;
}

export function prospectGrade(state: LeagueState, p: Player): string {
  const score = draftBoardScore(state, p);
  if (score >= 88) return 'A+';
  if (score >= 84) return 'A';
  if (score >= 80) return 'A-';
  if (score >= 76) return 'B+';
  if (score >= 72) return 'B';
  if (score >= 68) return 'B-';
  if (score >= 64) return 'C+';
  if (score >= 60) return 'C';
  return 'C-';
}

export function visibleOverall(state: LeagueState, p: Player): number | null {
  const cfg = getDifficulty(state.difficulty);
  if (!p.isProspect) return p.overall;
  if (cfg.showProspectOverall || p.scouted) return p.overall;
  return null;
}

export function visiblePotential(state: LeagueState, p: Player): number | null {
  const cfg = getDifficulty(state.difficulty);
  if (!p.isProspect) return p.potential;
  if (cfg.showProspectPotential || p.scouted) return p.potential;
  return null;
}

export function scoutPlayer(state: LeagueState, playerId: string): boolean {
  const p = state.players[playerId];
  if (!p || !p.isProspect || p.scouted) return false;
  if (state.scoutingPoints <= 0) return false;
  state.scoutingPoints -= 1;
  p.scouted = true;
  state.messages.unshift(`Scouted ${playerName(p)} — clearer read on traits.`);
  return true;
}

export function userDraftPicksThisYear(state: LeagueState) {
  return state.teams
    .find((t) => t.id === state.userTeamId)!
    .draftPicks.filter((pk) => pk.year === state.season && pk.ownerTeamId === state.userTeamId)
    .sort((a, b) => a.round - b.round);
}

/** How many picks have been made in the current league year's draft. */
export function picksMadeThisDraft(state: LeagueState): number {
  const orderLen = 32 * 7;
  const tagged = Object.values(state.players).filter(
    (p) => p.draftYear === state.season && p.draftRound != null && p.teamId !== null,
  ).length;
  if (tagged > 0) return tagged;

  // Legacy saves: players drafted before draftYear existed.
  const legacy = Object.values(state.players).filter(
    (p) => p.draftRound != null && p.draftPick != null && p.teamId !== null && p.draftYear == null,
  ).length;
  const undrafted = prospects(state).length;
  // Prior-year rookies look like "taken" picks — ignore them when a fresh class is on the board.
  if (legacy >= orderLen && undrafted > 0) return 0;
  return legacy;
}

/** Returns current pick owner for sequential draft, or null if draft complete. */
export function currentDraftPick(state: LeagueState): {
  round: number;
  pickInRound: number;
  overall: number;
  teamId: string;
} | null {
  const order = draftOrder(state);
  const taken = picksMadeThisDraft(state);
  if (taken >= order.length) return null;
  const slot = order[taken]!;
  return {
    round: slot.round,
    pickInRound: slot.pickInRound,
    overall: taken + 1,
    teamId: slot.teamId,
  };
}

/** True while draft week still has picks remaining. */
export function isDraftInProgress(state: LeagueState): boolean {
  return currentDraftPick(state) != null;
}

export function draftOrder(state: LeagueState): { teamId: string; round: number; pickInRound: number }[] {
  // Inverse standings order (worst picks first), then snake-ish fixed for simplicity: reverse each even round
  const standings = [...state.teams].sort((a, b) => {
    const pct = (t: typeof a) => (t.wins + t.ties * 0.5) / Math.max(1, t.wins + t.losses + t.ties);
    return pct(a) - pct(b) || a.pointsFor - b.pointsFor;
  });

  const order: { teamId: string; round: number; pickInRound: number }[] = [];
  for (let round = 1; round <= 7; round++) {
    const row = round % 2 === 0 ? [...standings].reverse() : standings;
    row.forEach((team, idx) => {
      // Respect traded picks: find who owns this team's original pick for this round/year
      const ownerPick = state.teams
        .flatMap((t) => t.draftPicks)
        .find(
          (pk) =>
            pk.year === state.season &&
            pk.round === round &&
            pk.originalTeamId === team.id,
        );
      const owner = ownerPick?.ownerTeamId ?? team.id;
      order.push({ teamId: owner, round, pickInRound: idx + 1 });
    });
  }
  return order;
}

export function draftPlayer(state: LeagueState, playerId: string, teamId: string): boolean {
  const pick = currentDraftPick(state);
  if (!pick || pick.teamId !== teamId) return false;
  const player = state.players[playerId];
  if (!player || !player.isProspect || player.teamId) return false;

  player.teamId = teamId;
  player.isProspect = false;
  player.scouted = true;
  player.draftRound = pick.round;
  player.draftPick = pick.overall;
  player.draftYear = state.season;
  const years = pick.round <= 2 ? 4 : 3;
  const c = suggestedContract(Math.min(player.overall, 78), player.age, years);
  // Rookie scale discount
  c.annualSalary = Math.round(c.annualSalary * (0.35 + (7 - pick.round) * 0.06));
  player.contract = { ...c, yearsRemaining: years };

  // Consume the pick from owner's inventory for this year/round/original
  // Find original team for this slot via standings order
  const team = state.teams.find((t) => t.id === teamId)!;
  const idx = team.draftPicks.findIndex(
    (pk) => pk.year === state.season && pk.round === pick.round && pk.ownerTeamId === teamId,
  );
  if (idx >= 0) team.draftPicks.splice(idx, 1);

  if (teamId === state.userTeamId) {
    state.messages.unshift(
      `Drafted ${playerName(player)} (${player.position}) at pick ${pick.overall}.`,
    );
  }
  return true;
}

export function aiDraftPick(state: LeagueState, teamId: string): Player | null {
  const cfg = getDifficulty(state.difficulty);
  const needs = positionalNeed(state, teamId);
  const board = prospects(state);
  if (board.length === 0) return null;

  const scored = board.map((p) => {
    const needIdx = needs.indexOf(p.position);
    const needBonus = needIdx >= 0 ? (11 - Math.min(needIdx, 10)) * 1.8 : 0;
    const value = draftBoardScore(state, p) + needBonus + aiPersonalityNoise(cfg, p.id);
    return { p, value };
  });
  scored.sort((a, b) => b.value - a.value);
  return scored[0]!.p;
}

function aiPersonalityNoise(cfg: DifficultyConfig, id: string): number {
  return ((hash(id) % 100) / 100 - 0.5) * 6 * cfg.aiTradeStrictness;
}

export function autoPickUntilUser(state: LeagueState): void {
  while (true) {
    const pick = currentDraftPick(state);
    if (!pick) {
      state.phase = 'draft';
      state.messages.unshift('The draft is complete. Continue to Draft Recap.');
      return;
    }
    if (pick.teamId === state.userTeamId) return;
    const choice = aiDraftPick(state, pick.teamId);
    if (!choice) return;
    draftPlayer(state, choice.id, pick.teamId);
  }
}

export function runFullAiDraft(state: LeagueState): void {
  while (currentDraftPick(state)) {
    const pick = currentDraftPick(state)!;
    if (pick.teamId === state.userTeamId) {
      const choice = aiDraftPick(state, pick.teamId);
      if (!choice) break;
      draftPlayer(state, choice.id, pick.teamId);
    } else {
      const choice = aiDraftPick(state, pick.teamId);
      if (!choice) break;
      draftPlayer(state, choice.id, pick.teamId);
    }
  }
  state.phase = 'draft';
  state.messages.unshift('The draft is complete. Continue to Draft Recap.');
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function revealBoardHint(cfg: DifficultyConfig): string {
  if (cfg.id === 'casual') return 'Full ratings and potential are visible.';
  if (cfg.id === 'rookie') return 'Grades and potential shown; overall hidden until scouted.';
  if (cfg.id === 'pro') return 'Scout wisely — only a handful of prospects are fully known.';
  return 'Heavy fog. Scouting points are scarce. Busts and booms decide dynasties.';
}

export function applyDevelopment(state: LeagueState): void {
  const cfg = getDifficulty(state.difficulty);
  const rng = createRng(state.season * 997 + 13);
  for (const p of Object.values(state.players)) {
    if (!p.teamId || p.isProspect) continue;
    const coaches = state.teams.find((t) => t.id === p.teamId)?.coachIds ?? [];
    const dev =
      coaches
        .map((id) => state.coaches[id]?.development ?? 70)
        .reduce((a, b) => a + b, 0) / Math.max(1, coaches.length);

    let delta = 0;
    if (p.age <= 25 && p.overall < p.potential) {
      delta = (0.4 + rng() * 1.4) * cfg.developmentBonus * (dev / 75);
    } else if (p.age >= 30) {
      delta = -0.4 - rng() * 1.2;
    } else if (p.overall < p.potential && rng() > 0.5) {
      delta = 0.3 * cfg.developmentBonus;
    }
    p.overall = clamp(Math.round(p.overall + delta), 40, 99);
    p.age += 1;
    p.seasonsPlayed += 1;
    if (p.contract) {
      p.contract.yearsRemaining -= 1;
      if (p.contract.yearsRemaining <= 0) {
        p.teamId = null;
        p.contract = null;
        p.morale = clamp(p.morale - 5, 35, 99);
      }
    }
    // reset season stats
    p.stats = {
      games: 0,
      passYards: 0,
      passTd: 0,
      rushYards: 0,
      rushTd: 0,
      recYards: 0,
      recTd: 0,
      tackles: 0,
      sacks: 0,
      ints: 0,
    };
    p.injuryWeeks = 0;
  }
}
