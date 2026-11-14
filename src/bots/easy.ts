import { legalPlays, legalPlays3, type Action, type Action3, type Deal2State, type Deal3State } from '../engine';
import { freeAction2, freeAction3, pick, type Rng } from './common';

/*
 * Easy: a random legal card. It still takes what no player would leave on the table — „Elég!” at 66, a useful
 * exchange, a 20 / 40 — but never closes, never announces snapszer, never says kontra and never folds.
 */

export function easy2(state: Deal2State, rng: Rng): Action {
  const free = freeAction2(state, state.turn);
  if (free) return free;
  return { type: 'play', card: pick(legalPlays(state, state.turn), rng) };
}

export function easy3(state: Deal3State, rng: Rng): Action3 {
  if (state.phase === 'trump') return { type: 'trump', card: pick(state.hands[state.caller], rng) };
  const free = freeAction3(state, state.turn);
  if (free) return free;
  return { type: 'play', card: pick(legalPlays3(state, state.turn), rng) };
}
