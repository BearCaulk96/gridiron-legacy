import type { LeagueState, Player, Position } from './types';
import { positionalNeed } from './ratings';
import { suggestedContract } from './salary';

export type Progression =
  | 'SUPERSTAR'
  | 'PURE TALENT'
  | 'ATHLETE'
  | 'DEVELOPING'
  | 'VETERAN'
  | 'COMMON';

export type Interest = 1 | 2 | 3;

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function progressionOf(p: Player): Progression {
  const gap = p.potential - p.overall;
  if (p.age >= 31) return 'VETERAN';
  if (gap >= 14 && p.potential >= 90) return 'SUPERSTAR';
  if (gap >= 10) return 'PURE TALENT';
  if (gap >= 6 || p.speed >= 90) return 'ATHLETE';
  if (gap >= 3) return 'DEVELOPING';
  return 'COMMON';
}

export function interestInTeam(state: LeagueState, p: Player): Interest {
  const needs = positionalNeed(state, state.userTeamId);
  const needRank = needs.indexOf(p.position);
  const team = state.teams.find((t) => t.id === state.userTeamId)!;
  const winPct = (team.wins + team.ties * 0.5) / Math.max(1, team.wins + team.losses + team.ties);
  let score = 0;
  if (needRank >= 0 && needRank < 3) score += 2;
  else if (needRank < 6) score += 1;
  if (winPct >= 0.55 || team.wins >= 10) score += 1;
  if (p.morale >= 55) score += 1;
  if (p.overall >= 88) score -= 1; // stars are choosier
  if (score >= 3) return 3;
  if (score <= 0) return 1;
  return 2;
}

/** Scheme / roster fit 0–100 for the user team. */
export function schemeFit(state: LeagueState, p: Player): number {
  const needs = positionalNeed(state, state.userTeamId);
  const needRank = needs.indexOf(p.position);
  const needScore = needRank < 0 ? 40 : Math.max(25, 100 - needRank * 12);
  const team = state.teams.find((t) => t.id === state.userTeamId)!;
  const coaches = team.coachIds.map((id) => state.coaches[id]).filter(Boolean);
  const scheme = coaches.find((c) => c?.role === 'OC')?.scheme ?? coaches[0]?.scheme ?? 'balanced';
  let schemeBonus = 0;
  if (scheme === 'spread' && (p.position === 'WR' || p.position === 'QB' || p.speed >= 88)) schemeBonus = 12;
  if (scheme === 'power' && (p.position === 'RB' || p.position === 'OL' || p.strength >= 88)) schemeBonus = 12;
  if (scheme === 'blitz' && (p.position === 'DL' || p.position === 'LB')) schemeBonus = 12;
  if (scheme === 'cover' && (p.position === 'CB' || p.position === 'S')) schemeBonus = 12;
  if (scheme === 'balanced') schemeBonus = 6;
  const agePen = p.age >= 32 ? 10 : 0;
  return Math.max(8, Math.min(100, needScore + schemeBonus - agePen));
}

export function contractDemand(p: Player) {
  const years = p.overall >= 88 ? 4 : p.overall >= 80 ? 3 : p.age >= 30 ? 2 : 3;
  const c = suggestedContract(p.overall, p.age, years, p.position);
  const signingBonus = c.signingBonus;
  return {
    years,
    annualSalary: c.annualSalary,
    signingBonus,
    totalValue: c.annualSalary * years + signingBonus,
  };
}

export function playerBio(p: Player) {
  const h = hash(p.id);
  const colleges = [
    'Ohio State',
    'Alabama',
    'Michigan',
    'Georgia',
    'USC',
    'Texas',
    'LSU',
    'Penn State',
    'Oregon',
    'Florida',
    'Notre Dame',
    'Clemson',
  ];
  const heightIn =
    p.position === 'OL' || p.position === 'DL'
      ? 74 + (h % 6)
      : p.position === 'QB' || p.position === 'TE'
        ? 73 + (h % 5)
        : 68 + (h % 7);
  const feet = Math.floor(heightIn / 12);
  const inches = heightIn % 12;
  const weight =
    p.position === 'OL' || p.position === 'DL'
      ? 290 + (h % 40)
      : p.position === 'RB'
        ? 200 + (h % 25)
        : p.position === 'WR' || p.position === 'CB'
          ? 185 + (h % 30)
          : 220 + (h % 35);
  return {
    height: `${feet}'${inches}"`,
    weight,
    college: colleges[h % colleges.length]!,
    exp: Math.max(0, p.seasonsPlayed || Math.max(0, p.age - 22)),
  };
}

export interface DisplayAttr {
  key: string;
  label: string;
  value: number;
}

/** Position-flavored attribute rows built from core ratings. */
export function displayAttributes(p: Player): DisplayAttr[] {
  const clamp = (n: number) => Math.max(40, Math.min(99, Math.round(n)));
  const h = (hash(p.id) % 7) - 3;
  switch (p.position) {
    case 'QB':
      return [
        { key: 'throw', label: 'Throw Power', value: clamp(p.strength + 8 + h) },
        { key: 'acc', label: 'Accuracy', value: clamp(p.awareness + 4) },
        { key: 'aware', label: 'Awareness', value: p.awareness },
        { key: 'spd', label: 'Speed', value: p.speed },
        { key: 'str', label: 'Strength', value: p.strength },
        { key: 'dur', label: 'Durability', value: p.durability },
      ];
    case 'WR':
    case 'TE':
      return [
        { key: 'spd', label: 'Speed', value: p.speed },
        { key: 'cth', label: 'Catching', value: clamp(p.awareness + 5 + h) },
        { key: 'rte', label: 'Route Running', value: clamp(p.awareness + h) },
        { key: 'spc', label: 'Spectacular Catch', value: clamp(p.speed * 0.4 + p.awareness * 0.6) },
        { key: 'str', label: 'Strength', value: p.strength },
        { key: 'aware', label: 'Awareness', value: p.awareness },
        { key: 'dur', label: 'Durability', value: p.durability },
      ];
    case 'RB':
      return [
        { key: 'spd', label: 'Speed', value: p.speed },
        { key: 'el', label: 'Elusiveness', value: clamp(p.speed * 0.6 + p.awareness * 0.4) },
        { key: 'str', label: 'Strength', value: p.strength },
        { key: 'aware', label: 'Awareness', value: p.awareness },
        { key: 'cth', label: 'Catching', value: clamp(p.awareness - 4) },
        { key: 'dur', label: 'Durability', value: p.durability },
      ];
    case 'CB':
    case 'S':
      return [
        { key: 'spd', label: 'Speed', value: p.speed },
        { key: 'cov', label: 'Coverage', value: clamp(p.awareness + 3) },
        { key: 'tack', label: 'Tackling', value: clamp(p.strength + 2) },
        { key: 'aware', label: 'Awareness', value: p.awareness },
        { key: 'str', label: 'Strength', value: p.strength },
        { key: 'dur', label: 'Durability', value: p.durability },
      ];
    default:
      return [
        { key: 'spd', label: 'Speed', value: p.speed },
        { key: 'str', label: 'Strength', value: p.strength },
        { key: 'aware', label: 'Awareness', value: p.awareness },
        { key: 'dur', label: 'Durability', value: p.durability },
      ];
  }
}

export function interestLabel(level: Interest): string {
  if (level === 3) return 'HE IS VERY INTERESTED IN JOINING YOUR TEAM';
  if (level === 2) return 'HE IS OPEN TO DISCUSSING A DEAL';
  return 'HE HAS LOW INTEREST IN YOUR FRANCHISE';
}

export function interestMotivations(state: LeagueState, p: Player, level: Interest): string[] {
  const needs = positionalNeed(state, state.userTeamId);
  const list: string[] = [];
  if (needs[0] === p.position) list.push('Playing Time');
  else list.push('Winning');
  list.push(level >= 3 ? 'Coaching Staff' : 'Scheme Fit');
  list.push(p.age <= 26 ? 'Development' : 'Guaranteed Money');
  return list.slice(0, 3);
}

export const FA_POSITION_TABS: Array<{ id: Position | 'ALL' | 'DB'; label: string }> = [
  { id: 'ALL', label: 'ALL' },
  { id: 'QB', label: 'QB' },
  { id: 'RB', label: 'RB' },
  { id: 'WR', label: 'WR' },
  { id: 'TE', label: 'TE' },
  { id: 'OL', label: 'OL' },
  { id: 'DL', label: 'DL' },
  { id: 'LB', label: 'LB' },
  { id: 'DB', label: 'DB' },
  { id: 'K', label: 'K' },
  { id: 'P', label: 'P' },
];

export function matchesPositionTab(p: Player, tab: Position | 'ALL' | 'DB'): boolean {
  if (tab === 'ALL') return true;
  if (tab === 'DB') return p.position === 'CB' || p.position === 'S';
  return p.position === tab;
}

export function ovrTone(ovr: number): 'elite' | 'good' | 'avg' | 'low' {
  if (ovr >= 88) return 'elite';
  if (ovr >= 78) return 'good';
  if (ovr >= 68) return 'avg';
  return 'low';
}

export function fitTone(fit: number): 'high' | 'mid' | 'low' {
  if (fit >= 70) return 'high';
  if (fit >= 45) return 'mid';
  return 'low';
}
