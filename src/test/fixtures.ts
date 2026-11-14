/** Test fixtures: real matches driven to a wanted moment (the "human" is a medium bot). Not part of the bundle. */
import { act as rtlAct } from '@testing-library/react';
import { chooseAction, type Level } from '../bots';
import { mulberry32, type SnapszerMode } from '../engine';
import { act, botStep, isBotTurn, nextDeal, startMatch, type Match } from '../game/match';
import { loadMatch, saveMatch } from '../game/save';

export type FindOptions = { mode?: SnapszerMode; withNines?: boolean; level?: Level; maxSeed?: number };

/** One step of the match: a bot, the medium "human", or the next deal. */
export function step(m: Match): Match {
  if (m.phase === 'dealOver') return nextDeal(m);
  if (isBotTurn(m)) return botStep(m);
  return act(m, chooseAction(m.deal, 0, 'medium', mulberry32(m.deal.log.length + m.dealNo * 97)));
}

/** The first state (over seeds, then moves) where `pred` holds. */
export function findMatch(pred: (m: Match) => boolean, o: FindOptions = {}): Match {
  for (let seed = 1; seed <= (o.maxSeed ?? 300); seed += 1) {
    let m = startMatch({ mode: o.mode ?? 'two', withNines: o.withNines ?? false, level: o.level ?? 'medium', seed });
    for (let guard = 0; guard < 600 && m.phase !== 'finished'; guard += 1) {
      if (pred(m)) return JSON.parse(JSON.stringify(m)) as Match;
      m = step(m);
    }
  }
  throw new Error('No match matches');
}

export const humanTurn = (m: Match): boolean => m.phase === 'playing' && m.deal.turn === 0 && !m.deal.result;

export function save(m: Match, seconds = 12): void {
  saveMatch(m, seconds);
}

/** The live match through the autosave (page hide flushes it at once). */
export function savedMatch(): Match | null {
  rtlAct(() => void window.dispatchEvent(new Event('pagehide')));
  return loadMatch()?.match ?? null;
}
