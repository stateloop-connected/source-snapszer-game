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
 *   - Five cards each also with the nines (24 cards: talon 13). The talon above the trump is always odd
 *     (assertDrawableTalon), so the last pair takes the last face-down card and the trump.
 *   - canDeclareWin(state, seat): only a winning „Elég!” (≥ 66 counted); bots and the UI offer just that one.
 *
 * Three-player deal (three.ts; the caller alone against the pair):
 *   deal3(seed, opts, dealer)      24 cards, 4 + 4 each from the caller (the seat after the dealer); caller leads
 *   chooseTrump(state, card)       the caller names the trump suit from its first four, then all get the second four
 *   fold(state)                    bedobás; applyAction3 / legalActions3 / legalPlays3; dealResult3 → units per seat
 *   nextDealer3(dealer)            the deal, and so the caller, rotates every deal
 *
 * Three-player rulings (the wiki gives only the differences from the four-player game):
 *   - Strict play throughout (no talon): follow and beat the winning card, else follow; without the suit trump and
 *     over-trump if possible, else any trump; else any card (as in Ulti).
 *   - The pair pools its points (tricks of both, plus both defenders' 20 / 40 once the pair has a trick). The
 *     caller needs 66 against that; either defender on turn may declare for the pair at 66 pooled.
 *   - Units: 1 / 2 / 3 by the losing side's points and tricks (snapszer 6, wrong declare 2). The caller alone wins
 *     them, or each defender wins the same amount.
 *   - Fold: by the caller after naming the trump (holding all 8) and before its first lead and any announcement;
 *     each defender gets 2, or 4 if the caller holds an ace among the 8. Kontra cannot apply yet.
 *   - Snapszer: caller only, from hand at its first lead; fails the moment a defender takes a trick; succeeds on a
 *     declare at 66 or by taking every trick. A defender's declare during it gives the caller the 6.
 *   - Kontra chain from the four-player rules: kontra by a defender before its first card, rekontra by the caller,
 *     subkontra by a defender, each on its turn before it has played since the last raise; × 2 per step on every
 *     result, snapszer included (it is announced before any defender can kontra); never on a fold.
 *   - 20 / 40 as in two-player mode (on your lead, one per turn, the K or F led next).
 *   - Nobody declares: the last trick's side wins (units by the other side's points), as in two-player mode.
 */
export type {
  Action, Action3, Closed, Deal2State, Deal3Result, Deal3State, DealResult, Kontra, Kontra3, LogEntry, LogEntry3,
  Marriage, Marriage3, Options, Phase3, PlayedCard, PlayedCard3, ResultReason, ResultReason3, Seat, Seat2, Side,
  SnapszerCall, SnapszerMode, Trick, Trick3,
} from './types';
export { SNAPSZER_RANKS, cardKey, cardPoints, createDeck, mulberry32, rankStrength, sameCard, shuffle } from './deck';
export { DEAL_FIRST, DEAL_SECOND, assertDrawableTalon, deal2, other, seat2 } from './deal';
export {
  MIN_TALON_FOR_EXCHANGE, applyAction, canClose, canDeclare, canDeclareWin, canExchange, canKontra, canSnapszer, isTalonOpen,
  legalActions, legalPlays, marriageOptions, playedCount, trickWinner,
} from './play';
export {
  CLOSE_FAILED_UNITS, DECLARE_THRESHOLD, KONTRA_FACTOR, MACCS_THRESHOLD, MARRIAGE_POINTS, MACCS_UNITS, NO_TRICK_UNITS, SNAPSZER_UNITS,
  WIN_UNITS, WRONG_DECLARE_UNITS, dealResult, dealUnits, hasTrick, isDealOver, marriagePoints, points, trickPoints,
} from './scoring';
export {
  DEAL3_ROUND, FOLD_ACE_UNITS, FOLD_UNITS, applyAction3, callerOf, canDeclare3, canDeclareWin3, canFold3, canKontra3, canSnapszer3,
  chooseTrump, deal3, dealResult3, fold, isDealOver3, legalActions3, legalPlays3, marriageOptions3, nextDealer3,
  points3, sideHasTrick3, sideOf, sidePoints3, trickWinner3,
} from './three';
