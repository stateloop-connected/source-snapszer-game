import type { Level } from '../bots';
import type { Seat } from '../engine';
import { playBotMatch } from './match';

/** Duplicate-seeded two-player matches per pairing: 100 seeds, each played twice with the seats swapped. */
export const STRENGTH_MATCHES = 200;
export const STRENGTH_BASE_SEED = 70_000;

export interface Tally {
  matches: number;
  /** Matches A won (two players: a match always has a winner). */
  wins: number;
  unitsA: number;
  unitsB: number;
}

/** A against B, two players: match i uses seed BASE + ⌊i / 2⌋, odd matches with the seats swapped. */
export function strengthTally(a: Level, b: Level, matches: number, withNines = false): Tally {
  const t: Tally = { matches: 0, wins: 0, unitsA: 0, unitsB: 0 };
  for (let i = 0; i < matches; i++) {
    const swapped = i % 2 === 1;
    const end = playBotMatch(swapped ? [b, a] : [a, b], { mode: 'two', withNines, seed: STRENGTH_BASE_SEED + Math.floor(i / 2) });
    const ua = end.units[swapped ? 1 : 0];
    const ub = end.units[swapped ? 0 : 1];
    t.matches += 1;
    t.unitsA += ua;
    t.unitsB += ub;
    if (ua > ub) t.wins += 1;
  }
  return t;
}

export interface Tally3 {
  matches: number;
  /** Matches each finished strictly on top of the other two. */
  winsA: number;
  winsB: number;
  unitsA: number;
  unitsB: number;
}

/** Every seating of A, B and a medium third seat (6 per seed), three players. */
const SEATINGS: readonly (readonly [Seat, Seat])[] = [[0, 1], [1, 0], [0, 2], [2, 0], [1, 2], [2, 1]];

export function strengthTally3(a: Level, b: Level, matches: number): Tally3 {
  const t: Tally3 = { matches: 0, winsA: 0, winsB: 0, unitsA: 0, unitsB: 0 };
  for (let i = 0; i < matches; i++) {
    const [sa, sb] = SEATINGS[i % SEATINGS.length];
    const levels: Level[] = ['medium', 'medium', 'medium'];
    levels[sa] = a;
    levels[sb] = b;
    const end = playBotMatch(levels, { mode: 'three', withNines: true, seed: STRENGTH_BASE_SEED + Math.floor(i / SEATINGS.length) });
    const u = [end.units[0], end.units[1], end.units[2]];
    const top = (s: Seat) => u.every((v, k) => k === s || u[s] > v);
    t.matches += 1;
    t.unitsA += u[sa];
    t.unitsB += u[sb];
    if (top(sa)) t.winsA += 1;
    if (top(sb)) t.winsB += 1;
  }
  return t;
}
