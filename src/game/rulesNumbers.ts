import type { Level } from '../bots';
import { DEAL_FIRST, DEAL_SECOND, cardPoints, createDeck } from '../engine';
import { TARGET_UNITS } from './match';
import { matchScore } from './score';

/** Deck facts, all taken from the engine. */
export const DECK = (() => {
  const two = createDeck({ mode: 'two', withNines: false });
  const nines = createDeck({ mode: 'two', withNines: true });
  const three = createDeck({ mode: 'three', withNines: true });
  const hand = DEAL_FIRST + DEAL_SECOND;
  return {
    cards: two.length,
    nines: nines.length,
    hand,
    talon: two.length - 2 * hand - 1,
    talonNines: nines.length - 2 * hand - 1,
    three: three.length,
    hand3: three.length / 3,
    total: two.reduce((n, c) => n + cardPoints(c), 0),
  };
})();

/** Worked example for the rules: a 7–3 win at Medium (the score helper itself does the sum). */
export const EXAMPLE = { you: TARGET_UNITS, opp: 3, level: 'medium' as Level };
export const exampleScore = (): number =>
  matchScore({ mode: 'two', level: EXAMPLE.level, units: { 0: EXAMPLE.you, 1: EXAMPLE.opp, 2: 0 } }, true);

/** What Finish ranks right at the start of a match: nothing is completed yet. */
export const startScore = (): number => matchScore({ mode: 'two', level: 'hard', units: { 0: 0, 1: 0, 2: 0 } }, false);
