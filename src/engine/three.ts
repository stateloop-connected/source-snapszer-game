import type { HCard, HSuit } from '../arcade/hungarian/cards';
import { cardPoints, createDeck, mulberry32, rankStrength, sameCard, shuffle } from './deck';
import {
  DECLARE_THRESHOLD, KONTRA_FACTOR, MARRIAGE_POINTS, SNAPSZER_UNITS, WRONG_DECLARE_UNITS, dealUnits,
} from './scoring';
import type {
  Action3, Deal3Result, Deal3State, LogEntry3, Options, PlayedCard3, ResultReason3, Seat, Side, Trick3,
} from './types';

/** Bedobás without an ace in the caller's hand: each defender gets 2. */
export const FOLD_UNITS = 2;
/** Bedobás while holding an ace: each defender gets 4. */
export const FOLD_ACE_UNITS = 4;

type Hands3 = Deal3State['hands'];

/** Cards per seat in each of the two rounds of the three-player deal (the caller names the trump after the first). */
export const DEAL3_ROUND = 4;

const next = (seat: Seat): Seat => ((seat + 1) % 3) as Seat;
/** The caller is the seat after the dealer. */
export const callerOf = (dealer: Seat): Seat => next(dealer);
/** The deal rotates, so the caller rotates with it. */
export const nextDealer3 = (dealer: Seat): Seat => next(dealer);
export const sideOf = (state: Deal3State, seat: Seat): Side => (seat === state.caller ? 'caller' : 'defenders');
const other = (side: Side): Side => (side === 'caller' ? 'defenders' : 'caller');
const seatsOf = (state: Deal3State, side: Side): Seat[] =>
  ([0, 1, 2] as Seat[]).filter((s) => sideOf(state, s) === side);

/**
 * Shuffles with the seed and deals 4 + 4 to each, starting with the caller (the seat after the dealer). Only the
 * first four are in hand until the caller names the trump; the caller leads. The nines are always in, so the
 * state's `opts` is normalised to `withNines: true`.
 */
export function deal3(seed: number, opts: Options, dealer: Seat): Deal3State {
  if (opts.mode !== 'three') throw new Error('deal3 is the three-player deal');
  const caller = callerOf(dealer);
  const deck = shuffle(createDeck(opts), mulberry32(seed));
  const order = [caller, next(caller), next(next(caller))];
  const hands: HCard[][] = [[], [], []];
  const pending: HCard[][] = [[], [], []];
  order.forEach((seat, i) => {
    const r = DEAL3_ROUND;
    hands[seat] = deck.slice(i * r, (i + 1) * r);
    pending[seat] = deck.slice(3 * r + i * r, 3 * r + (i + 1) * r);
  });
  return {
    mode: 'three',
    opts: { mode: 'three', withNines: true },
    seed,
    dealer,
    caller,
    phase: 'trump',
    trump: null,
    trumpCard: null,
    hands: hands as unknown as Hands3,
    pending: pending as unknown as Hands3,
    turn: caller,
    leader: caller,
    trick: [],
    tricks: [],
    marriages: [],
    mustLead: null,
    snapszer: false,
    kontra: { level: 0, by: null, played: [0, 0, 0] },
    result: null,
    log: [{ type: 'deal', dealer, caller }],
  };
}

const withLog = (state: Deal3State, ...entries: LogEntry3[]): readonly LogEntry3[] => [...state.log, ...entries];
const setHand = (hands: Hands3, seat: Seat, hand: readonly HCard[]): Hands3 =>
  hands.map((h, i) => (i === seat ? hand : h)) as unknown as Hands3;

const playing = (state: Deal3State, seat: Seat): boolean =>
  state.result === null && state.phase === 'play' && seat === state.turn;
const leading = (state: Deal3State, seat: Seat): boolean => playing(state, seat) && state.trick.length === 0;

/** The caller names the trump suit with one of its first four cards; everyone then gets the second four. */
export function chooseTrump(state: Deal3State, card: HCard): Deal3State {
  if (state.result || state.phase !== 'trump') throw new Error('The trump is already named');
  if (!state.hands[state.caller].some((c) => sameCard(c, card))) throw new Error('Name the trump from your first four cards');
  return {
    ...state,
    phase: 'play',
    trump: card.suit,
    trumpCard: card,
    hands: state.hands.map((h, i) => [...h, ...state.pending[i]]) as unknown as Hands3,
    pending: [[], [], []],
    turn: state.caller,
    leader: state.caller,
    log: withLog(state, { type: 'trump', seat: state.caller, card }),
  };
}

/** Bedobás: the caller, after naming the trump and before its first lead (before any announcement). */
export const canFold3 = (state: Deal3State, seat: Seat): boolean =>
  leading(state, seat) && seat === state.caller && state.tricks.length === 0 && !state.snapszer && state.marriages.length === 0;

const result = (state: Deal3State, winner: Side, each: number, reason: ResultReason3): Deal3Result => {
  const units: Record<Seat, number> = { 0: 0, 1: 0, 2: 0 };
  for (const s of seatsOf(state, winner)) units[s] = each;
  return { winner, units, reason };
};

const finish = (state: Deal3State, r: Deal3Result | null): Deal3State =>
  r ? { ...state, result: r, log: withLog(state, { type: 'over', result: r }) } : state;

/** The caller throws in its hand: each defender gets 2, or 4 if the caller holds an ace. */
export function fold(state: Deal3State): Deal3State {
  if (!canFold3(state, state.turn)) throw new Error('Cannot fold now');
  const ace = state.hands[state.caller].some((c) => c.rank === 'asz');
  const r = result(state, 'defenders', ace ? FOLD_ACE_UNITS : FOLD_UNITS, 'fold');
  return finish({ ...state, log: withLog(state, { type: 'fold', seat: state.caller }) }, r);
}

/** Does `card` beat `best` in a trick with this trump? */
const beats = (card: HCard, best: HCard, trump: HSuit): boolean =>
  card.suit === best.suit ? rankStrength(card.rank) > rankStrength(best.rank) : card.suit === trump;

/** The card currently winning a (partial) trick. */
function bestOf(cards: readonly PlayedCard3[], trump: HSuit): PlayedCard3 {
  return cards.reduce((best, p) => (beats(p.card, best.card, trump) ? p : best));
}

/** The winner of a complete trick: the highest trump, else the highest card of the led suit. */
export const trickWinner3 = (cards: readonly PlayedCard3[], trump: HSuit): Seat => bestOf(cards, trump).seat;

/**
 * Cards `seat` may play now. Leader: anything (after a 20 / 40 only that K or F). Otherwise, as there is no talon:
 * follow suit and beat the winning card if possible, else follow; without the suit trump, over-trumping if possible;
 * else any card.
 */
export function legalPlays3(state: Deal3State, seat: Seat): HCard[] {
  if (!playing(state, seat) || !state.trump) return [];
  const hand = state.hands[seat];
  if (state.trick.length === 0) {
    const m = state.mustLead;
    return m ? hand.filter((c) => c.suit === m && (c.rank === 'kiraly' || c.rank === 'felso')) : hand.slice();
  }
  const trump = state.trump;
  const led = state.trick[0].card.suit;
  const best = bestOf(state.trick, trump).card;
  const follow = hand.filter((c) => c.suit === led);
  if (follow.length > 0) {
    const beating = follow.filter((c) => beats(c, best, trump));
    return beating.length > 0 ? beating : follow;
  }
  const trumps = hand.filter((c) => c.suit === trump);
  if (trumps.length > 0) {
    const over = trumps.filter((c) => beats(c, best, trump));
    return over.length > 0 ? over : trumps;
  }
  return hand.slice();
}

/** Suits in which `seat` may announce 20 / 40 now: on its lead, one per turn, holding both K and F. */
export function marriageOptions3(state: Deal3State, seat: Seat): HSuit[] {
  if (!leading(state, seat) || state.mustLead !== null) return [];
  const hand = state.hands[seat];
  const suits = new Set(hand.filter((c) => c.rank === 'kiraly').map((c) => c.suit));
  return [...suits].filter((s) => hand.some((c) => c.suit === s && c.rank === 'felso'));
}

const sideTricks = (state: Deal3State, side: Side) => state.tricks.filter((t) => sideOf(state, t.winner) === side);
export const sideHasTrick3 = (state: Deal3State, side: Side): boolean => sideTricks(state, side).length > 0;

/** Points of a side: its trick points, plus its marriages once the side has won a trick (the pair pools both). */
export function sidePoints3(state: Deal3State, side: Side): number {
  const won = sideTricks(state, side);
  if (won.length === 0) return 0;
  const tricks = won.reduce((n, t) => n + t.cards.reduce((m, p) => m + cardPoints(p.card), 0), 0);
  const marriages = state.marriages.filter((m) => sideOf(state, m.seat) === side).reduce((n, m) => n + m.points, 0);
  return tricks + marriages;
}

/** Points that count for `seat`: the caller's own, or the pair's pooled points for a defender. */
export const points3 = (state: Deal3State, seat: Seat): number => sidePoints3(state, sideOf(state, seat));

/** „Elég!” is always allowed on your turn in the play phase; under 66 it loses the deal. */
export const canDeclare3 = (state: Deal3State, seat: Seat): boolean => playing(state, seat);

/** „Elég!” that really wins: the seat's side has ≥ 66 counted points. */
export const canDeclareWin3 = (state: Deal3State, seat: Seat): boolean =>
  playing(state, seat) && points3(state, seat) >= DECLARE_THRESHOLD;

/** Only the caller, from hand or at its first lead, once per deal. */
export const canSnapszer3 = (state: Deal3State, seat: Seat): boolean =>
  leading(state, seat) && seat === state.caller && !state.snapszer && state.tricks.length === 0;

const playedCount3 = (state: Deal3State, seat: Seat): number =>
  state.tricks.reduce((n, t) => n + t.cards.filter((p) => p.seat === seat).length, 0) + state.trick.filter((p) => p.seat === seat).length;

/**
 * Kontra by a defender before its first card; rekontra by the caller, subkontra by a defender: each raise by the
 * other side, on its turn, before it has played a card since the previous raise.
 */
export function canKontra3(state: Deal3State, seat: Seat): boolean {
  if (!playing(state, seat) || state.kontra.level >= 3) return false;
  const raiser: Side = state.kontra.by === null ? 'caller' : sideOf(state, state.kontra.by);
  return sideOf(state, seat) !== raiser && playedCount3(state, seat) === state.kontra.played[seat];
}

/** Every action the seat on turn may take (a declare is always listed in play: under 66 it is a losing one). */
export function legalActions3(state: Deal3State): Action3[] {
  if (state.result) return [];
  if (state.phase === 'trump') return state.hands[state.caller].map((card) => ({ type: 'trump', card }));
  const seat = state.turn;
  const actions: Action3[] = legalPlays3(state, seat).map((card) => ({ type: 'play', card }));
  for (const suit of marriageOptions3(state, seat)) actions.push({ type: 'marriage', suit });
  actions.push({ type: 'declare' });
  if (canSnapszer3(state, seat)) actions.push({ type: 'snapszer' });
  if (canKontra3(state, seat)) actions.push({ type: 'kontra' });
  if (canFold3(state, seat)) actions.push({ type: 'fold' });
  return actions;
}

const factor = (state: Deal3State) => KONTRA_FACTOR ** state.kontra.level;

const won = (state: Deal3State, side: Side, reason: 'declared' | 'lastTrick'): Deal3Result => {
  const loser = other(side);
  return result(state, side, dealUnits(sidePoints3(state, loser), sideHasTrick3(state, loser)) * factor(state), reason);
};
const snapszerWon = (state: Deal3State) => result(state, 'caller', SNAPSZER_UNITS * factor(state), 'snapszer');
const snapszerLost = (state: Deal3State) => result(state, 'defenders', SNAPSZER_UNITS * factor(state), 'snapszerFailed');

function resolveDeclare3(state: Deal3State, seat: Seat): Deal3Result {
  const side = sideOf(state, seat);
  const enough = points3(state, seat) >= DECLARE_THRESHOLD;
  if (state.snapszer) {
    if (side === 'defenders') return snapszerWon(state); // ruling: the trickless pair cannot have 66
    return enough ? snapszerWon(state) : snapszerLost(state);
  }
  if (!enough) return result(state, other(side), WRONG_DECLARE_UNITS * factor(state), 'declared');
  return won(state, side, 'declared');
}

function resolveAfterTrick3(state: Deal3State): Deal3Result | null {
  const last = state.tricks[state.tricks.length - 1];
  if (state.snapszer && last.winner !== state.caller) return snapszerLost(state);
  if (state.hands.some((h) => h.length > 0)) return null;
  if (state.snapszer) return snapszerWon(state);
  return won(state, sideOf(state, last.winner), 'lastTrick');
}

function playCard3(state: Deal3State, card: HCard): Deal3State {
  const seat = state.turn;
  if (!legalPlays3(state, seat).some((c) => sameCard(c, card))) throw new Error('Illegal card');
  const hands = setHand(state.hands, seat, state.hands[seat].filter((c) => !sameCard(c, card)));
  const trick = [...state.trick, { seat, card }];
  const log: LogEntry3 = { type: 'play', seat, card };
  if (trick.length < 3) return { ...state, hands, trick, turn: next(seat), mustLead: null, log: withLog(state, log) };
  const winner = trickWinner3(trick, state.trump as HSuit);
  const done: Trick3 = { leader: state.leader, cards: trick as unknown as Trick3['cards'], winner };
  const after: Deal3State = {
    ...state,
    hands,
    trick: [],
    tricks: [...state.tricks, done],
    turn: winner,
    leader: winner,
    mustLead: null,
    log: withLog(state, log, { type: 'trick', index: state.tricks.length, winner }),
  };
  return finish(after, resolveAfterTrick3(after));
}

/** Applies `action` for the seat on turn (the caller in the trump phase); throws on anything illegal. Never mutates. */
export function applyAction3(state: Deal3State, action: Action3): Deal3State {
  if (state.result) throw new Error('The deal is over');
  const seat = state.turn;
  if (action.type === 'trump') return chooseTrump(state, action.card);
  if (state.phase !== 'play') throw new Error('Name the trump first');
  switch (action.type) {
    case 'play':
      return playCard3(state, action.card);
    case 'fold':
      return fold(state);
    case 'marriage': {
      if (!marriageOptions3(state, seat).includes(action.suit)) throw new Error('Cannot announce this marriage');
      const pts = action.suit === state.trump ? MARRIAGE_POINTS.trump : MARRIAGE_POINTS.plain;
      return {
        ...state,
        marriages: [...state.marriages, { seat, suit: action.suit, points: pts }],
        mustLead: action.suit,
        log: withLog(state, { type: 'marriage', seat, suit: action.suit, points: pts }),
      };
    }
    case 'declare': {
      const r = resolveDeclare3(state, seat);
      return finish({ ...state, log: withLog(state, { type: 'declare', seat, points: points3(state, seat) }) }, r);
    }
    case 'snapszer':
      if (!canSnapszer3(state, seat)) throw new Error('Only the caller may announce snapszer, at its first lead');
      return { ...state, snapszer: true, log: withLog(state, { type: 'snapszer', seat }) };
    case 'kontra': {
      if (!canKontra3(state, seat)) throw new Error('Cannot say kontra now');
      const level = (state.kontra.level + 1) as 1 | 2 | 3;
      const played = [playedCount3(state, 0), playedCount3(state, 1), playedCount3(state, 2)] as const;
      return { ...state, kontra: { level, by: seat, played }, log: withLog(state, { type: 'kontra', seat, level }) };
    }
  }
}

export const isDealOver3 = (state: Deal3State): boolean => state.result !== null;

/** Units per seat (kontra applied), the winning side and why; throws while the deal is still running. */
export function dealResult3(state: Deal3State): Deal3Result {
  if (!state.result) throw new Error('The deal is not over yet');
  return state.result;
}
