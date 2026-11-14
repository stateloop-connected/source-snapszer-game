import { readString, writeString } from '../arcade';
import { isLevel, type Level } from '../bots';
import type { SnapszerMode } from '../engine';

/** The setup the next match starts with; saved per browser. */
export interface Setup {
  mode: SnapszerMode;
  withNines: boolean;
  level: Level;
}

export const SETUP_KEY = 'snapszer.setup';
export const SHOW_POINTS_KEY = 'snapszer.showPoints';

export function readSetup(): Setup {
  const fallback: Setup = { mode: 'two', withNines: false, level: 'medium' };
  try {
    const v = JSON.parse(readString(SETUP_KEY) ?? 'null') as Partial<Setup> | null;
    if (!v) return fallback;
    return {
      mode: v.mode === 'three' ? 'three' : 'two',
      withNines: v.withNines === true,
      level: isLevel(v.level) ? v.level : 'medium',
    };
  } catch {
    return fallback;
  }
}

export const writeSetup = (s: Setup): void => void writeString(SETUP_KEY, JSON.stringify(s));

/** „Pontok mutatása”: off by default — the points are counted in your head, as at a real table. */
export const readShowPoints = (): boolean => readString(SHOW_POINTS_KEY) === '1';
export const writeShowPoints = (on: boolean): void => void writeString(SHOW_POINTS_KEY, on ? '1' : '0');
