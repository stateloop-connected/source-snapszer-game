import { H_SUITS, type HCard, type HRank } from '../arcade/hungarian/cards';
import type { Options } from './types';

/** Snapszer ranks, weakest first: IX (only with the nines), Alsó, Felső, Király, X, Ász. */
export const SNAPSZER_RANKS: readonly HRank[] = ['IX', 'also', 'felso', 'kiraly', 'X', 'asz'];

const STRENGTH: Partial<Record<HRank, number>> = { IX: 0, also: 1, felso: 2, kiraly: 3, X: 4, asz: 5 };
const POINTS: Partial<Record<HRank, number>> = { IX: 0, also: 2, felso: 3, kiraly: 4, X: 10, asz: 11 };

/** Trick-taking strength: A > X > K > F > Alsó > IX. */
export const rankStrength = (rank: HRank): number => STRENGTH[rank] ?? -1;

/** Card value: A 11, X 10, K 4, F 3, Alsó 2, IX 0 (the deck adds up to 120). */
export const cardPoints = (card: HCard): number => POINTS[card.rank] ?? 0;

/** Two players: 20 cards (A, X, K, F, Alsó × 4), 24 with the nines; three players: always 24. */
export function createDeck(opts: Options): HCard[] {
  const nines = opts.mode === 'three' || opts.withNines;
  const ranks = nines ? SNAPSZER_RANKS : SNAPSZER_RANKS.filter((r) => r !== 'IX');
  return H_SUITS.flatMap((suit) => ranks.map((rank) => ({ suit, rank })));
}

export const cardKey = (card: HCard): string => `${card.suit}-${card.rank}`;
export const sameCard = (a: HCard, b: HCard): boolean => a.suit === b.suit && a.rank === b.rank;

/** Small seeded RNG (same as the other arcade games). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle<T>(items: readonly T[], rng: () => number): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
