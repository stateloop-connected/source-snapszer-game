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

/* ---------- Three-player mode: the caller alone against the pair of defenders ---------- */

export type Side = 'caller' | 'defenders';
export type Phase3 = 'trump' | 'play';

/** Three-player actions: no talon, so no exchange and no close; plus naming the trump and folding. */
export type Action3 =
  | Exclude<Action, { type: 'exchange' } | { type: 'close' }>
  /** The caller names the trump suit with one of its first four cards. */
  | { readonly type: 'trump'; readonly card: HCard }
  /** Bedobás: the caller throws in its hand before the first lead. */
  | { readonly type: 'fold' };

export type ResultReason3 = 'declared' | 'lastTrick' | 'snapszer' | 'snapszerFailed' | 'fold';

export interface Deal3Result {
  readonly winner: Side;
  /** Units won by each seat (kontra applied): the caller alone, or each defender the same amount. */
  readonly units: Readonly<Record<Seat, number>>;
  readonly reason: ResultReason3;
}

export interface PlayedCard3 {
  readonly seat: Seat;
  readonly card: HCard;
}

export interface Trick3 {
  readonly leader: Seat;
  readonly cards: readonly [PlayedCard3, PlayedCard3, PlayedCard3];
  readonly winner: Seat;
}

export interface Marriage3 {
  readonly seat: Seat;
  readonly suit: HSuit;
  readonly points: 20 | 40;
}

export interface Kontra3 {
  /** 0 none, 1 kontra (a defender), 2 rekontra (the caller), 3 subkontra (a defender); the deal counts × 2^level. */
  readonly level: 0 | 1 | 2 | 3;
  readonly by: Seat | null;
  /** Cards each seat had played at the last raise: the next raiser must not have played since. */
  readonly played: readonly [number, number, number];
}

export type LogEntry3 =
  | { readonly type: 'deal'; readonly dealer: Seat; readonly caller: Seat }
  | { readonly type: 'trump'; readonly seat: Seat; readonly card: HCard }
  | { readonly type: 'fold'; readonly seat: Seat }
  | { readonly type: 'play'; readonly seat: Seat; readonly card: HCard }
  | { readonly type: 'trick'; readonly index: number; readonly winner: Seat }
  | { readonly type: 'marriage'; readonly seat: Seat; readonly suit: HSuit; readonly points: 20 | 40 }
  | { readonly type: 'declare'; readonly seat: Seat; readonly points: number }
  | { readonly type: 'snapszer'; readonly seat: Seat }
  | { readonly type: 'kontra'; readonly seat: Seat; readonly level: 1 | 2 | 3 }
  | { readonly type: 'over'; readonly result: Deal3Result };

export interface Deal3State {
  readonly mode: 'three';
  readonly opts: Options;
  readonly seed: number;
  readonly dealer: Seat;
  /** The seat after the dealer: names the trump and plays alone. */
  readonly caller: Seat;
  readonly phase: Phase3;
  /** Null until the caller names it. */
  readonly trump: HSuit | null;
  /** The card the caller named the trump with (it stays in the caller's hand). */
  readonly trumpCard: HCard | null;
  readonly hands: readonly [readonly HCard[], readonly HCard[], readonly HCard[]];
  /** The second four cards of each seat, handed out once the trump is named. */
  readonly pending: readonly [readonly HCard[], readonly HCard[], readonly HCard[]];
  readonly turn: Seat;
  readonly leader: Seat;
  /** Cards of the current, unfinished trick (0–2). */
  readonly trick: readonly PlayedCard3[];
  readonly tricks: readonly Trick3[];
  readonly marriages: readonly Marriage3[];
  readonly mustLead: HSuit | null;
  /** The caller announced snapszer. */
  readonly snapszer: boolean;
  readonly kontra: Kontra3;
  readonly result: Deal3Result | null;
  readonly log: readonly LogEntry3[];
}
