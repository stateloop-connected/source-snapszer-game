import type { HCard } from '../arcade/hungarian/cards';
import {
  DECLARE_THRESHOLD, canFold3, cardPoints, isTalonOpen, legalPlays, legalPlays3, marriagePoints, sideOf, trickPoints,
  type Action, type Action3, type Deal2State, type Deal3State, type Seat,
} from '../engine';
import { beats, dumpCost, freeAction2, freeAction3, isMaster, maxBy, minBy, power, suitScore, unseenCards } from './common';

/*
 * Medium: rules of thumb on what the seat can see (its hand and the table). It is also the player in every seat of
 * the hard bot's simulations, so it has to be quick. It never closes, never announces snapszer and never says kontra.
 */

/** After a 20 / 40 the K or F must be led: give the cheaper Felső. */
const marriageLead = (legal: readonly HCard[]): HCard => minBy(legal, cardPoints);

/* ---------- two players ---------- */

function lead2(state: Deal2State, me: 0 | 1, legal: readonly HCard[]): HCard {
  const trump = state.trump;
  const hand = state.hands[me];
  if (state.mustLead) return marriageLead(legal);
  const strict = !isTalonOpen(state);
  if (strict || state.snapszer?.by === me) {
    const unseen = unseenCards(state, me);
    const trumps = legal.filter((c) => c.suit === trump);
    const theyMayTrump = unseen.some((u) => u.suit === trump);
    const masterTrumps = trumps.filter((c) => isMaster(c, unseen));
    if (theyMayTrump && masterTrumps.length > 0) return maxBy(masterTrumps, (c) => power(c, trump));
    const masters = legal.filter((c) => c.suit !== trump && isMaster(c, unseen));
    if (masters.length > 0) return maxBy(masters, cardPoints);
    if (state.snapszer?.by === me) return maxBy(legal, (c) => power(c, trump));
  }
  const side = legal.filter((c) => c.suit !== trump);
  return minBy(side.length > 0 ? side : legal, (c) => dumpCost(c, hand, trump));
}

function follow2(state: Deal2State, me: 0 | 1, legal: readonly HCard[]): HCard {
  const trump = state.trump;
  const hand = state.hands[me];
  const led = state.trick[0].card;
  const winners = legal.filter((c) => beats(c, led, trump));
  const cheapest = () => minBy(winners, (c) => power(c, trump));
  const dump = () => minBy(legal, (c) => dumpCost(c, hand, trump));
  if (winners.length === 0) return dump();
  const sn = state.snapszer;
  if (sn) return cheapest(); // the announcer must take every trick; the defender only needs one
  // Winning this trick takes me to 66: take it as cheaply as possible.
  const mine = trickPoints(state, me) + marriagePoints(state, me) + cardPoints(led);
  const reach = winners.filter((c) => mine + cardPoints(c) >= DECLARE_THRESHOLD);
  if (reach.length > 0) return minBy(reach, (c) => power(c, trump));
  if (!isTalonOpen(state)) return cheapest();
  const same = winners.filter((c) => c.suit === led.suit);
  if (same.length > 0) return maxBy(same, cardPoints); // bank the points with the higher card of the suit
  if (cardPoints(led) >= 10) return minBy(winners, (c) => dumpCost(c, hand, trump)); // trump an ace or a ten
  return dump();
}

export function mediumCard2(state: Deal2State, me: 0 | 1): HCard {
  const legal = legalPlays(state, me);
  if (legal.length === 1) return legal[0];
  return state.trick.length === 0 ? lead2(state, me, legal) : follow2(state, me, legal);
}

export function medium2(state: Deal2State): Action {
  const me = state.turn;
  return freeAction2(state, me) ?? { type: 'play', card: mediumCard2(state, me) };
}

/* ---------- three players ---------- */

/** The card winning the trick on the table so far, and who played it. */
function tableBest(state: Deal3State) {
  const trump = state.trump;
  return state.trick.reduce((best, p) => (beats(p.card, best.card, trump) ? p : best));
}

/** Points the seat's side would have after taking the trick on the table with `card`. */
function sideIfWin(state: Deal3State, me: Seat, card: HCard): number {
  const side = sideOf(state, me);
  let n = cardPoints(card);
  for (const t of state.tricks) if (sideOf(state, t.winner) === side) for (const p of t.cards) n += cardPoints(p.card);
  for (const m of state.marriages) if (sideOf(state, m.seat) === side) n += m.points;
  for (const p of state.trick) n += cardPoints(p.card);
  return n;
}

function lead3(state: Deal3State, me: Seat, legal: readonly HCard[]): HCard {
  const trump = state.trump;
  const hand = state.hands[me];
  if (state.mustLead) return marriageLead(legal);
  const unseen = unseenCards(state, me);
  const side = legal.filter((c) => c.suit !== trump);
  const masters = side.filter((c) => isMaster(c, unseen));
  if (me === state.caller) {
    const masterTrumps = legal.filter((c) => c.suit === trump && isMaster(c, unseen));
    if (unseen.some((u) => u.suit === trump) && masterTrumps.length > 0) return maxBy(masterTrumps, (c) => power(c, trump));
    if (masters.length > 0) return maxBy(masters, cardPoints);
    if (state.snapszer) return maxBy(legal, (c) => power(c, trump));
  } else if (masters.length > 0) {
    return maxBy(masters, cardPoints);
  }
  return minBy(side.length > 0 ? side : legal, (c) => dumpCost(c, hand, trump));
}

function follow3(state: Deal3State, me: Seat, legal: readonly HCard[]): HCard {
  const trump = state.trump;
  const hand = state.hands[me];
  const best = tableBest(state);
  const last = state.trick.length === 2;
  const partnerWinning = me !== state.caller && best.seat !== state.caller;
  const winners = legal.filter((c) => beats(c, best.card, trump));
  const dump = () => minBy(legal, (c) => dumpCost(c, hand, trump));
  if (partnerWinning) {
    if (last) return maxBy(legal, (c) => cardPoints(c) * 2 - (c.suit === trump ? 25 : 0) - (c.rank === 'asz' ? 4 : 0));
    return dump();
  }
  if (winners.length === 0) return dump();
  const reach = winners.filter((c) => sideIfWin(state, me, c) >= DECLARE_THRESHOLD);
  if (reach.length > 0 && last) return minBy(reach, (c) => power(c, trump));
  if (last) return minBy(winners, (c) => power(c, trump) - (c.rank === 'X' && c.suit !== trump ? 3 : 0));
  // Second hand: win with a card the last player cannot beat, else stay low.
  const unseen = unseenCards(state, me);
  const safe = winners.filter((c) => isMaster(c, unseen) && (c.suit === trump || !unseen.some((u) => u.suit === trump)));
  if (safe.length > 0) return minBy(safe, (c) => power(c, trump));
  if (state.snapszer || me === state.caller) return maxBy(winners, (c) => power(c, trump));
  return minBy(winners, (c) => power(c, trump));
}

export function mediumCard3(state: Deal3State, me: Seat): HCard {
  const legal = legalPlays3(state, me);
  if (legal.length === 1) return legal[0];
  return state.trick.length === 0 ? lead3(state, me, legal) : follow3(state, me, legal);
}

/** The trump from the first four: the longest, strongest suit. */
export function trumpChoice(state: Deal3State): Action3 {
  const hand = state.hands[state.caller];
  const card = maxBy(hand, (c) => suitScore(hand, c.suit) * 100 + cardPoints(c));
  return { type: 'trump', card };
}

/** Fold only a hopeless hand without an ace (a fold with an ace costs 4 each). */
export function weakHand3(state: Deal3State): boolean {
  const hand = state.hands[state.caller];
  const trumps = hand.filter((c) => c.suit === state.trump);
  const pts = hand.reduce((n, c) => n + cardPoints(c), 0);
  return !hand.some((c) => c.rank === 'asz') && trumps.length <= 2 && !trumps.some((c) => c.rank === 'X') && pts < 22;
}

export function medium3(state: Deal3State): Action3 {
  if (state.phase === 'trump') return trumpChoice(state);
  const me = state.turn;
  const free = freeAction3(state, me);
  if (free) return free;
  if (canFold3(state, me) && weakHand3(state)) return { type: 'fold' };
  return { type: 'play', card: mediumCard3(state, me) };
}

/** Medium's decision without folding (the hard bot's simulations decide the fold themselves). */
export function rolloutAction3(state: Deal3State): Action3 {
  if (state.phase === 'trump') return trumpChoice(state);
  const me = state.turn;
  return freeAction3(state, me) ?? { type: 'play', card: mediumCard3(state, me) };
}
