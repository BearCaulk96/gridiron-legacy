import type { LeagueState } from './types';

const KEY = 'gridiron-legacy-save-v1';

export function saveGame(state: LeagueState): void {
  localStorage.setItem(KEY, JSON.stringify(state));
}

export function loadGame(): LeagueState | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as LeagueState;
    if (data.version !== 1) return null;
    return data;
  } catch {
    return null;
  }
}

export function clearSave(): void {
  localStorage.removeItem(KEY);
}

export function hasSave(): boolean {
  return localStorage.getItem(KEY) != null;
}
