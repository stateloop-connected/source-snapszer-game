import type { Action, Action3, Deal2State, Deal3State, Seat } from '../engine';
import type { AnyDeal, Level, Rng } from './common';
import { easy2, easy3 } from './easy';
import { hard2, hard3 } from './hard';
import { medium2, medium3 } from './medium';

export { LEVELS, isLevel, type Level } from './common';
export { HARD_DEADLINE_MS, HARD_ROLLOUTS } from './hard';

/**
 * One bot decision for `seat`, which must be on turn (the caller while the trump is being named). Pure apart from
 * the RNG passed in, so seeded games and saves replay exactly. Bots look only at what the seat can see: its own
 * hand and the table; the hard bot samples the unseen cards. Every level declares „Elég!” as soon as it really
 * has 66 (never a losing declare) and exchanges when the turned-up trump is worth it.
 */
export function chooseAction(state: Deal2State, seat: Seat, level: Level, rng: Rng): Action;
export function chooseAction(state: Deal3State, seat: Seat, level: Level, rng: Rng): Action3;
export function chooseAction(state: AnyDeal, seat: Seat, level: Level, rng: Rng): Action | Action3;
export function chooseAction(state: AnyDeal, seat: Seat, level: Level, rng: Rng): Action | Action3 {
  if (state.result) throw new Error('The deal is over');
  if (state.turn !== seat) throw new Error('Not this seat’s turn');
  if (state.mode === 'two') {
    if (level === 'easy') return easy2(state, rng);
    return level === 'medium' ? medium2(state) : hard2(state, rng);
  }
  if (level === 'easy') return easy3(state, rng);
  return level === 'medium' ? medium3(state) : hard3(state, rng);
}
