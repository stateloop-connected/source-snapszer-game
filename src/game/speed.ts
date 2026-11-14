import { readString, writeString } from '../arcade';
import type { Deal2State, Deal3State } from '../engine';

export type Speed = 'slow' | 'normal' | 'fast';
export const SPEEDS: readonly Speed[] = ['slow', 'normal', 'fast'];
export const SPEED_KEY = 'snapszer.speed';

/** Multiplier on every bot delay (Normal = 1), as in Ulti. */
export const SPEED_FACTOR: Readonly<Record<Speed, number>> = { slow: 1.6, normal: 1, fast: 0.45 };

/** Visible thinking time of a bot at Normal speed. */
export const PLAY_DELAY_MS = 800;
/** A finished trick stays on the table this long before the next lead. */
export const TRICK_PAUSE_MS = 1300;

export function readSpeed(): Speed {
  const v = readString(SPEED_KEY);
  return SPEEDS.includes(v as Speed) ? (v as Speed) : 'normal';
}

export const writeSpeed = (s: Speed): void => void writeString(SPEED_KEY, s);

/** How long the bot on turn waits before it moves (Normal speed). */
export function botDelay(deal: Deal2State | Deal3State): number {
  const last = deal.log[deal.log.length - 1];
  return last?.type === 'trick' ? TRICK_PAUSE_MS : PLAY_DELAY_MS;
}
