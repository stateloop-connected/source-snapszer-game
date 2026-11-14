import { describe, expect, it } from 'vitest';
import { chooseAction } from '../bots';
import { mulberry32, type Seat } from '../engine';
import {
  TARGET_UNITS, act, dealerFor, isBotTurn, matchOutcome, nextDeal, playBotMatch, runBots, startMatch, type Match,
} from './match';

/** The "human" in tests: a medium bot deciding for seat 0. */
const humanMove = (m: Match): Match => act(m, chooseAction(m.deal, 0, 'medium', mulberry32(m.deal.log.length * 7 + m.dealNo)));

function playMatch(start: Match): Match[] {
  const states: Match[] = [];
  let m = start;
  for (let guard = 0; m.phase !== 'finished'; guard++) {
    if (guard > 2000) throw new Error('The match did not finish');
    states.push(m);
    if (m.phase === 'dealOver') m = nextDeal(m);
    else if (isBotTurn(m)) m = runBots(m);
    else m = humanMove(m);
  }
  states.push(m);
  return states;
}

const sum = (m: Match, seat: Seat) => m.deals.reduce((n, d) => n + d.units[seat], 0);

describe('match („rádli” to 7 units)', () => {
  it('two players: the human at seat 0, the dealer alternates, seat 0 leads the first deal', () => {
    const m = startMatch({ mode: 'two', withNines: false, level: 'easy', seed: 4 });
    expect(m.seats).toEqual(['human', 'easy']);
    expect(m.units).toEqual({ 0: 0, 1: 0, 2: 0 });
    expect(m.deal.mode).toBe('two');
    expect(m.deal.dealer).toBe(1);
    expect(m.deal.turn).toBe(0);
    expect([1, 2, 3, 4].map((n) => dealerFor(m, n))).toEqual([1, 0, 1, 0]);
  });

  it('three players: two bots, the deal and so the caller rotate, the human calls first', () => {
    const m = startMatch({ mode: 'three', withNines: false, level: 'medium', seed: 4 });
    expect(m.seats).toEqual(['human', 'medium', 'medium']);
    expect(m.withNines).toBe(true);
    expect(m.deal.mode === 'three' && m.deal.caller).toBe(0);
    expect([1, 2, 3, 4].map((n) => dealerFor(m, n))).toEqual([2, 0, 1, 2]);
  });

  it.each([
    ['two', false],
    ['two', true],
    ['three', true],
  ] as const)('%s players (nines %s): ends as soon as a seat has ≥ 7 units; units add up', (mode, withNines) => {
    for (const seed of [1, 2, 3]) {
      const states = playMatch(startMatch({ mode, withNines, level: 'easy', seed }));
      const end = states[states.length - 1];
      const seats = (mode === 'two' ? [0, 1] : [0, 1, 2]) as Seat[];
      expect(Math.max(...seats.map((s) => end.units[s]))).toBeGreaterThanOrEqual(TARGET_UNITS);
      for (const s of [0, 1, 2] as Seat[]) expect(end.units[s]).toBe(sum(end, s));
      // Before the last deal nobody had 7.
      const last = end.deals[end.deals.length - 1];
      expect(Math.max(...seats.map((s) => end.units[s] - last.units[s]))).toBeLessThan(TARGET_UNITS);
      expect(end.deals.map((d) => d.dealer)).toEqual(end.deals.map((_, i) => dealerFor(end, i + 1)));
      expect(end.deals.map((d) => d.dealNo)).toEqual(end.deals.map((_, i) => i + 1));
      if (mode === 'two') expect(end.units[2]).toBe(0);
      expect(['win', 'draw', 'loss']).toContain(matchOutcome(end));
      expect(() => nextDeal(end)).toThrow();
      expect(() => humanMove(end)).toThrow();
    }
  });

  it('nothing moves out of turn: act refuses a bot’s turn, nextDeal refuses a running deal', () => {
    let m = startMatch({ mode: 'two', withNines: false, level: 'hard', seed: 9 });
    expect(() => nextDeal(m)).toThrow();
    m = humanMove(m);
    while (!isBotTurn(m) && m.phase === 'playing') m = humanMove(m);
    if (m.phase === 'playing') expect(() => act(m, { type: 'declare' })).toThrow();
  });

  it('bots replay exactly from the saved state (the bot RNG comes from the match)', () => {
    const a = playMatch(startMatch({ mode: 'two', withNines: false, level: 'medium', seed: 21 }));
    const b = playMatch(JSON.parse(JSON.stringify(startMatch({ mode: 'two', withNines: false, level: 'medium', seed: 21 }))));
    expect(JSON.stringify(b[b.length - 1])).toBe(JSON.stringify(a[a.length - 1]));
  });

  it('matchOutcome: strictly on top wins, level with the best opponent is a draw', () => {
    const m = startMatch({ mode: 'three', withNines: true, level: 'easy', seed: 1 });
    expect(matchOutcome({ ...m, units: { 0: 7, 1: 3, 2: 5 } })).toBe('win');
    expect(matchOutcome({ ...m, units: { 0: 7, 1: 7, 2: 5 } })).toBe('draw');
    expect(matchOutcome({ ...m, units: { 0: 2, 1: 7, 2: 5 } })).toBe('loss');
  });

  it('playBotMatch fills every seat with bots and finishes', () => {
    const end = playBotMatch(['hard', 'easy'], { mode: 'two', withNines: false, seed: 5 });
    expect(end.phase).toBe('finished');
    expect(end.seats).toEqual(['hard', 'easy']);
  });
});
