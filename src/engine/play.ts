import type { HCard, HSuit } from '../arcade/hungarian/cards';
import { rankStrength, sameCard } from './deck';
import { other } from './deal';
import { DECLARE_THRESHOLD, MARRIAGE_POINTS, points, resolveAfterTrick, resolveDeclare } from './scoring';
import type { Action, Deal2State, LogEntry, PlayedCard, Seat, Seat2, Trick } from './types';

/** Minimum face-down cards above the trump for exchanging or closing. */
export const MIN_TALON_FOR_EXCHANGE = 3;

const onTurn = (state: Deal2State, seat: Seat): seat is Seat2 => state.result === null && seat === state.turn;
const leading = (state: Deal2State, seat: Seat): seat is Seat2 => onTurn(state, seat) && state.trick.length === 0;

/** Cards `seat` has played so far in this deal. */
export const playedCount = (state: Deal2State, seat: Seat): number =>
  state.tricks.reduce((n, t) => n + t.cards.filter((p) => p.seat === seat).length, 0) + state.trick.filter((p) => p.seat === seat).length;

/** Talon still open: not closed and something is left to draw. Open talon = free play; else strict following. */
export const isTalonOpen = (state: Deal2State): boolean =>
  state.closed === null && (state.talon.length > 0 || state.trumpCard !== null);

/** The winner of a complete two-card trick: the higher card of the led suit, unless trumped. */
export function trickWinner(cards: readonly PlayedCard[], trump: HSuit): Seat2 {
  const [lead, follow] = cards;
  if (follow.card.suit === lead.card.suit) return rankStrength(follow.card.rank) > rankStrength(lead.card.rank) ? follow.seat : lead.seat;
  return follow.card.suit === trump ? follow.seat : lead.seat;
}

/**
 * Cards `seat` may play now. Leader: anything (after a 20/40 only that K or F). Follower with an open talon: anything.
 * Closed or empty talon: follow suit and beat if possible, else follow; without the suit trump; else any card.
 */
export function legalPlays(state: Deal2State, seat: Seat): HCard[] {
  if (!onTurn(state, seat)) return [];
  const hand = state.hands[seat];
  if (state.trick.length === 0) {
    const m = state.mustLead;
    return m ? hand.filter((c) => c.suit === m && (c.rank === 'kiraly' || c.rank === 'felso')) : hand.slice();
  }
  if (isTalonOpen(state)) return hand.slice();
  const led = state.trick[0].card;
  const suit = hand.filter((c) => c.suit === led.suit);
  if (suit.length > 0) {
    const beat = suit.filter((c) => rankStrength(c.rank) > rankStrength(led.rank));
    return beat.length > 0 ? beat : suit;
  }
  const trumps = hand.filter((c) => c.suit === state.trump);
  return trumps.length > 0 ? trumps : hand.slice();
}

const talonAllows = (state: Deal2State) =>
  state.closed === null && state.trumpCard !== null && state.talon.length >= MIN_TALON_FOR_EXCHANGE;

/** Swap the trump Alsó for the turned-up trump: on your lead, ≥ 3 face-down cards above the trump, talon not closed. */
export const canExchange = (state: Deal2State, seat: Seat): boolean =>
  leading(state, seat) &&
  talonAllows(state) &&
  state.hands[seat].some((c) => c.suit === state.trump && c.rank === 'also');

/** Close the talon (betakarás): on your lead, ≥ 3 face-down cards above the trump, not yet closed. */
export const canClose = (state: Deal2State, seat: Seat): boolean => leading(state, seat) && talonAllows(state);

/** Suits in which `seat` may announce 20 / 40 now: on its lead, one per turn, holding both K and F. */
export function marriageOptions(state: Deal2State, seat: Seat): HSuit[] {
  if (!leading(state, seat) || state.mustLead !== null) return [];
  const hand = state.hands[seat];
  const suits = new Set(hand.filter((c) => c.rank === 'kiraly').map((c) => c.suit));
  return [...suits].filter((s) => hand.some((c) => c.suit === s && c.rank === 'felso'));
}

/** „Elég!” is always allowed on your turn; under 66 it loses the deal (see WRONG_DECLARE_UNITS). */
export const canDeclare = (state: Deal2State, seat: Seat): boolean => onTurn(state, seat);

/** „Elég!” that really wins: the seat on turn has ≥ 66 counted points. Bots and the UI offer only this one. */
export const canDeclareWin = (state: Deal2State, seat: Seat): boolean => onTurn(state, seat) && points(state, seat) >= DECLARE_THRESHOLD;

/** Snapszer: in the first round only, by the seat on turn before it has played a card, once per deal. */
export const canSnapszer = (state: Deal2State, seat: Seat): boolean =>
  onTurn(state, seat) && state.snapszer === null && state.tricks.length === 0 && playedCount(state, seat) === 0;

/** Which kontra `seat` could say now: the snapszer of the opponent, or the deal, or none. */
function kontraTarget(state: Deal2State, seat: Seat): 'game' | 'snapszer' | null {
  if (!onTurn(state, seat)) return null;
  const sn = state.snapszer;
  if (sn) {
    return sn.by !== seat && state.kontra.snapszer === null && playedCount(state, seat) === sn.defenderPlayed ? 'snapszer' : null;
  }
  return state.kontra.game === null && playedCount(state, seat) === 0 ? 'game' : null;
}

/**
 * Kontra on the deal: once per deal, by either seat on its turn before it plays its first card.
 * Kontra on a snapszer: by the defender on its turn before it plays another card after the announcement.
 */
export const canKontra = (state: Deal2State, seat: Seat): boolean => kontraTarget(state, seat) !== null;

/** Every action the seat on turn may take (a declare is always listed: under 66 it is a losing one). */
export function legalActions(state: Deal2State): Action[] {
  if (state.result) return [];
  const seat = state.turn;
  const actions: Action[] = legalPlays(state, seat).map((card) => ({ type: 'play', card }));
  if (canExchange(state, seat)) actions.push({ type: 'exchange' });
  if (canClose(state, seat)) actions.push({ type: 'close' });
  for (const suit of marriageOptions(state, seat)) actions.push({ type: 'marriage', suit });
  actions.push({ type: 'declare' });
  if (canSnapszer(state, seat)) actions.push({ type: 'snapszer' });
  if (canKontra(state, seat)) actions.push({ type: 'kontra' });
  return actions;
}

const withLog = (state: Deal2State, ...entries: LogEntry[]): readonly LogEntry[] => [...state.log, ...entries];

const setHand = (hands: Deal2State['hands'], seat: Seat2, hand: readonly HCard[]): Deal2State['hands'] =>
  seat === 0 ? [hand, hands[1]] : [hands[0], hand];

const finish = (state: Deal2State, result: Deal2State['result']): Deal2State =>
  result ? { ...state, result, log: withLog(state, { type: 'over', result }) } : state;

function playCard(state: Deal2State, card: HCard): Deal2State {
  const seat = state.turn;
  if (!legalPlays(state, seat).some((c) => sameCard(c, card))) throw new Error('Illegal card');
  let hands = setHand(state.hands, seat, state.hands[seat].filter((c) => !sameCard(c, card)));
  const played: PlayedCard = { seat, card };
  const log: LogEntry = { type: 'play', seat, card };
  if (state.trick.length === 0) {
    return { ...state, hands, trick: [played], turn: other(seat), mustLead: null, log: withLog(state, log) };
  }
  const cards = [state.trick[0], played] as const;
  const winner = trickWinner(cards, state.trump);
  const done: Trick = { leader: state.leader, cards, winner };
  let talon = state.talon;
  let trumpCard = state.trumpCard;
  if (isTalonOpen(state)) {
    const stock = trumpCard ? [...talon, trumpCard] : [...talon];
    const [first, second] = stock;
    hands = setHand(hands, winner, [...hands[winner], first]);
    if (second) hands = setHand(hands, other(winner), [...hands[other(winner)], second]);
    talon = talon.slice(Math.min(2, talon.length));
    if (talon.length === 0 && stock.length <= 2) trumpCard = null;
  }
  const next: Deal2State = {
    ...state,
    hands,
    talon,
    trumpCard,
    trick: [],
    tricks: [...state.tricks, done],
    turn: winner,
    leader: winner,
    log: withLog(state, log, { type: 'trick', index: state.tricks.length, winner }),
  };
  return finish(next, resolveAfterTrick(next));
}

/** Applies `action` for the seat on turn; throws on anything illegal. Never mutates `state`. */
export function applyAction(state: Deal2State, action: Action): Deal2State {
  if (state.result) throw new Error('The deal is over');
  const seat = state.turn;
  switch (action.type) {
    case 'play':
      return playCard(state, action.card);
    case 'exchange': {
      if (!canExchange(state, seat) || !state.trumpCard) throw new Error('Cannot exchange now');
      const also = state.hands[seat].find((c) => c.suit === state.trump && c.rank === 'also') as HCard;
      const hand = [...state.hands[seat].filter((c) => !sameCard(c, also)), state.trumpCard];
      return { ...state, hands: setHand(state.hands, seat, hand), trumpCard: also, log: withLog(state, { type: 'exchange', seat }) };
    }
    case 'close':
      if (!canClose(state, seat)) throw new Error('Cannot close now');
      return { ...state, closed: { by: seat, atTrick: state.tricks.length }, log: withLog(state, { type: 'close', seat }) };
    case 'marriage': {
      if (!marriageOptions(state, seat).includes(action.suit)) throw new Error('Cannot announce this marriage');
      const pts = action.suit === state.trump ? MARRIAGE_POINTS.trump : MARRIAGE_POINTS.plain;
      return {
        ...state,
        marriages: [...state.marriages, { seat, suit: action.suit, points: pts }],
        mustLead: action.suit,
        log: withLog(state, { type: 'marriage', seat, suit: action.suit, points: pts }),
      };
    }
    case 'declare': {
      const result = resolveDeclare(state, seat);
      return finish({ ...state, log: withLog(state, { type: 'declare', seat, points: points(state, seat) }) }, result);
    }
    case 'snapszer':
      if (!canSnapszer(state, seat)) throw new Error('Cannot announce snapszer now');
      return {
        ...state,
        snapszer: { by: seat, defenderPlayed: playedCount(state, other(seat)) },
        log: withLog(state, { type: 'snapszer', seat }),
      };
    case 'kontra': {
      const on = kontraTarget(state, seat);
      if (!on) throw new Error('Cannot say kontra now');
      const kontra = on === 'game' ? { ...state.kontra, game: seat } : { ...state.kontra, snapszer: seat };
      return { ...state, kontra, log: withLog(state, { type: 'kontra', seat, on }) };
    }
  }
}
