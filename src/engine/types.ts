import type { HCard, HSuit } from '../arcade/hungarian/cards';

export type SnapszerMode = 'two' | 'three';
export type Options = { mode: SnapszerMode; withNines: boolean };

/** Seats: 0 is the human; 1 (and 2 in three-player mode) are the computer opponents. */
export type Seat = 0 | 1 | 2;
/** The seats of a two-player deal. */
export type Seat2 = 0 | 1;

export type Action =
  | { readonly type: 'play'; readonly card: HCard }
  /** Swap the trump Alsó in hand for the turned-up trump under the talon. */
  | { readonly type: 'exchange' }
  /** Betakarás: close the talon; no more drawing, strict following from now on. */
  | { readonly type: 'close' }
  /** Announce 20 (40 in trump) with the K and F of `suit`; the K or F must be led next. */
  | { readonly type: 'marriage'; readonly suit: HSuit }
  /** „Elég!” / „Kész!”: claim 66 and end the deal. */
  | { readonly type: 'declare' }
  /** Announce snapszer: 66 without the opponent taking a single trick. */
  | { readonly type: 'snapszer' }
  /** Double the deal (or the snapszer announcement). */
  | { readonly type: 'kontra' };

export type ResultReason = 'declared' | 'lastTrick' | 'closeFailed' | 'snapszer' | 'snapszerFailed';

export interface DealResult {
  readonly winner: Seat;
  /** Units won by `winner`, kontra already applied. */
  readonly units: number;
  readonly reason: ResultReason;
}

export interface PlayedCard {
  readonly seat: Seat2;
  readonly card: HCard;
}

export interface Trick {
  readonly leader: Seat2;
  readonly cards: readonly [PlayedCard, PlayedCard];
  readonly winner: Seat2;
}

export interface Marriage {
  readonly seat: Seat2;
  readonly suit: HSuit;
  /** 40 = K + F of trump, 20 = K + F of another suit. */
  readonly points: 20 | 40;
}

export interface Closed {
  readonly by: Seat2;
  /** Number of completed tricks when the talon was closed. */
  readonly atTrick: number;
}

export interface SnapszerCall {
  readonly by: Seat2;
  /** How many cards the defender had played when the snapszer was announced (kontra window). */
  readonly defenderPlayed: number;
}

export interface Kontra {
  /** Who doubled the deal, or null. */
  readonly game: Seat2 | null;
  /** Who doubled the snapszer announcement, or null. */
  readonly snapszer: Seat2 | null;
}

export type LogEntry =
  | { readonly type: 'deal'; readonly dealer: Seat2; readonly trumpCard: HCard }
  | { readonly type: 'play'; readonly seat: Seat2; readonly card: HCard }
  | { readonly type: 'trick'; readonly index: number; readonly winner: Seat2 }
  | { readonly type: 'exchange'; readonly seat: Seat2 }
  | { readonly type: 'close'; readonly seat: Seat2 }
  | { readonly type: 'marriage'; readonly seat: Seat2; readonly suit: HSuit; readonly points: 20 | 40 }
  | { readonly type: 'declare'; readonly seat: Seat2; readonly points: number }
  | { readonly type: 'snapszer'; readonly seat: Seat2 }
  | { readonly type: 'kontra'; readonly seat: Seat2; readonly on: 'game' | 'snapszer' }
  | { readonly type: 'over'; readonly result: DealResult };

export interface Deal2State {
  readonly mode: 'two';
  readonly opts: Options;
  readonly seed: number;
  readonly dealer: Seat2;
  readonly trump: HSuit;
  /** The turned-up trump under the talon; null once it has been drawn. Stays (dead) when the talon is closed. */
  readonly trumpCard: HCard | null;
  /** Face-down talon above the trump, index 0 = top (drawn first). */
  readonly talon: readonly HCard[];
  readonly hands: readonly [readonly HCard[], readonly HCard[]];
  /** The seat that acts next (leads, follows, or announces). */
  readonly turn: Seat2;
  /** The current trick's leader. */
  readonly leader: Seat2;
  /** Cards of the current, unfinished trick (0 or 1). */
  readonly trick: readonly PlayedCard[];
  readonly tricks: readonly Trick[];
  readonly marriages: readonly Marriage[];
  /** After a marriage the leader must lead the K or F of this suit. */
  readonly mustLead: HSuit | null;
  readonly closed: Closed | null;
  readonly snapszer: SnapszerCall | null;
  readonly kontra: Kontra;
  readonly result: DealResult | null;
  readonly log: readonly LogEntry[];
}
