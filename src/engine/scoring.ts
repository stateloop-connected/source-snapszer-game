import { cardPoints } from './deck';
import { other, seat2 } from './deal';
import type { Deal2State, DealResult, Seat, Seat2 } from './types';

/** „Elég!” / „Kész!” needs 66 points. */
export const DECLARE_THRESHOLD = 66;
/** Below 33 the loser is „maccs” (2 units). */
export const MACCS_THRESHOLD = 33;
export const WIN_UNITS = 1;
export const MACCS_UNITS = 2;
/** The loser took no trick („csendes snapszer”). */
export const NO_TRICK_UNITS = 3;
/** Hungarian Wikipedia: „ha az, aki takart, nem éri el a 66-ot, az ellenfélnek 1”. */
export const CLOSE_FAILED_UNITS = 1;
export const SNAPSZER_UNITS = 6;
/** Ruling: a declare under 66 gives the opponent the deal with 2 units (the wiki is silent). */
export const WRONG_DECLARE_UNITS = 2;
export const KONTRA_FACTOR = 2;
/** 20 for the K + F of a plain suit, 40 in trump. */
export const MARRIAGE_POINTS = { plain: 20, trump: 40 } as const;

export const hasTrick = (state: Deal2State, seat: Seat): boolean => state.tricks.some((t) => t.winner === seat);

/** Card points of the tricks `seat` has won. */
export function trickPoints(state: Deal2State, seat: Seat): number {
  const s = seat2(seat);
  return state.tricks.filter((t) => t.winner === s).reduce((n, t) => n + cardPoints(t.cards[0].card) + cardPoints(t.cards[1].card), 0);
}

/** Announced 20s and 40s of `seat`, counted or not. */
export const marriagePoints = (state: Deal2State, seat: Seat): number =>
  state.marriages.filter((m) => m.seat === seat).reduce((n, m) => n + m.points, 0);

/** Points that count: tricks, plus marriages only once `seat` has won a trick. */
export const points = (state: Deal2State, seat: Seat): number =>
  trickPoints(state, seat) + (hasTrick(state, seat) ? marriagePoints(state, seat) : 0);

/** 1 unit; 2 if the loser has under 33 („maccs”); 3 if the loser took no trick („csendes snapszer”). */
export function dealUnits(loserPoints: number, loserHasTrick: boolean): number {
  if (!loserHasTrick) return NO_TRICK_UNITS;
  return loserPoints < MACCS_THRESHOLD ? MACCS_UNITS : WIN_UNITS;
}

const gameFactor = (state: Deal2State) => (state.kontra.game === null ? 1 : KONTRA_FACTOR);
const snapszerFactor = (state: Deal2State) => (state.kontra.snapszer === null ? 1 : KONTRA_FACTOR);

const won = (state: Deal2State, winner: Seat2): DealResult => {
  const loser = other(winner);
  return { winner, units: dealUnits(points(state, loser), hasTrick(state, loser)) * gameFactor(state), reason: 'declared' };
};
const snapszerWon = (state: Deal2State, winner: Seat2): DealResult => ({
  winner,
  units: SNAPSZER_UNITS * snapszerFactor(state),
  reason: 'snapszer',
});
const snapszerLost = (state: Deal2State, winner: Seat2): DealResult => ({
  winner,
  units: SNAPSZER_UNITS * snapszerFactor(state),
  reason: 'snapszerFailed',
});
const closeFailed = (state: Deal2State, winner: Seat2): DealResult => ({
  winner,
  units: CLOSE_FAILED_UNITS * gameFactor(state),
  reason: 'closeFailed',
});

/** The result of `seat` saying „Elég!” now. */
export function resolveDeclare(state: Deal2State, seat: Seat2): DealResult {
  const opp = other(seat);
  const enough = points(state, seat) >= DECLARE_THRESHOLD;
  if (state.snapszer) {
    if (state.snapszer.by !== seat) return snapszerWon(state, opp); // ruling: the trickless defender cannot have 66
    return enough ? snapszerWon(state, seat) : snapszerLost(state, opp);
  }
  if (!enough) return { winner: opp, units: WRONG_DECLARE_UNITS * gameFactor(state), reason: 'declared' };
  if (state.closed && state.closed.by !== seat) return closeFailed(state, seat);
  return won(state, seat);
}

/** Called after every completed trick: an early end (failed snapszer) or the end of the cards, else null. */
export function resolveAfterTrick(state: Deal2State): DealResult | null {
  const last = state.tricks[state.tricks.length - 1];
  if (state.snapszer && last && last.winner !== state.snapszer.by) return snapszerLost(state, last.winner);
  if (state.hands[0].length > 0 || state.hands[1].length > 0) return null;
  if (state.snapszer) return snapszerWon(state, state.snapszer.by);
  if (state.closed) {
    const closer = state.closed.by;
    return points(state, closer) >= DECLARE_THRESHOLD ? won(state, closer) : closeFailed(state, other(closer));
  }
  const loser = other(last.winner);
  return { winner: last.winner, units: dealUnits(points(state, loser), hasTrick(state, loser)) * gameFactor(state), reason: 'lastTrick' };
}

export const isDealOver = (state: Deal2State): boolean => state.result !== null;

/** Winner, units (kontra applied) and why; throws while the deal is still running. */
export function dealResult(state: Deal2State): DealResult {
  if (!state.result) throw new Error('The deal is not over yet');
  return state.result;
}
