import { describe, expect, it } from 'vitest';
import { c, build, trick } from './__tests__/helpers';
import { deal2 } from './deal';
import { applyAction, legalPlays } from './play';
import {
  CLOSE_FAILED_UNITS, DECLARE_THRESHOLD, SNAPSZER_UNITS, WRONG_DECLARE_UNITS, dealResult, dealUnits, points, trickPoints,
} from './scoring';
import type { Deal2State, Trick } from './types';

/** Seat 0: 78 trick points in four tricks. */
const WIN78: Trick[] = [trick(0, 'pA', 'tX'), trick(0, 'tA', 'zX'), trick(0, 'zA', 'mX'), trick(0, 'mA', 'tK')];
/** Seat 1 tricks: 14 + 7 + 6 + 5 = 32, then + 4 = 36. */
const OPP32: Trick[] = [trick(1, 'pX', 'zK'), trick(1, 'pK', 'mF'), trick(1, 'tF', 'zF'), trick(1, 'pF', 'pU')];
/** 14 + 7 + 6 + 4 + 2 (with a nine) = 33. */
const OPP33: Trick[] = [trick(1, 'pX', 'zK'), trick(1, 'pK', 'mF'), trick(1, 'tF', 'zF'), trick(1, 'mU', 'tU'), trick(1, 'pU', 'p9')];

const declare = (s: Deal2State) => dealResult(applyAction(s, { type: 'declare' }));
const play = (s: Deal2State, code: string) => applyAction(s, { type: 'play', card: c(code) });

describe('constants', () => {
  it('66 to declare, snapszer 6, a wrong declare costs 2', () => {
    expect(DECLARE_THRESHOLD).toBe(66);
    expect(SNAPSZER_UNITS).toBe(6);
    expect(WRONG_DECLARE_UNITS).toBe(2);
    expect(CLOSE_FAILED_UNITS).toBe(1); // controller ruling: the wiki gives the opponent 1
  });
});

describe('dealUnits', () => {
  it('1 unit; 2 if the loser has under 33 („maccs”); 3 if the loser took no trick („csendes snapszer”)', () => {
    expect(dealUnits(33, true)).toBe(1);
    expect(dealUnits(60, true)).toBe(1);
    expect(dealUnits(32, true)).toBe(2);
    expect(dealUnits(0, true)).toBe(2);
    expect(dealUnits(0, false)).toBe(3);
  });
});

describe('points', () => {
  it('trick points plus marriages once a trick is won', () => {
    const s = build({ tricks: WIN78, marriages: [{ seat: 0, suit: 'tok', points: 20 }, { seat: 1, suit: 'zold', points: 20 }] });
    expect(trickPoints(s, 0)).toBe(78);
    expect(points(s, 0)).toBe(98);
    expect(points(s, 1)).toBe(0);
  });
});

describe('declare („Elég!” / „Kész!”)', () => {
  it('at ≥ 66: the declarer wins, 1 unit when the opponent has 33 or more', () => {
    expect(declare(build({ tricks: [...WIN78, ...OPP33] }))).toEqual({ winner: 0, units: 1, reason: 'declared' });
  });
  it('2 units when the opponent has under 33', () => {
    expect(declare(build({ tricks: [...WIN78, ...OPP32] }))).toEqual({ winner: 0, units: 2, reason: 'declared' });
  });
  it('3 units when the opponent took no trick', () => {
    expect(declare(build({ tricks: WIN78 }))).toEqual({ winner: 0, units: 3, reason: 'declared' });
  });
  it('the opponent’s marriage counts toward its 33 once it has a trick', () => {
    const s = build({ tricks: [...WIN78, ...OPP32], marriages: [{ seat: 1, suit: 'zold', points: 20 }] });
    expect(declare(s).units).toBe(1);
  });
  it('a 20 can bring the declarer to 66 on the spot', () => {
    let s = build({ hand0: 'tK tF zU', tricks: [trick(0, 'pA', 'tX'), trick(0, 'tA', 'zX'), trick(0, 'mA', 'mX')] });
    expect(points(s, 0)).toBe(63);
    s = applyAction(s, { type: 'marriage', suit: 'tok' });
    expect(points(s, 0)).toBe(83);
    expect(declare(s)).toEqual({ winner: 0, units: 3, reason: 'declared' });
  });
  it('a wrong declare (under 66) gives the opponent the deal with 2 units', () => {
    expect(declare(build({ tricks: [trick(0, 'pA', 'tX'), ...OPP32] }))).toEqual({ winner: 1, units: 2, reason: 'declared' });
  });
  it('the opponent may declare too once it reaches 66 (on its turn)', () => {
    const s = build({ turn: 1, leader: 1, tricks: [...OPP32, trick(1, 'tA', 'zA'), trick(1, 'mA', 'mX')] });
    expect(points(s, 1)).toBe(75);
    expect(declare(s)).toEqual({ winner: 1, units: 3, reason: 'declared' });
  });
});

describe('last trick', () => {
  it('when nobody declares, the winner of the last trick wins the deal', () => {
    for (const seed of [1, 2, 3, 4, 5, 6, 7, 8]) {
      let s = deal2(seed, { mode: 'two', withNines: false });
      while (!s.result) s = applyAction(s, { type: 'play', card: legalPlays(s, s.turn)[0] });
      expect(s.tricks).toHaveLength(10);
      const r = dealResult(s);
      expect(r.reason).toBe('lastTrick');
      expect(r.winner).toBe(s.tricks[9].winner);
      expect([1, 2, 3]).toContain(r.units);
    }
  });
  it('units follow the loser’s points', () => {
    const s = build({ hand0: 'pA', hand1: 'tU', talonCodes: '', trumpCode: null, trump: 'piros', tricks: [...WIN78.slice(0, 2), ...OPP33] });
    const r = dealResult(play(play(s, 'pA'), 'tU'));
    expect(r).toEqual({ winner: 0, units: 1, reason: 'lastTrick' });
  });
  it('dealResult throws while the deal is running', () => {
    expect(() => dealResult(build({}))).toThrow();
  });
});

describe('close failed', () => {
  it('the closer does not reach 66 by the last trick → the opponent scores', () => {
    let s = build({ hand0: 'tU', hand1: 'tA', closed: { by: 0, atTrick: 3 }, tricks: [trick(0, 'pA', 'tX'), ...OPP32.slice(0, 2)] });
    s = play(play(s, 'tU'), 'tA');
    expect(dealResult(s)).toEqual({ winner: 1, units: CLOSE_FAILED_UNITS, reason: 'closeFailed' });
  });
  it('the closer’s opponent declares 66 first → close failed', () => {
    const s = build({ turn: 1, leader: 1, closed: { by: 0, atTrick: 1 }, tricks: [...OPP32, trick(1, 'tA', 'zA'), trick(1, 'mA', 'mX')] });
    expect(declare(s)).toEqual({ winner: 1, units: CLOSE_FAILED_UNITS, reason: 'closeFailed' });
  });
  it('the closer reaching 66 and declaring wins as usual', () => {
    const s = build({ closed: { by: 0, atTrick: 2 }, tricks: [...WIN78, ...OPP32] });
    expect(declare(s)).toEqual({ winner: 0, units: 2, reason: 'declared' });
  });
  it('the closer with 66 at the last trick wins even without declaring', () => {
    let s = build({ hand0: 'pK', hand1: 'tU', closed: { by: 0, atTrick: 3 }, tricks: [...WIN78, ...OPP33] });
    s = play(play(s, 'pK'), 'tU');
    expect(dealResult(s)).toEqual({ winner: 0, units: 1, reason: 'declared' });
  });
});

describe('snapszer', () => {
  it('may be announced in the first round only, by either player, once', () => {
    let s = deal2(4, { mode: 'two', withNines: false });
    expect(applyAction(s, { type: 'snapszer' }).snapszer?.by).toBe(0);
    s = applyAction(s, { type: 'play', card: s.hands[0][0] });
    const follower = applyAction(s, { type: 'snapszer' });
    expect(follower.snapszer?.by).toBe(1);
    expect(() => applyAction(applyAction(deal2(4, { mode: 'two', withNines: false }), { type: 'snapszer' }), { type: 'snapszer' })).toThrow();
    const afterFirst = build({ tricks: [trick(0, 'pA', 'tX')] });
    expect(() => applyAction(afterFirst, { type: 'snapszer' })).toThrow();
  });
  it('success: 66 with the opponent trickless → 6 units', () => {
    const s = build({ tricks: WIN78, snapszer: { by: 0, defenderPlayed: 0 } });
    expect(declare(s)).toEqual({ winner: 0, units: SNAPSZER_UNITS, reason: 'snapszer' });
  });
  it('success also when the announcer simply takes every trick', () => {
    let s = build({ hand0: 'pA', hand1: 'tU', talonCodes: '', trumpCode: null, trump: 'piros', tricks: WIN78.slice(0, 2), snapszer: { by: 0, defenderPlayed: 0 } });
    s = play(play(s, 'pA'), 'tU');
    expect(dealResult(s)).toEqual({ winner: 0, units: 6, reason: 'snapszer' });
  });
  it('failure: the defender takes a trick → 6 units to the defender at once', () => {
    let s = build({ hand0: 'tU zA', hand1: 'tA mU', snapszer: { by: 0, defenderPlayed: 0 } });
    s = play(play(s, 'tU'), 'tA');
    expect(dealResult(s)).toEqual({ winner: 1, units: 6, reason: 'snapszerFailed' });
  });
  it('failure: the announcer declares under 66', () => {
    const s = build({ tricks: [trick(0, 'pA', 'tX')], snapszer: { by: 0, defenderPlayed: 0 } });
    expect(declare(s)).toEqual({ winner: 1, units: 6, reason: 'snapszerFailed' });
  });
});

describe('kontra', () => {
  it('doubles the deal', () => {
    let s = applyAction(build({ hand0: 'tU zA', hand1: 'tA mU' }), { type: 'kontra' });
    expect(s.kontra.game).toBe(0);
    s = { ...s, tricks: WIN78 };
    expect(declare(s)).toEqual({ winner: 0, units: 6, reason: 'declared' });
    expect(declare(build({ tricks: [trick(0, 'pA', 'tX')], kontra: { game: 1, snapszer: null } }))).toEqual({ winner: 1, units: 4, reason: 'declared' });
  });
  it('doubles a failed close', () => {
    const s = build({ turn: 1, leader: 1, closed: { by: 0, atTrick: 1 }, kontra: { game: 0, snapszer: null }, tricks: [...OPP32, trick(1, 'tA', 'zA'), trick(1, 'mA', 'mX')] });
    expect(declare(s).units).toBe(CLOSE_FAILED_UNITS * 2);
  });
  it('the opponent may double a snapszer: 12 either way', () => {
    let s = build({ hand0: 'tU zA', hand1: 'tA mU', tricks: [] });
    s = applyAction(s, { type: 'snapszer' });
    s = play(s, 'tU');
    expect(s.turn).toBe(1);
    s = applyAction(s, { type: 'kontra' });
    expect(s.kontra.snapszer).toBe(1);
    s = play(s, 'tA');
    expect(dealResult(s)).toEqual({ winner: 1, units: 12, reason: 'snapszerFailed' });
    expect(declare(build({ tricks: WIN78, snapszer: { by: 0, defenderPlayed: 0 }, kontra: { game: null, snapszer: 1 } })).units).toBe(12);
  });
  it('once per deal, before the doubler plays its first card; a game kontra does not multiply a snapszer', () => {
    let s = deal2(2, { mode: 'two', withNines: false });
    s = applyAction(s, { type: 'kontra' });
    expect(() => applyAction(s, { type: 'kontra' })).toThrow();
    s = applyAction(s, { type: 'play', card: s.hands[0][0] });
    expect(() => applyAction(s, { type: 'kontra' })).toThrow();
    const late = build({ tricks: [trick(0, 'pA', 'tX')] });
    expect(() => applyAction(late, { type: 'kontra' })).toThrow();
    const both = build({ tricks: WIN78, snapszer: { by: 0, defenderPlayed: 0 }, kontra: { game: 1, snapszer: null } });
    expect(declare(both).units).toBe(6);
  });
});
