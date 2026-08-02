import type { LeagueState, Player, Team } from './types';
import { getDifficulty } from './difficulty';

export const BASE_SALARY_CAP = 255_000_000;

export function playerCapHit(player: Player): number {
  if (!player.contract) return 0;
  return player.contract.annualSalary;
}

export function teamCapHit(state: LeagueState, teamId: string): number {
  const players = Object.values(state.players).filter((p) => p.teamId === teamId);
  const playerHit = players.reduce((sum, p) => sum + playerCapHit(p), 0);
  const coaches = Object.values(state.coaches).filter((c) => c.teamId === teamId);
  const coachHit = coaches.reduce((sum, c) => sum + c.salary, 0);
  return playerHit + coachHit;
}

export function teamCapSpace(state: LeagueState, teamId: string): number {
  return state.salaryCap - teamCapHit(state, teamId);
}

export function maxAllowedCap(state: LeagueState): number {
  const cfg = getDifficulty(state.difficulty);
  return Math.floor(state.salaryCap * cfg.capSoftPercent);
}

export function isOverCap(state: LeagueState, teamId: string): boolean {
  return teamCapHit(state, teamId) > maxAllowedCap(state);
}

export function refreshTeamCapHits(state: LeagueState): void {
  for (const team of state.teams) {
    team.capHit = teamCapHit(state, team.id);
  }
}

export function suggestedContract(overall: number, age: number, years = 3): {
  years: number;
  annualSalary: number;
  guaranteed: number;
} {
  const base = 700_000 + Math.pow(Math.max(0, overall - 55), 2.15) * 18_000;
  const ageFactor = age >= 30 ? 0.85 : age <= 23 ? 0.7 : 1;
  const annual = Math.round((base * ageFactor) / 50_000) * 50_000;
  return {
    years,
    annualSalary: Math.max(750_000, annual),
    guaranteed: Math.round(annual * years * 0.35),
  };
}

export function formatMoney(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `${n < 0 ? '-' : ''}$${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${n < 0 ? '-' : ''}$${Math.round(abs / 1_000)}K`;
  return `$${n}`;
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
