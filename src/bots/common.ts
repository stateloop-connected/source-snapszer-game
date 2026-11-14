import type { HCard, HSuit } from '../arcade/hungarian/cards';
import {
  canDeclareWin, canDeclareWin3, canExchange, cardKey, cardPoints, createDeck, marriageOptions, marriageOptions3, rankStrength,
  type Action, type Action3, type Deal2State, type Deal3State, type Seat,
} from '../engine';

/** Bot strength. */
export type Level = 'easy' | 'medium' | 'hard';
export const LEVELS: readonly Level[] = ['easy', 'medium', 'hard'];
export const isLevel = (v: unknown): v is Level => v === 'easy' || v === 'medium' || v === 'hard';

export type AnyDeal = Deal2State | Deal3State;
export type Rng = () => number;

export const minBy = <T>(xs: readonly T[], f: (x: T) => number): T => xs.reduce((a, b) => (f(b) < f(a) ? b : a));
export const maxBy = <T>(xs: readonly T[], f: (x: T) => number): T => xs.reduce((a, b) => (f(b) > f(a) ? b : a));
export const pick = <T>(xs: readonly T[], rng: Rng): T => xs[Math.floor(rng() * xs.length)];

/** Trick-taking power in this deal: every trump above every other card. */
export const power = (card: HCard, trump: HSuit | null): number => (card.suit === trump ? 10 : 0) + rankStrength(card.rank);

/** Does `card` beat `best` (same suit and higher, or a trump on a non-trump)? */
export const beats = (card: HCard, best: HCard, trump: HSuit | null): boolean =>
  card.suit === best.suit ? rankStrength(card.rank) > rankStrength(best.rank) : card.suit === trump;

/** K or F whose partner for a 20 / 40 is still in the same hand. */
export const inPair = (card: HCard, hand: readonly HCard[]): boolean =>
  (card.rank === 'kiraly' || card.rank === 'felso') &&
  hand.some((h) => h.suit === card.suit && h.rank === (card.rank === 'kiraly' ? 'felso' : 'kiraly'));

/** Cost of giving a card away: points, trumps and marriage halves are kept. */
export const dumpCost = (card: HCard, hand: readonly HCard[], trump: HSuit | null): number =>
  cardPoints(card) * 2 + rankStrength(card.rank) + (card.suit === trump ? 30 : 0) + (inPair(card, hand) ? 12 : 0);

/** Cards that have left the hands: completed tricks and the trick on the table. */
export function playedCards(state: AnyDeal): HCard[] {
  const out: HCard[] = [];
  for (const t of state.tricks) for (const p of t.cards) out.push(p.card);
  for (const p of state.trick) out.push(p.card);
  return out;
}

/**
 * Keys of every card `seat` can see or has seen leave play: its own hand, the played cards and a face-up trump.
 * Everything else is unseen (the other hands and the face-down talon).
 */
export function seenKeys(state: AnyDeal, seat: Seat): Set<string> {
  const seen = new Set<string>();
  for (const c of (state.hands as readonly (readonly HCard[])[])[seat] ?? []) seen.add(cardKey(c));
  for (const c of playedCards(state)) seen.add(cardKey(c));
  if (state.mode === 'two' && state.trumpCard) seen.add(cardKey(state.trumpCard));
  return seen;
}

export const deckOf = (state: AnyDeal): HCard[] => createDeck(state.opts);

/** Unseen cards from `seat`'s point of view. */
export function unseenCards(state: AnyDeal, seat: Seat): HCard[] {
  const seen = seenKeys(state, seat);
  return deckOf(state).filter((c) => !seen.has(cardKey(c)));
}

/** No unseen card of the same suit beats it. */
export const isMaster = (card: HCard, unseen: readonly HCard[]): boolean =>
  !unseen.some((u) => u.suit === card.suit && rankStrength(u.rank) > rankStrength(card.rank));

/** Exchange is worth it when the turned-up trump is stronger than the Alsó (not the trump nine). */
export const exchangeUseful = (state: Deal2State, seat: Seat): boolean =>
  canExchange(state, seat) && state.trumpCard !== null && rankStrength(state.trumpCard.rank) > rankStrength('also');

/** The 40 before a 20. */
const bestMarriage = (suits: readonly HSuit[], trump: HSuit | null): HSuit =>
  suits.includes(trump as HSuit) ? (trump as HSuit) : suits[0];

/**
 * What every level does without thinking: „Elég!” as soon as it really wins, the exchange when it is useful, and a
 * 20 / 40 when it can announce one (it only ever adds points). No 20 / 40 while a snapszer runs: the announcer needs
 * every trick (a marriage would force it to lead the K or F), the defenders need just one.
 */
export function freeAction2(state: Deal2State, seat: Seat): Action | null {
  if (canDeclareWin(state, seat)) return { type: 'declare' };
  if (exchangeUseful(state, seat)) return { type: 'exchange' };
  const suits = marriageOptions(state, seat);
  if (suits.length > 0 && !state.snapszer) return { type: 'marriage', suit: bestMarriage(suits, state.trump) };
  return null;
}

export function freeAction3(state: Deal3State, seat: Seat): Action3 | null {
  if (state.phase !== 'play') return null;
  if (canDeclareWin3(state, seat)) return { type: 'declare' };
  const suits = marriageOptions3(state, seat);
  if (suits.length > 0 && !state.snapszer) return { type: 'marriage', suit: bestMarriage(suits, state.trump) };
  return null;
}

/** Suit strength for naming the trump from four cards: length first, then high cards. */
export function suitScore(hand: readonly HCard[], suit: HSuit): number {
  const cards = hand.filter((c) => c.suit === suit);
  return cards.length * 10 + cards.reduce((n, c) => n + rankStrength(c.rank) + cardPoints(c) / 4, 0);
}
