import { createDeck, mulberry32, shuffle } from './deck';
import type { Deal2State, Options, Seat, Seat2 } from './types';

export const other = (seat: Seat2): Seat2 => (seat === 0 ? 1 : 0);

/** Narrows a seat to the two-player seats; seat 2 does not exist in a two-player deal. */
export function seat2(seat: Seat): Seat2 {
  if (seat === 2) throw new Error('Seat 2 does not play in a two-player deal');
  return seat;
}

/**
 * Drawing goes in pairs and the last pair takes the last face-down card and the turned-up trump, so the face-down
 * talon above the trump must be odd (9 with 20 cards, 13 with the nines). Throws otherwise.
 */
export function assertDrawableTalon(faceDown: number): void {
  if (faceDown % 2 !== 1) throw new Error(`The talon above the trump must be odd, got ${faceDown}`);
}

/**
 * Shuffles with the seed and deals as at the table: 3 to the dealer's opponent, 3 to the dealer, one card turned
 * up for trump, then 2 and 2; the rest lies face down on the trump (index 0 = top). The dealer's opponent leads.
 * `dealer` defaults to seat 1, so seat 0 leads the first deal; the match alternates it.
 */
export function deal2(seed: number, opts: Options, dealer: Seat = 1): Deal2State {
  if (opts.mode !== 'two') throw new Error('deal2 is the two-player deal');
  const d = seat2(dealer);
  const first = other(d);
  const deck = shuffle(createDeck(opts), mulberry32(seed));
  const firstHand = [...deck.slice(0, 3), ...deck.slice(7, 9)];
  const dealerHand = [...deck.slice(3, 6), ...deck.slice(9, 11)];
  const trumpCard = deck[6];
  assertDrawableTalon(deck.length - 11);
  const hands = (first === 0 ? [firstHand, dealerHand] : [dealerHand, firstHand]) as [typeof firstHand, typeof firstHand];
  return {
    mode: 'two',
    opts,
    seed,
    dealer: d,
    trump: trumpCard.suit,
    trumpCard,
    talon: deck.slice(11),
    hands,
    turn: first,
    leader: first,
    trick: [],
    tricks: [],
    marriages: [],
    mustLead: null,
    closed: null,
    snapszer: null,
    kontra: { game: null, snapszer: null },
    result: null,
    log: [{ type: 'deal', dealer: d, trumpCard }],
  };
}
