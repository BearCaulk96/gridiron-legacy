import type { Coach, LeagueState, Player, Position, Team } from './types';
import { getDifficulty } from './difficulty';
import { rosterPlayers } from './salary';

const OFFENSE_POS: Position[] = ['QB', 'RB', 'WR', 'TE', 'OL'];
const DEFENSE_POS: Position[] = ['DL', 'LB', 'CB', 'S'];

function topAverage(players: Player[], n: number): number {
  if (players.length === 0) return 60;
  const top = [...players].sort((a, b) => b.overall - a.overall).slice(0, n);
  return top.reduce((s, p) => s + effectiveOverall(p), 0) / top.length;
}

export function effectiveOverall(player: Player): number {
  if (player.injuryWeeks > 0) return Math.max(40, player.overall - 25);
  return player.overall + (player.morale - 70) * 0.08;
}

export function teamSideRatings(state: LeagueState, team: Team): {
  offense: number;
  defense: number;
  special: number;
  chemistry: number;
} {
  const roster = rosterPlayers(state, team.id).filter((p) => p.injuryWeeks === 0);
  const offense = topAverage(
    roster.filter((p) => OFFENSE_POS.includes(p.position)),
    11,
  );
  const defense = topAverage(
    roster.filter((p) => DEFENSE_POS.includes(p.position)),
    11,
  );
  const special = topAverage(
    roster.filter((p) => p.position === 'K' || p.position === 'P'),
    2,
  );
  const chemistry =
    roster.reduce((s, p) => s + p.morale, 0) / Math.max(1, roster.length);

  return { offense, defense, special, chemistry };
}

export function coachBonus(state: LeagueState, team: Team): {
  offense: number;
  defense: number;
  scheme: number;
} {
  const coaches = team.coachIds
    .map((id) => state.coaches[id])
    .filter(Boolean) as Coach[];
  const hc = coaches.find((c) => c.role === 'HC');
  const oc = coaches.find((c) => c.role === 'OC');
  const dc = coaches.find((c) => c.role === 'DC');
  const cfg = getDifficulty(state.difficulty);

  const offense = ((oc?.offense ?? 70) + (hc?.offense ?? 70)) / 2 / 20;
  const defense = ((dc?.defense ?? 70) + (hc?.defense ?? 70)) / 2 / 20;

  // Scheme synergy: matching OC/DC philosophies with HC
  let scheme = 0;
  if (hc && oc && (hc.scheme === oc.scheme || hc.scheme === 'balanced' || oc.scheme === 'balanced')) {
    scheme += 2 * cfg.schemeMatter;
  }
  if (hc && dc && (hc.scheme === dc.scheme || hc.scheme === 'balanced' || dc.scheme === 'cover' || dc.scheme === 'blitz')) {
    scheme += 1.5 * cfg.schemeMatter;
  }

  return { offense, defense, scheme };
}

export function teamPower(state: LeagueState, teamId: string): number {
  const team = state.teams.find((t) => t.id === teamId)!;
  const sides = teamSideRatings(state, team);
  const coaches = coachBonus(state, team);
  let power =
    sides.offense * 0.42 +
    sides.defense * 0.42 +
    sides.special * 0.08 +
    sides.chemistry * 0.08 +
    coaches.offense +
    coaches.defense +
    coaches.scheme;

  if (teamId === state.userTeamId) {
    power += getDifficulty(state.difficulty).simUserBoost;
  }
  return power;
}

export function positionalNeed(state: LeagueState, teamId: string): Position[] {
  const roster = rosterPlayers(state, teamId);
  const byPos = new Map<Position, number>();
  for (const p of roster) {
    const best = byPos.get(p.position) ?? 0;
    byPos.set(p.position, Math.max(best, p.overall));
  }
  const positions: Position[] = ['QB', 'RB', 'WR', 'TE', 'OL', 'DL', 'LB', 'CB', 'S', 'K', 'P'];
  return positions
    .map((pos) => ({ pos, ovr: byPos.get(pos) ?? 50 }))
    .sort((a, b) => a.ovr - b.ovr)
    .map((x) => x.pos);
}
