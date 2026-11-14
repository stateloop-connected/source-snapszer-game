import { loadSession, saveSession, type ArcadeGameId } from '../arcade';
import { isLevel } from '../bots';
import {
  applyAction, applyAction3, callerOf,
  type Action, type Action3, type Deal2State, type Deal3State, type LogEntry, type LogEntry3, type Seat,
} from '../engine';
import { TARGET_UNITS, dealSeed, dealUnits, dealerFor, newDeal, type AnyDeal, type DealSummary, type Match } from './match';
import { matchScore } from './score';

/** Persisted shape version (bump on incompatible changes; older saves are then discarded). */
export const SAVE_SCHEMA = 1;
export const SAVE_GAME_ID: ArcadeGameId = 'snapszer';

type Rec = Record<string, unknown>;
const isObj = (v: unknown): v is Rec => typeof v === 'object' && v !== null && !Array.isArray(v);
const isNat = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v) && v >= 0;
const isSeat = (v: unknown): v is Seat => v === 0 || v === 1 || v === 2;
const SEATS: readonly Seat[] = [0, 1, 2];

function isUnits(v: unknown): v is Record<Seat, number> {
  return isObj(v) && Object.keys(v).sort().join() === '0,1,2' && SEATS.every((s) => isNat(v[s]));
}

/** The action a log entry records, or null for the entries the engine writes itself (deal, trick, over). */
function actionOf(e: LogEntry | LogEntry3): Action | Action3 | null {
  switch (e.type) {
    case 'play':
      return { type: 'play', card: e.card };
    case 'trump':
      return { type: 'trump', card: e.card };
    case 'marriage':
      return { type: 'marriage', suit: e.suit };
    case 'exchange':
    case 'close':
    case 'declare':
    case 'snapszer':
    case 'kontra':
    case 'fold':
      return { type: e.type };
    default:
      return null;
  }
}

/**
 * The saved deal must be exactly what replaying its log from the seeded deal gives: this checks every card, hand,
 * the talon, points, announcements and the result at once (and that every recorded action was legal).
 */
function replays(m: Pick<Match, 'mode' | 'withNines' | 'seed' | 'firstDealer'>, dealNo: number, saved: unknown): saved is AnyDeal {
  if (!isObj(saved) || !Array.isArray(saved.log) || !saved.log.every((e) => isObj(e) && typeof e.type === 'string')) return false;
  try {
    let deal = newDeal(m, dealNo);
    for (const e of saved.log.slice(1) as (LogEntry | LogEntry3)[]) {
      const a = actionOf(e);
      if (!a) continue;
      deal = deal.mode === 'two' ? applyAction(deal, a as Action) : applyAction3(deal, a as Action3);
    }
    return JSON.stringify(deal) === JSON.stringify(saved);
  } catch {
    return false;
  }
}

function isSummary(v: unknown, m: Pick<Match, 'mode' | 'firstDealer'>, index: number): v is DealSummary {
  if (!isObj(v) || v.dealNo !== index + 1 || v.dealer !== dealerFor(m, index + 1) || typeof v.reason !== 'string') return false;
  if (!isUnits(v.units)) return false;
  const u = v.units;
  if (m.mode === 'two') return u[2] === 0 && (u[0] > 0) !== (u[1] > 0);
  const caller = callerOf(v.dealer as Seat);
  const [d1, d2] = SEATS.filter((s) => s !== caller);
  return u[caller] > 0 ? u[d1] === 0 && u[d2] === 0 : u[d1] > 0 && u[d1] === u[d2];
}

/** Guard for a saved match: shape, a deal that replays from its seed, deal summaries and units that add up. */
export function isMatch(v: unknown): v is Match {
  if (!isObj(v) || (v.mode !== 'two' && v.mode !== 'three') || typeof v.withNines !== 'boolean' || !isLevel(v.level)) return false;
  if (v.mode === 'three' && !v.withNines) return false;
  if (!isNat(v.seed) || v.seed > 0xffffffff || !isSeat(v.firstDealer) || !isNat(v.dealNo) || v.dealNo < 1) return false;
  const n = v.mode === 'two' ? 2 : 3;
  if (v.mode === 'two' && v.firstDealer === 2) return false;
  const seats = v.seats;
  if (!Array.isArray(seats) || seats.length !== n || seats[0] !== 'human' || !seats.slice(1).every((s) => s === v.level)) return false;
  if (v.phase !== 'playing' && v.phase !== 'dealOver' && v.phase !== 'finished') return false;
  const m = v as unknown as Match;
  if (!replays(m, m.dealNo, v.deal)) return false;
  const deal = v.deal as Deal2State | Deal3State;
  if (deal.seed !== dealSeed(m.seed, m.dealNo)) return false;
  if (!Array.isArray(v.deals) || !v.deals.every((d, i) => isSummary(d, m, i))) return false;
  const deals = v.deals as DealSummary[];
  const over = deal.result !== null;
  if ((v.phase === 'playing') === over || deals.length !== (over ? m.dealNo : m.dealNo - 1)) return false;
  if (over && JSON.stringify(deals[deals.length - 1].units) !== JSON.stringify(dealUnits(deal))) return false;
  if (!isUnits(v.units) || !SEATS.every((s) => m.units[s] === deals.reduce((t, d) => t + d.units[s], 0))) return false;
  // The match ends with the first deal that takes a seat to 7.
  const reached = (k: number) => SEATS.some((s) => deals.slice(0, k).reduce((t, d) => t + d.units[s], 0) >= TARGET_UNITS);
  if (deals.some((_, i) => i < deals.length - 1 && reached(i + 1))) return false;
  return (v.phase === 'finished') === reached(deals.length);
}

/** Autosave: the match plus the run timer; the envelope's score is the finish-early score. */
export function saveMatch(match: Match, seconds: number) {
  return saveSession(SAVE_GAME_ID, { schema: SAVE_SCHEMA, data: match, seconds, score: matchScore(match, false) });
}

/** The saved match, or null (a missing, corrupt, outdated or foreign save is dropped). */
export function loadMatch(now?: number): { match: Match; seconds: number } | null {
  const env = loadSession<Match>(SAVE_GAME_ID, SAVE_SCHEMA, isMatch, now);
  return env ? { match: env.data, seconds: env.seconds } : null;
}
