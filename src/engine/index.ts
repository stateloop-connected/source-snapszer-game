/**
 * Snapszer rules engine — pure, immutable functions (no React), after Hungarian Wikipedia „Snapszer”.
 *
 * Two-player deal:
 *   deal2(seed, opts, dealer = 1)  3 + turn-up trump + 2 each, talon face down on the trump; the dealer's opponent leads
 *   legalActions(state)            everything the seat on turn may do; applyAction(state, action) applies it
 *   dealResult(state)              { winner, units (kontra applied), reason } once state.result is set
 *
 * Rulings where the wiki is silent or ambiguous:
 *   - Exchange and closing only on your lead (before leading a card), with ≥ 3 face-down cards above the trump;
 *     allowed before the first trick too. The exchange uses the trump Alsó also when the nines are in.
 *   - 20 / 40 only on your lead, one per turn, then that K or F must be led; announced before your first won trick
 *     it counts as soon as you win one (never if you win none).
 *   - „Elég!” may be said by the seat on turn at any time; under 66 the opponent wins 2 units.
 *   - Closed talon: if the closer's opponent declares 66 first, or the closer is under 66 after the last trick,
 *     the opponent scores CLOSE_FAILED_UNITS (1, the wiki's table). A closer with 66 after the last trick wins
 *     without declaring; deal units use the loser's final points.
 *   - Open or used-up talon, nobody declared: the last trick wins, units by the loser's points (1 / 2 / 3).
 *   - Snapszer: during the first trick, by the seat on turn before it plays its first card; once per deal. The play
 *     rules do not change. It fails the moment the defender takes a trick; it succeeds on a declare at 66 or when
 *     the announcer takes every trick. A declare by the defender during a snapszer gives the announcer the 6.
 *   - Kontra on the deal: once per deal, by either seat on its turn before it plays its first card (×2).
 *     Kontra on a snapszer: by the defender before its next card after the announcement (×2). A snapszer replaces
 *     the deal value, so a deal kontra does not multiply it. No rekontra.
 *   - Five cards each also with the nines (24 cards: talon 13).
 */
export type {
  Action, Closed, Deal2State, DealResult, Kontra, LogEntry, Marriage, Options, PlayedCard, ResultReason, Seat, Seat2,
  SnapszerCall, SnapszerMode, Trick,
} from './types';
export { SNAPSZER_RANKS, cardKey, cardPoints, createDeck, mulberry32, rankStrength, sameCard, shuffle } from './deck';
export { deal2, other, seat2 } from './deal';
export {
  MIN_TALON_FOR_EXCHANGE, applyAction, canClose, canDeclare, canExchange, canKontra, canSnapszer, isTalonOpen,
  legalActions, legalPlays, marriageOptions, playedCount, trickWinner,
} from './play';
export {
  CLOSE_FAILED_UNITS, DECLARE_THRESHOLD, KONTRA_FACTOR, MACCS_THRESHOLD, MACCS_UNITS, NO_TRICK_UNITS, SNAPSZER_UNITS,
  WIN_UNITS, WRONG_DECLARE_UNITS, dealResult, dealUnits, hasTrick, isDealOver, marriagePoints, points, trickPoints,
} from './scoring';
