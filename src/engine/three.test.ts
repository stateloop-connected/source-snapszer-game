import { describe, expect, it } from 'vitest';
import type { HCard } from '../arcade/hungarian/cards';
import { build3, c, trick3 } from './__tests__/helpers';
import { cardKey, createDeck, mulberry32, shuffle } from './deck';
import {
  FOLD_ACE_UNITS, FOLD_UNITS, applyAction3, callerOf, canDeclareWin3, canFold3, canKontra3, canSnapszer3, chooseTrump,
  deal3, dealResult3, fold, legalActions3, legalPlays3, marriageOptions3, nextDealer3, points3, trickWinner3,
} from './three';
import type { Deal3State, Options, Seat } from './types';

const opts3: Options = { mode: 'three', withNines: true };
const play = (s: Deal3State, code: string) => applyAction3(s, { type: 'play', card: c(code) });
const declare = (s: Deal3State) => dealResult3(applyAction3(s, { type: 'declare' }));
const keys = (cards: readonly HCard[]) => cards.map(cardKey).sort();

/** Caller (seat 0) tricks worth 25 + 25 + 21 = 71. */
const CALLER71 = [trick3(0, 0, 'pA', 'pX', 'pK'), trick3(0, 0, 'tA', 'tX', 'tK'), trick3(0, 0, 'zA', 'zX', 'z9')];
/** Defender tricks: seat 1 takes 13 + 5 = 18, seat 2 takes 17; pooled 35, each under 33 alone. */
const PAIR35 = [trick3(1, 0, 'mU', 'mA', 'm9'), trick3(2, 1, 'mK', 'mX', 'mF'), trick3(1, 1, 'tF', 'tU', 't9')];
/** Defender tricks worth 23 + 23 + 23 = 69, split between the two defenders. */
const PAIR69 = [trick3(1, 0, 'pU', 'pA', 'pX'), trick3(2, 0, 'tU', 'tX', 'tA'), trick3(1, 0, 'zU', 'zA', 'zX')];

describe('deal3', () => {
  it('24 cards (the nines are always in), 4 + 4 each; the caller is the seat after the dealer', () => {
    const s = deal3(7, { mode: 'three', withNines: false }, 0);
    expect(s.caller).toBe(1);
    expect(s.phase).toBe('trump');
    expect(s.turn).toBe(1);
    expect(s.trump).toBeNull();
    expect(s.hands.map((h) => h.length)).toEqual([4, 4, 4]);
    expect(s.pending.map((h) => h.length)).toEqual([4, 4, 4]);
    const all = [...s.hands.flat(), ...s.pending.flat()].map(cardKey);
    expect(new Set(all).size).toBe(24);
    expect(s.opts).toEqual({ mode: 'three', withNines: true });
  });
  it('deals 4 to each from the caller, then 4 more to each', () => {
    const deck = shuffle(createDeck(opts3), mulberry32(7));
    const s = deal3(7, opts3, 0); // caller 1, then 2, then 0
    expect(s.hands[1]).toEqual(deck.slice(0, 4));
    expect(s.hands[2]).toEqual(deck.slice(4, 8));
    expect(s.hands[0]).toEqual(deck.slice(8, 12));
    expect(s.pending[1]).toEqual(deck.slice(12, 16));
    expect(s.pending[2]).toEqual(deck.slice(16, 20));
    expect(s.pending[0]).toEqual(deck.slice(20, 24));
  });
  it('the caller rotates with the dealer', () => {
    expect([0, 1, 2].map((d) => deal3(1, opts3, d as Seat).caller)).toEqual([1, 2, 0]);
    expect([0, 1, 2].map((d) => callerOf(d as Seat))).toEqual([1, 2, 0]);
    expect([0, 1, 2].map((d) => nextDealer3(d as Seat))).toEqual([1, 2, 0]);
  });
  it('same seed, same deal; rejects the two-player mode', () => {
    expect(deal3(5, opts3, 2)).toEqual(deal3(5, opts3, 2));
    expect(() => deal3(5, { mode: 'two', withNines: false }, 2)).toThrow();
  });
});

describe('chooseTrump', () => {
  it('the caller names the trump suit with one of its first four cards; then everyone holds 8', () => {
    const s = deal3(7, opts3, 0);
    const card = s.hands[1][2];
    const t = chooseTrump(s, card);
    expect(t.phase).toBe('play');
    expect(t.trump).toBe(card.suit);
    expect(t.trumpCard).toEqual(card);
    expect(t.hands.map((h) => h.length)).toEqual([8, 8, 8]);
    expect(t.pending.map((h) => h.length)).toEqual([0, 0, 0]);
    expect(keys(t.hands[1])).toEqual(keys([...s.hands[1], ...s.pending[1]]));
    expect(t.turn).toBe(1);
    expect(t.leader).toBe(1);
  });
  it('not with a card of the second four, nor a defender’s card, nor twice', () => {
    const s = deal3(7, opts3, 0);
    expect(() => chooseTrump(s, s.pending[1][0])).toThrow();
    expect(() => chooseTrump(s, s.hands[2][0])).toThrow();
    const t = chooseTrump(s, s.hands[1][0]);
    expect(() => chooseTrump(t, t.hands[1][0])).toThrow();
  });
  it('is the only action in the trump phase', () => {
    const s = deal3(7, opts3, 0);
    expect(legalActions3(s)).toEqual(s.hands[1].map((card) => ({ type: 'trump', card })));
    expect(legalPlays3(s, 1)).toEqual([]);
    expect(() => applyAction3(s, { type: 'declare' })).toThrow();
  });
});

describe('fold (bedobás)', () => {
  it('no ace in the caller’s hand: each defender gets 2', () => {
    const s = build3({ hand0: 'pX tX zX mX pK tK zK mK' });
    expect(canFold3(s, 0)).toBe(true);
    expect(dealResult3(fold(s))).toEqual({ winner: 'defenders', units: { 0: 0, 1: FOLD_UNITS, 2: FOLD_UNITS }, reason: 'fold' });
    expect(FOLD_UNITS).toBe(2);
  });
  it('folding with an ace: each defender gets 4', () => {
    const s = build3({ hand0: 'pX tX zX mA pK tK zK mK' });
    expect(dealResult3(applyAction3(s, { type: 'fold' })).units).toEqual({ 0: 0, 1: FOLD_ACE_UNITS, 2: FOLD_ACE_UNITS });
    expect(FOLD_ACE_UNITS).toBe(4);
  });
  it('only by the caller, after naming the trump, before the first lead', () => {
    const s = build3({ hand0: 'pX tX zX mX' });
    expect(canFold3(s, 1)).toBe(false);
    const led = play(s, 'tX');
    expect(canFold3(led, 0)).toBe(false);
    expect(() => fold(led)).toThrow();
    const dealt = deal3(7, opts3, 0);
    expect(canFold3(dealt, 1)).toBe(false);
    expect(() => fold(dealt)).toThrow();
    expect(legalActions3(chooseTrump(dealt, dealt.hands[1][0]))).toContainEqual({ type: 'fold' });
  });
  it('is blocked after a 20 / 40 or a snapszer at the first lead', () => {
    const s = build3({ hand0: 'pK pF tX zX mX tK zK mK' });
    expect(canFold3(s, 0)).toBe(true);
    const married = applyAction3(s, { type: 'marriage', suit: 'piros' });
    expect(canFold3(married, 0)).toBe(false);
    expect(legalActions3(married)).not.toContainEqual({ type: 'fold' });
    expect(() => fold(married)).toThrow();
    const called = applyAction3(s, { type: 'snapszer' });
    expect(canFold3(called, 0)).toBe(false);
    expect(legalActions3(called)).not.toContainEqual({ type: 'fold' });
    expect(() => applyAction3(called, { type: 'fold' })).toThrow();
  });
});

describe('trickWinner3', () => {
  const cards = (a: string, b: string, d: string) => [
    { seat: 0 as Seat, card: c(a) }, { seat: 1 as Seat, card: c(b) }, { seat: 2 as Seat, card: c(d) },
  ];
  it('the highest card of the led suit, unless trumped; the highest trump wins', () => {
    expect(trickWinner3(cards('tX', 'tA', 'tK'), 'piros')).toBe(1);
    expect(trickWinner3(cards('tX', 'zA', 'mA'), 'piros')).toBe(0);
    expect(trickWinner3(cards('tA', 'p9', 'tX'), 'piros')).toBe(1);
    expect(trickWinner3(cards('tA', 'p9', 'pU'), 'piros')).toBe(2);
  });
});

describe('follow and beat; else trump; else any (there is no talon)', () => {
  const second = (hand1: string) => legalPlays3(build3({ hand1, trick: [{ seat: 0, card: c('tX') }], turn: 1 }), 1).map(cardKey);
  const third = (lead: string, mid: string, hand2: string) =>
    legalPlays3(build3({ hand2, trick: [{ seat: 0, card: c(lead) }, { seat: 1, card: c(mid) }], turn: 2 }), 2).map(cardKey);
  it('must follow and beat when it can', () => {
    expect(second('tA tF pK zA')).toEqual(['tok-asz']);
    expect(third('tF', 'tX', 'tA tK')).toEqual(['tok-asz']);
  });
  it('follows with any card of the suit when it cannot beat (also after a trump)', () => {
    expect(second('tK tF pK')).toEqual(['tok-kiraly', 'tok-felso']);
    expect(third('tX', 'pF', 'tA tK pK pA zA')).toEqual(['tok-asz', 'tok-kiraly']);
  });
  it('without the suit: trump, and over-trump when it can', () => {
    expect(second('pK pU zA')).toEqual(['piros-kiraly', 'piros-also']);
    expect(third('tX', 'pF', 'pK pU zA')).toEqual(['piros-kiraly']);
    expect(third('tX', 'pF', 'pU p9 zA')).toEqual(['piros-also', 'piros-IX']);
  });
  it('without the suit and trump: any card', () => {
    expect(second('zA mA')).toEqual(['zold-asz', 'makk-asz']);
  });
  it('an illegal card throws', () => {
    expect(() => play(build3({ hand1: 'tA tF', trick: [{ seat: 0, card: c('tX') }], turn: 1 }), 'tF')).toThrow();
  });
});

describe('declare: the caller needs 66 against the pair’s pooled points', () => {
  it('the pair pools its tricks: each under 33, together 35, so the caller wins 1', () => {
    const s = build3({ tricks: [...CALLER71, ...PAIR35] });
    expect(points3(s, 0)).toBe(71);
    expect(points3(s, 1)).toBe(35);
    expect(points3(s, 2)).toBe(35);
    expect(declare(s)).toEqual({ winner: 'caller', units: { 0: 1, 1: 0, 2: 0 }, reason: 'declared' });
  });
  it('2 when the pair has under 33, 3 when the pair took no trick', () => {
    expect(declare(build3({ tricks: [...CALLER71, ...PAIR35.slice(0, 2)] })).units).toEqual({ 0: 2, 1: 0, 2: 0 });
    expect(declare(build3({ tricks: CALLER71 })).units).toEqual({ 0: 3, 1: 0, 2: 0 });
  });
  it('a defender’s marriage counts for the pair once the pair has a trick', () => {
    const s = build3({ tricks: [...CALLER71, ...PAIR35.slice(0, 2)], marriages: [{ seat: 2, suit: 'zold', points: 20 }] });
    expect(points3(s, 1)).toBe(50);
    expect(declare(s).units).toEqual({ 0: 1, 1: 0, 2: 0 });
  });
  it('the pair declares with 66 pooled: units go to each defender', () => {
    expect(declare(build3({ tricks: PAIR69, turn: 1 }))).toEqual({ winner: 'defenders', units: { 0: 0, 1: 3, 2: 3 }, reason: 'declared' });
    const s = build3({ tricks: [...PAIR69, trick3(0, 0, 'mA', 'mX', 'mK')], turn: 2 });
    expect(declare(s).units).toEqual({ 0: 0, 1: 2, 2: 2 });
  });
  it('a declare under 66 gives the other side 2 (to each defender when the caller was wrong)', () => {
    expect(declare(build3({ tricks: CALLER71.slice(0, 2) }))).toEqual({ winner: 'defenders', units: { 0: 0, 1: 2, 2: 2 }, reason: 'declared' });
    expect(declare(build3({ tricks: PAIR35, turn: 1 }))).toEqual({ winner: 'caller', units: { 0: 2, 1: 0, 2: 0 }, reason: 'declared' });
  });
  it('canDeclareWin3 is true only with 66 counted for the seat’s side', () => {
    expect(canDeclareWin3(build3({ tricks: CALLER71 }), 0)).toBe(true);
    expect(canDeclareWin3(build3({ tricks: CALLER71.slice(0, 2) }), 0)).toBe(false);
    expect(canDeclareWin3(build3({ tricks: PAIR69, turn: 2 }), 2)).toBe(true);
    expect(canDeclareWin3(build3({ tricks: PAIR69, turn: 2 }), 1)).toBe(false); // not on turn
  });
});

describe('snapszer (caller only)', () => {
  const s0 = build3({ hand0: 'pA tA', hand1: 'pK tK', hand2: 'pF tF' });
  it('only the caller may announce it, on its first lead', () => {
    expect(canSnapszer3(s0, 0)).toBe(true);
    expect(canSnapszer3(build3({ turn: 1 }), 1)).toBe(false);
    expect(() => applyAction3(build3({ turn: 1 }), { type: 'snapszer' })).toThrow();
    expect(canSnapszer3(play(s0, 'pA'), 0)).toBe(false);
    expect(legalActions3(build3({ turn: 1 }))).not.toContainEqual({ type: 'snapszer' });
  });
  it('the caller takes every trick: 6 to the caller', () => {
    let s = applyAction3(s0, { type: 'snapszer' });
    for (const code of ['pA', 'pK', 'pF', 'tA', 'tK', 'tF']) s = play(s, code);
    expect(dealResult3(s)).toEqual({ winner: 'caller', units: { 0: 6, 1: 0, 2: 0 }, reason: 'snapszer' });
  });
  it('fails the moment a defender takes a trick: 6 to each defender', () => {
    let s = applyAction3(build3({ hand0: 'tX pA', hand1: 'tA pK', hand2: 'tK pF' }), { type: 'snapszer' });
    s = play(play(play(s, 'tX'), 'tA'), 'tK');
    expect(dealResult3(s)).toEqual({ winner: 'defenders', units: { 0: 0, 1: 6, 2: 6 }, reason: 'snapszerFailed' });
  });
  it('a declare during the snapszer: the caller at 66 wins it, under 66 loses it; a defender’s declare gives it to the caller', () => {
    const on = build3({ tricks: CALLER71, snapszer: true });
    expect(declare(on)).toEqual({ winner: 'caller', units: { 0: 6, 1: 0, 2: 0 }, reason: 'snapszer' });
    expect(declare(build3({ tricks: CALLER71.slice(0, 1), snapszer: true }))).toEqual({ winner: 'defenders', units: { 0: 0, 1: 6, 2: 6 }, reason: 'snapszerFailed' });
    expect(declare({ ...on, turn: 1 })).toEqual({ winner: 'caller', units: { 0: 6, 1: 0, 2: 0 }, reason: 'snapszer' });
  });
  it('a kontra doubles it to 12 each', () => {
    let s = applyAction3(build3({ hand0: 'tX pA', hand1: 'tA pK', hand2: 'tK pF' }), { type: 'snapszer' });
    s = applyAction3(play(s, 'tX'), { type: 'kontra' });
    s = play(play(s, 'tA'), 'tK');
    expect(dealResult3(s).units).toEqual({ 0: 0, 1: 12, 2: 12 });
  });
});

describe('kontra, rekontra, subkontra', () => {
  const s0 = build3({ hand0: 'tA pA', hand1: 'tK pK', hand2: 'tF pF' });
  it('the caller cannot open; a defender before its first card; each raise by the other side, before its next card', () => {
    expect(canKontra3(s0, 0)).toBe(false);
    let s = play(s0, 'tA');
    expect(canKontra3(s, 1)).toBe(true);
    s = applyAction3(s, { type: 'kontra' });
    expect(s.kontra.level).toBe(1);
    expect(canKontra3(s, 1)).toBe(false);
    s = play(s, 'tK');
    expect(canKontra3(s, 2)).toBe(false); // same side as the kontra
    s = play(s, 'tF');
    expect(s.turn).toBe(0);
    s = applyAction3(s, { type: 'kontra' }); // rekontra
    expect(s.kontra.level).toBe(2);
    s = play(s, 'pA');
    s = applyAction3(s, { type: 'kontra' }); // subkontra
    expect(s.kontra.level).toBe(3);
    s = play(s, 'pK');
    expect(canKontra3(s, 2)).toBe(false);
    s = play(s, 'pF');
    expect(dealResult3(s)).toEqual({ winner: 'caller', units: { 0: 24, 1: 0, 2: 0 }, reason: 'lastTrick' });
  });
  it('the window closes once the defender has played a card', () => {
    let s = play(play(s0, 'tA'), 'tK');
    expect(canKontra3(s, 2)).toBe(true);
    s = play(s, 'tF');
    s = play(s, 'pA');
    expect(canKontra3(s, 1)).toBe(false);
  });
});

describe('marriages in three-player mode', () => {
  it('on your lead with K + F; the K or F must be led next; 40 in trump', () => {
    const s = build3({ hand0: 'pK pF tA', hand1: 'tK tX zU', hand2: 'tF zA mA' });
    expect(marriageOptions3(s, 0)).toEqual(['piros']);
    const m = applyAction3(s, { type: 'marriage', suit: 'piros' });
    expect(m.marriages).toEqual([{ seat: 0, suit: 'piros', points: 40 }]);
    expect(legalPlays3(m, 0).map(cardKey)).toEqual(['piros-kiraly', 'piros-felso']);
    expect(marriageOptions3(m, 0)).toEqual([]);
  });
});

describe('the last trick wins when nobody declares', () => {
  it('units by the loser side’s points', () => {
    let s = build3({ hand0: 'tA', hand1: 'tK', hand2: 'tF', tricks: [...CALLER71.slice(0, 2), ...PAIR35] });
    s = play(play(play(s, 'tA'), 'tK'), 'tF');
    expect(dealResult3(s)).toEqual({ winner: 'caller', units: { 0: 1, 1: 0, 2: 0 }, reason: 'lastTrick' });
  });
});

describe('random legal play (seeded)', () => {
  it('300 deals: cards are conserved, every deal ends, units are well formed, the input is never mutated', () => {
    for (let seed = 1; seed <= 300; seed++) {
      const rng = mulberry32(seed * 31);
      let s = deal3(seed, opts3, (seed % 3) as Seat);
      for (let step = 0; step < 200 && !s.result; step++) {
        const acts = legalActions3(s).filter((a) => a.type !== 'declare' || canDeclareWin3(s, s.turn) || rng() < 0.02);
        const before = JSON.stringify(s);
        const next = applyAction3(s, acts[Math.floor(rng() * acts.length)]);
        expect(JSON.stringify(s)).toBe(before);
        s = next;
        const held = [...s.hands.flat(), ...s.pending.flat(), ...s.trick.map((p) => p.card), ...s.tricks.flatMap((t) => t.cards.map((p) => p.card))];
        expect(held.length).toBe(24);
        expect(new Set(held.map(cardKey)).size).toBe(24);
      }
      const r = dealResult3(s);
      const d = [0, 1, 2].filter((x) => x !== s.caller) as Seat[];
      if (r.winner === 'caller') {
        expect(r.units[s.caller]).toBeGreaterThan(0);
        expect(d.map((x) => r.units[x])).toEqual([0, 0]);
      } else {
        expect(r.units[s.caller]).toBe(0);
        expect(r.units[d[0]]).toBeGreaterThan(0);
        expect(r.units[d[1]]).toBe(r.units[d[0]]);
      }
      expect(legalActions3(s)).toEqual([]);
    }
  });
});
