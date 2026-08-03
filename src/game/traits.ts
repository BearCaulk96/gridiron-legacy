import type { Player, Position } from './types';
import { clamp } from './rng';

/** Position traits that drive overall and are revealed by scouting (A–F). */
export const POSITION_TRAITS: Record<Position, readonly string[]> = {
  QB: ['Arm', 'Accuracy', 'Awareness', 'Mobility'],
  RB: ['Speed', 'Power', 'Vision', 'Receiving'],
  WR: ['Speed', 'Hands', 'Routes', 'Separation'],
  TE: ['Hands', 'Blocking', 'Routes', 'Strength'],
  OL: ['Strength', 'Footwork', 'Awareness', 'Pass Block'],
  DL: ['Power', 'Burst', 'Hands', 'Awareness'],
  LB: ['Speed', 'Coverage', 'Tackling', 'Awareness'],
  CB: ['Speed', 'Coverage', 'Ball Skills', 'Awareness'],
  S: ['Range', 'Tackling', 'Coverage', 'Awareness'],
  K: ['Power', 'Accuracy', 'Clutch', 'Consistency'],
  P: ['Power', 'Accuracy', 'Hang Time', 'Consistency'],
};

export type LetterGrade = 'A' | 'B' | 'C' | 'D' | 'F';

export function ratingToGrade(value: number): LetterGrade {
  if (value >= 88) return 'A';
  if (value >= 78) return 'B';
  if (value >= 68) return 'C';
  if (value >= 58) return 'D';
  return 'F';
}

export function overallFromTraits(traits: Record<string, number>): number {
  const vals = Object.values(traits);
  if (!vals.length) return 60;
  const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
  return clamp(Math.round(avg), 40, 99);
}

/** Build trait ratings around a target overall with per-trait variance. */
export function buildTraits(
  position: Position,
  targetOverall: number,
  rng: () => number,
): Record<string, number> {
  const keys = POSITION_TRAITS[position];
  const traits: Record<string, number> = {};
  for (const key of keys) {
    const jitter = Math.floor((rng() - 0.5) * 16);
    traits[key] = clamp(targetOverall + jitter, 40, 99);
  }
  // Re-center so average lands near target
  const avg = Object.values(traits).reduce((a, b) => a + b, 0) / keys.length;
  const shift = targetOverall - avg;
  for (const key of keys) {
    traits[key] = clamp(Math.round(traits[key]! + shift), 40, 99);
  }
  return traits;
}

export function syncPhysicalFromTraits(player: Player): void {
  const t = player.traits ?? {};
  const speed =
    t.Speed ?? t.Mobility ?? t.Burst ?? t.Range ?? t.Separation ?? player.speed;
  const strength =
    t.Strength ?? t.Power ?? t.Blocking ?? t['Pass Block'] ?? player.strength;
  const awareness = t.Awareness ?? t.Vision ?? t.Clutch ?? player.awareness;
  player.speed = clamp(Math.round(speed), 40, 99);
  player.strength = clamp(Math.round(strength), 40, 99);
  player.awareness = clamp(Math.round(awareness), 40, 99);
}

export function ensurePlayerTraits(player: Player, rng?: () => number): Record<string, number> {
  if (player.traits && Object.keys(player.traits).length) return player.traits;
  const roll = rng ?? (() => 0.5);
  player.traits = buildTraits(player.position, player.overall, roll);
  syncPhysicalFromTraits(player);
  return player.traits;
}

export function traitEntries(player: Player): { key: string; value: number; grade: LetterGrade }[] {
  const traits = player.traits ?? {};
  const keys = POSITION_TRAITS[player.position];
  return keys.map((key) => {
    const value = traits[key] ?? player.overall;
    return { key, value, grade: ratingToGrade(value) };
  });
}
