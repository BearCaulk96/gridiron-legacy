import type { LeagueState } from './types';

const KEY = 'gridiron-legacy-save-v2';
const LEGACY_KEYS = ['gridiron-legacy-save-v1'];

export function saveGame(state: LeagueState): void {
  localStorage.setItem(KEY, JSON.stringify(state));
}

export function loadGame(): LeagueState | null {
  try {
    for (const legacy of LEGACY_KEYS) {
      if (localStorage.getItem(legacy)) localStorage.removeItem(legacy);
    }
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as LeagueState;
    if (data.version !== 2) return null;
    if (typeof data.calendarIndex !== 'number') return null;
    const sample = data.teams?.[0];
    if (!sample || (sample.conference !== 'American' && sample.conference !== 'National') || !('accent' in sample)) {
      localStorage.removeItem(KEY);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

export function clearSave(): void {
  localStorage.removeItem(KEY);
  for (const legacy of LEGACY_KEYS) localStorage.removeItem(legacy);
}

export function hasSave(): boolean {
  return localStorage.getItem(KEY) != null;
}
