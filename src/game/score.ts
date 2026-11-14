import type { Level } from '../bots';
import type { Seat, SnapszerMode } from '../engine';

/** Leaderboard points per unit of lead over the best opponent. */
export const UNIT_POINTS = 100;
/** Bonus for winning the match. */
export const WIN_BONUS = 500;
export const LEVEL_FACTOR: Readonly<Record<Level, number>> = { easy: 1, medium: 1.5, hard: 2 };
/** The portal's `max_score` for `snapszer`. */
export const MAX_SCORE = 5000;

export interface ScoredMatch {
  readonly mode: SnapszerMode;
  readonly level: Level;
  readonly units: Readonly<Record<Seat, number>>;
}

/** The highest opponent (seat 1, or the better of seats 1 and 2 in three-player mode; never their sum). */
export const bestOpponent = (m: ScoredMatch): number => (m.mode === 'two' ? m.units[1] : Math.max(m.units[1], m.units[2]));

/**
 * round((max(0, you − best opponent) × 100 + (won ? 500 : 0)) × level factor), clamped to 0 … 5000. „You” is the
 * human at seat 0. Finishing early uses the same formula with `won = false`.
 */
export function matchScore(m: ScoredMatch, won: boolean): number {
  const lead = Math.max(0, m.units[0] - bestOpponent(m));
  const raw = Math.round((lead * UNIT_POINTS + (won ? WIN_BONUS : 0)) * LEVEL_FACTOR[m.level]);
  return Math.min(MAX_SCORE, Math.max(0, raw));
}
