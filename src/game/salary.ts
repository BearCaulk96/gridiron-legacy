import type { LeagueState, Player, Position, Team } from './types';
import { getDifficulty } from './difficulty';

/** League salary cap used on Pro / Veteran. Casual & Rookie are uncapped. */
export const BASE_SALARY_CAP = 300_000_000;

/** Active roster limit (NFL-style 53-man). */
export const ROSTER_LIMIT = 53;

/** Soft offseason/camp ceiling so FA + draft can add before Cut to 53. */
export const OFFSEASON_ROSTER_LIMIT = 90;

/** Approximate NFL veteran minimum. */
export const VETERAN_MINIMUM = 1_125_000;

export function playerCapHit(player: Player): number {
  if (!player.contract) return 0;
  const bonus = player.contract.signingBonus ?? 0;
  const years = Math.max(1, player.contract.years);
  return player.contract.annualSalary + Math.round(bonus / years);
}

export function teamCapHit(state: LeagueState, teamId: string): number {
  const players = Object.values(state.players).filter((p) => p.teamId === teamId);
  const playerHit = players.reduce((sum, p) => sum + playerCapHit(p), 0);
  const coaches = Object.values(state.coaches).filter((c) => c.teamId === teamId);
  const coachHit = coaches.reduce((sum, c) => sum + c.salary, 0);
  return playerHit + coachHit;
}

export function maxAllowedCap(state: LeagueState): number {
  const cfg = getDifficulty(state.difficulty);
  if (cfg.uncapped) return Number.MAX_SAFE_INTEGER;
  return Math.floor(state.salaryCap * cfg.capSoftPercent);
}

export function teamCapSpace(state: LeagueState, teamId: string): number {
  const max = maxAllowedCap(state);
  if (!Number.isFinite(max) || max > 1e15) return 1e15;
  return max - teamCapHit(state, teamId);
}

export function isOverCap(state: LeagueState, teamId: string): boolean {
  const cfg = getDifficulty(state.difficulty);
  if (cfg.uncapped) return false;
  return teamCapHit(state, teamId) > maxAllowedCap(state);
}

export function rosterCount(state: LeagueState, teamId: string): number {
  return Object.values(state.players).filter((p) => p.teamId === teamId && !p.isProspect).length;
}

export function rosterOpenings(
  state: LeagueState,
  teamId: string,
  limit: number = OFFSEASON_ROSTER_LIMIT,
): number {
  return Math.max(0, limit - rosterCount(state, teamId));
}

export function refreshTeamCapHits(state: LeagueState): void {
  for (const team of state.teams) {
    team.capHit = teamCapHit(state, team.id);
  }
}

/**
 * NFL-like veteran AAV from overall + age.
 * Elite QBs/WRs can clear $40M+; role players sit near the minimum.
 */
export function suggestedContract(
  overall: number,
  age: number,
  years = 3,
  position?: Position,
): {
  years: number;
  annualSalary: number;
  signingBonus: number;
  guaranteed: number;
} {
  let annual: number;
  if (overall >= 95) annual = 48_000_000;
  else if (overall >= 92) annual = 38_000_000;
  else if (overall >= 90) annual = 30_000_000;
  else if (overall >= 87) annual = 22_000_000;
  else if (overall >= 84) annual = 16_000_000;
  else if (overall >= 80) annual = 11_000_000;
  else if (overall >= 76) annual = 7_000_000;
  else if (overall >= 72) annual = 4_250_000;
  else if (overall >= 68) annual = 2_750_000;
  else if (overall >= 64) annual = 1_850_000;
  else annual = VETERAN_MINIMUM;

  // Position market premiums (NFL-ish)
  if (position === 'QB' && overall >= 80) annual = Math.round(annual * 1.2);
  else if (position === 'WR' && overall >= 85) annual = Math.round(annual * 1.08);
  else if ((position === 'OL' || position === 'DL') && overall >= 85) annual = Math.round(annual * 1.05);
  else if (position === 'K' || position === 'P') annual = Math.min(annual, 6_000_000);

  if (age >= 32) annual = Math.round(annual * 0.82);
  else if (age >= 30) annual = Math.round(annual * 0.9);
  else if (age <= 24) annual = Math.round(annual * 0.92);

  annual = Math.round(annual / 50_000) * 50_000;
  annual = Math.max(VETERAN_MINIMUM, annual);

  const signingBonus = Math.round((annual * years * (overall >= 85 ? 0.18 : 0.12)) / 50_000) * 50_000;

  return {
    years,
    annualSalary: annual,
    signingBonus,
    guaranteed: Math.round(annual * years * (overall >= 85 ? 0.55 : 0.35) + signingBonus),
  };
}

/**
 * NFL-style rookie scale AAV by overall draft pick (1–224) and round.
 * 1st overall >> mid-round >> undrafted-adjacent 7th round.
 */
export function rookieScaleContract(
  overallPick: number,
  round: number,
  position: Position,
): {
  years: number;
  annualSalary: number;
  signingBonus: number;
  guaranteed: number;
} {
  const years = 4;
  let aav: number;

  if (overallPick === 1) aav = 12_700_000;
  else if (overallPick <= 3) aav = 11_000_000 - (overallPick - 2) * 900_000;
  else if (overallPick <= 5) aav = 8_800_000 - (overallPick - 4) * 700_000;
  else if (overallPick <= 10) aav = 7_200_000 - (overallPick - 6) * 450_000;
  else if (overallPick <= 16) aav = 4_800_000 - (overallPick - 11) * 180_000;
  else if (overallPick <= 32) aav = 3_400_000 - (overallPick - 17) * 70_000;
  else if (round === 2) aav = 2_100_000 - Math.max(0, overallPick - 33) * 28_000;
  else if (round === 3) aav = 1_450_000 - Math.max(0, overallPick - 65) * 12_000;
  else if (round === 4) aav = 1_250_000 - Math.max(0, overallPick - 97) * 6_000;
  else if (round === 5) aav = 1_150_000;
  else if (round === 6) aav = 1_100_000;
  else aav = 1_050_000;

  if (position === 'QB' && overallPick <= 40) aav = Math.round(aav * 1.12);
  if (position === 'K' || position === 'P') aav = Math.min(aav, 1_200_000);

  aav = Math.round(Math.max(VETERAN_MINIMUM * 0.9, aav) / 25_000) * 25_000;
  const signingBonus = Math.round((aav * years * (round === 1 ? 0.35 : round <= 3 ? 0.2 : 0.08)) / 25_000) * 25_000;

  return {
    years,
    annualSalary: aav,
    signingBonus,
    guaranteed: Math.round(aav * years * (round === 1 ? 0.75 : round <= 3 ? 0.5 : 0.25) + signingBonus),
  };
}

export function formatMoney(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1_000_000_000) return 'Uncapped';
  if (abs >= 1_000_000) return `${n < 0 ? '-' : ''}$${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${n < 0 ? '-' : ''}$${Math.round(abs / 1_000)}K`;
  return `$${n}`;
}

export function formatCapSpace(state: LeagueState, teamId: string): string {
  const cfg = getDifficulty(state.difficulty);
  if (cfg.uncapped) return 'Uncapped';
  return formatMoney(teamCapSpace(state, teamId));
}

export function rosterPlayers(state: LeagueState, teamId: string): Player[] {
  return Object.values(state.players)
    .filter((p) => p.teamId === teamId)
    .sort((a, b) => b.overall - a.overall);
}

export function freeAgents(state: LeagueState): Player[] {
  return Object.values(state.players)
    .filter((p) => p.teamId === null && !p.isProspect)
    .sort((a, b) => b.overall - a.overall);
}

export function updateTeamCap(team: Team, state: LeagueState): void {
  team.capHit = teamCapHit(state, team.id);
}
