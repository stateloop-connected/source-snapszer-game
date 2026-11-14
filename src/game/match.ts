import type { RunOutcome } from '../arcade/types';
import { chooseAction, type Level } from '../bots';
import {
  applyAction, applyAction3, deal2, deal3, dealResult, dealResult3, mulberry32,
  type Action, type Action3, type Deal2State, type Deal3State, type ResultReason, type ResultReason3, type Seat, type SnapszerMode,
} from '../engine';

/*
 * A match („rádli”): deals until a seat has 7 units. Two players: the human at seat 0 against one bot, the dealer
 * alternates and seat 0 leads the first deal. Three players: two bots; the deal (and so the caller) rotates and the
 * human calls first. Everything is a pure function of the match value, so a saved match resumes exactly — bots
 * included, their RNG comes from the match.
 */

export const TARGET_UNITS = 7;

export type SeatKind = 'human' | Level;
export type AnyDeal = Deal2State | Deal3State;

export interface DealSummary {
  /** 1, 2, … */
  readonly dealNo: number;
  readonly dealer: Seat;
  readonly reason: ResultReason | ResultReason3;
  /** Units each seat won in this deal (seat 2 is always 0 in two-player mode). */
  readonly units: Readonly<Record<Seat, number>>;
}

export interface Match {
  readonly mode: SnapszerMode;
  /** Two players only; three-player mode always plays with the nines. */
  readonly withNines: boolean;
  readonly level: Level;
  /** One entry per seat: the human at 0 and bots of `level` (simulations fill every seat with bots). */
  readonly seats: readonly SeatKind[];
  readonly seed: number;
  readonly firstDealer: Seat;
  readonly dealNo: number;
  readonly deal: AnyDeal;
  /** Units so far per seat. */
  readonly units: Readonly<Record<Seat, number>>;
  readonly deals: readonly DealSummary[];
  /** playing → dealOver (result shown) → next deal …; finished once a seat has 7 units. */
  readonly phase: 'playing' | 'dealOver' | 'finished';
}

const seatCount = (mode: SnapszerMode) => (mode === 'two' ? 2 : 3);

/** Dealer of deal `dealNo`: alternating in two-player mode, rotating in three-player mode. */
export const dealerFor = (m: Pick<Match, 'mode' | 'firstDealer'>, dealNo: number): Seat =>
  ((m.firstDealer + dealNo - 1) % seatCount(m.mode)) as Seat;

/** Seed of deal `dealNo` (independent shuffles, reproducible from the match seed). */
export const dealSeed = (seed: number, dealNo: number): number =>
  Math.floor(mulberry32((seed ^ Math.imul(dealNo, 0x9e3779b9)) >>> 0)() * 0x1_0000_0000) >>> 0;

/** Seat 0 leads (two players) or calls (three players) the first deal. */
export const defaultFirstDealer = (mode: SnapszerMode): Seat => (mode === 'two' ? 1 : 2);

export function newDeal(m: Pick<Match, 'mode' | 'withNines' | 'seed' | 'firstDealer'>, dealNo: number): AnyDeal {
  const dealer = dealerFor(m, dealNo);
  const seed = dealSeed(m.seed, dealNo);
  return m.mode === 'two' ? deal2(seed, { mode: 'two', withNines: m.withNines }, dealer) : deal3(seed, { mode: 'three', withNines: true }, dealer);
}

export interface StartOptions {
  mode: SnapszerMode;
  withNines: boolean;
  level: Level;
  seed: number;
  /** Only simulations fill every seat with bots. */
  seats?: readonly SeatKind[];
  firstDealer?: Seat;
}

export function startMatch(o: StartOptions): Match {
  const n = seatCount(o.mode);
  const seats = o.seats ?? ['human', ...Array.from({ length: n - 1 }, () => o.level)];
  if (seats.length !== n) throw new Error(`A ${o.mode}-player match has ${n} seats`);
  const base = {
    mode: o.mode,
    withNines: o.mode === 'three' ? true : o.withNines,
    seed: o.seed >>> 0,
    firstDealer: o.firstDealer ?? defaultFirstDealer(o.mode),
  };
  return {
    ...base,
    level: o.level,
    seats,
    dealNo: 1,
    deal: newDeal(base, 1),
    units: { 0: 0, 1: 0, 2: 0 },
    deals: [],
    phase: 'playing',
  };
}

export const isBotTurn = (m: Match): boolean => m.phase === 'playing' && m.seats[m.deal.turn] !== 'human';

/** The bots' RNG comes from the saved state only, so a resumed match makes the same bot moves. */
export const botRng = (m: Match): (() => number) =>
  mulberry32((m.seed ^ Math.imul(m.dealNo, 0x85ebca6b) ^ Math.imul(m.deal.log.length + 1, 0xc2b2ae35)) >>> 0);

/** Units per seat of a finished deal. */
export function dealUnits(deal: AnyDeal): Record<Seat, number> {
  if (deal.mode === 'three') return { ...dealResult3(deal).units };
  const r = dealResult(deal);
  const units: Record<Seat, number> = { 0: 0, 1: 0, 2: 0 };
  units[r.winner] = r.units;
  return units;
}

const step = (deal: AnyDeal, action: Action | Action3): AnyDeal =>
  deal.mode === 'two' ? applyAction(deal, action as Action) : applyAction3(deal, action as Action3);

function afterMove(m: Match, deal: AnyDeal): Match {
  if (!deal.result) return { ...m, deal };
  const won = dealUnits(deal);
  const units = { 0: m.units[0] + won[0], 1: m.units[1] + won[1], 2: m.units[2] + won[2] };
  const summary: DealSummary = { dealNo: m.dealNo, dealer: deal.dealer, reason: deal.result.reason, units: won };
  const over = Math.max(units[0], units[1], units[2]) >= TARGET_UNITS;
  return { ...m, deal, units, deals: [...m.deals, summary], phase: over ? 'finished' : 'dealOver' };
}

/** The human's action (seat 0); the engine rejects anything illegal. */
export function act(m: Match, action: Action | Action3): Match {
  if (m.phase !== 'playing') throw new Error('No deal in progress');
  if (m.seats[m.deal.turn] !== 'human') throw new Error('Not the player’s turn');
  return afterMove(m, step(m.deal, action));
}

/** The bot on turn decides and moves. */
export function botStep(m: Match): Match {
  if (!isBotTurn(m)) throw new Error('Not a bot’s turn');
  const seat = m.deal.turn;
  return afterMove(m, step(m.deal, chooseAction(m.deal, seat, m.seats[seat] as Level, botRng(m))));
}

/** Lets the bots move until it is the human's turn or the deal is over. */
export function runBots(m: Match): Match {
  let x = m;
  while (isBotTurn(x)) x = botStep(x);
  return x;
}

export function nextDeal(m: Match): Match {
  if (m.phase !== 'dealOver') throw new Error('The deal is not over (or the match is finished)');
  const dealNo = m.dealNo + 1;
  return { ...m, dealNo, deal: newDeal(m, dealNo), phase: 'playing' };
}

/** The human (seat 0) wins by finishing strictly on top; level with the best opponent is a draw. */
export function matchOutcome(m: Pick<Match, 'mode' | 'units'>): RunOutcome {
  const best = m.mode === 'two' ? m.units[1] : Math.max(m.units[1], m.units[2]);
  if (m.units[0] > best) return 'win';
  return m.units[0] === best ? 'draw' : 'loss';
}

export interface BotMatchOptions {
  mode: SnapszerMode;
  withNines: boolean;
  seed: number;
  firstDealer?: Seat;
}

/** A whole match with bots in every seat (strength simulations). */
export function playBotMatch(levels: readonly Level[], o: BotMatchOptions): Match {
  let m = startMatch({ ...o, level: levels[1], seats: levels });
  while (m.phase !== 'finished') m = m.phase === 'dealOver' ? nextDeal(m) : runBots(m);
  return m;
}
