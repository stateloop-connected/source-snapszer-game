import { describe, expect, it } from 'vitest';
import { build, build3, c, cs, trick, trick3 } from '../engine/__tests__/helpers';
import {
  applyAction, applyAction3, canDeclareWin, canDeclareWin3, deal2, deal3, legalActions, legalActions3, mulberry32,
  type Action, type Action3, type Deal2State, type Deal3State, type Seat,
} from '../engine';
import { HARD_DEADLINE_MS, LEVELS, chooseAction, isLevel, type Level } from '.';
import { BOLD_MIN_SAMPLES, sampleCount } from './hard';

const key = (a: Action | Action3) => JSON.stringify(a);

/** Plays one deal with the given levels per seat, checking every bot action against the engine. */
function checkDeal2(seed: number, levels: readonly Level[], withNines: boolean): Deal2State {
  let s = deal2(seed, { mode: 'two', withNines }, (seed % 2) as Seat);
  const rng = mulberry32(seed);
  for (let step = 0; !s.result; step++) {
    if (step > 80) throw new Error('deal did not end');
    const a = chooseAction(s, s.turn, levels[s.turn], rng);
    expect(legalActions(s).map(key)).toContain(key(a));
    if (a.type === 'declare') expect(canDeclareWin(s, s.turn)).toBe(true);
    s = applyAction(s, a);
  }
  return s;
}

function checkDeal3(seed: number, levels: readonly Level[]): Deal3State {
  let s = deal3(seed, { mode: 'three', withNines: true }, (seed % 3) as Seat);
  const rng = mulberry32(seed);
  for (let step = 0; !s.result; step++) {
    if (step > 80) throw new Error('deal did not end');
    const a = chooseAction(s, s.turn, levels[s.turn], rng);
    expect(legalActions3(s).map(key)).toContain(key(a));
    if (a.type === 'declare') expect(canDeclareWin3(s, s.turn)).toBe(true);
    s = applyAction3(s, a);
  }
  return s;
}

const MIXES: readonly (readonly Level[])[] = [
  ['easy', 'medium', 'hard'],
  ['medium', 'hard', 'easy'],
  ['hard', 'easy', 'medium'],
  ['hard', 'hard', 'hard'],
  ['easy', 'easy', 'easy'],
  ['medium', 'medium', 'medium'],
];

describe('levels', () => {
  it('easy / medium / hard', () => {
    expect(LEVELS).toEqual(['easy', 'medium', 'hard']);
    expect(isLevel('hard')).toBe(true);
    expect(isLevel('expert')).toBe(false);
  });
});

describe('bots only take legal actions (and never a losing „Elég!”)', () => {
  it('two players: 200 seeded deals, every level in every seat, with and without the nines', () => {
    for (let seed = 1; seed <= 200; seed++) checkDeal2(seed, MIXES[seed % MIXES.length], seed % 4 === 0);
  }, 120_000);
  it('three players: 200 seeded deals, every level in every seat', () => {
    for (let seed = 1; seed <= 200; seed++) checkDeal3(seed, MIXES[seed % MIXES.length]);
  }, 120_000);
  it('refuses to act for a seat that is not on turn', () => {
    const s = deal2(1, { mode: 'two', withNines: false });
    expect(() => chooseAction(s, 1, 'easy', mulberry32(1))).toThrow();
  });
});

describe('declare, exchange, marriage', () => {
  // Seat 0 has won 56 points and holds the 20 in tök: announcing it takes seat 0 to 76.
  const rich = build({
    hand0: 'tK tF zU mU pA',
    hand1: 'pK pF zF tA tX',
    trumpCode: 'pU',
    talonCodes: 'tU mK mF',
    tricks: [trick(0, 'zA', 'zX'), trick(0, 'mA', 'mX'), trick(0, 'pX', 'zK')],
  });

  it.each(LEVELS)('%s declares „Elég!” as soon as it has 66', (level) => {
    const s = build({ trumpCode: 'pU', talonCodes: 'tU mK mF', tricks: [trick(0, 'zA', 'zX'), trick(0, 'mA', 'mX'), trick(0, 'tA', 'tX')] }); // 63
    const t = { ...s, marriages: [{ seat: 0 as const, suit: 'zold' as const, points: 20 as const }] };
    expect(canDeclareWin(t, 0)).toBe(true);
    expect(chooseAction(t, 0, level, mulberry32(1))).toEqual({ type: 'declare' });
    // Following, too (the follower may say it on its turn).
    const f: Deal2State = { ...t, hands: [t.hands[0], cs('pK pF zK zF')], turn: 0, leader: 1, trick: [{ seat: 1, card: c('mU') }] };
    expect(chooseAction(f, 0, level, mulberry32(1))).toEqual({ type: 'declare' });
  });

  it.each(LEVELS)('%s announces a 20 that takes it to 66, then declares', (level) => {
    expect(rich.hands[0].length).toBe(5);
    const a = chooseAction(rich, 0, level, mulberry32(2));
    expect(a).toEqual({ type: 'marriage', suit: 'tok' });
    const after = applyAction(rich, a);
    expect(chooseAction(after, 0, level, mulberry32(2))).toEqual({ type: 'declare' });
  });

  it.each(LEVELS)('%s exchanges the trump Alsó for a better turned-up trump', (level) => {
    const s = build({ hand0: 'pU tA zX mK tU', trumpCode: 'pA', talonCodes: 'tX zA mA mX tK' });
    expect(chooseAction(s, 0, level, mulberry32(3))).toEqual({ type: 'exchange' });
  });

  it.each(LEVELS)('%s does not swap the Alsó for the trump nine', (level) => {
    const s = build({ opts: { mode: 'two', withNines: true }, hand0: 'pU tA zX mK tU', trumpCode: 'p9', talonCodes: 'tX zA mA mX tK' });
    expect(chooseAction(s, 0, level, mulberry32(3)).type).not.toBe('exchange');
  });

  it.each(LEVELS)('%s (three players) declares at 66 pooled for the pair', (level) => {
    const tricks = [trick3(1, 0, 'pU', 'pA', 'pX'), trick3(2, 0, 'tU', 'tX', 'tA'), trick3(1, 0, 'zU', 'zA', 'zX')];
    const s = build3({ hand0: 'mA mX', hand1: 'mK mF', hand2: 'm9 mU', tricks, turn: 1, leader: 1 });
    expect(chooseAction(s, 1, level, mulberry32(4))).toEqual({ type: 'declare' });
  });
});

describe('no 20 / 40 after the own snapszer announcement', () => {
  it.each(LEVELS)('%s (two players) leads instead of announcing a marriage during its snapszer', (level) => {
    const s = build({ hand0: 'tK tF pA pX zA', hand1: 'pK pF zK zF mU', trumpCode: 'pU', talonCodes: 'tU mK mF tA tX zX mA mX', snapszer: { by: 0, defenderPlayed: 0 } });
    expect(chooseAction(s, 0, level, mulberry32(5)).type).not.toBe('marriage');
  });
  it.each(LEVELS)('%s (three players) leads instead of announcing a marriage during its snapszer', (level) => {
    const s = build3({ hand0: 'tK tF pA pX zA mA mX pK', hand1: 'zK zF zX z9 tA tX t9 tU', hand2: 'm9 mU mK mF p9 pU pF zU', snapszer: true });
    expect(chooseAction(s, 0, level, mulberry32(5)).type).not.toBe('marriage');
  });
});

describe('three players: trump and fold', () => {
  it.each(LEVELS)('%s names the trump with one of its first four cards', (level) => {
    for (let seed = 1; seed <= 20; seed++) {
      const s = deal3(seed, { mode: 'three', withNines: true }, 2);
      const a = chooseAction(s, 0, level, mulberry32(seed));
      expect(a.type).toBe('trump');
      expect(s.hands[0].map((x) => JSON.stringify(x))).toContain(JSON.stringify((a as { card: unknown }).card));
    }
  });
  it('medium and hard name the suit they are longest and strongest in', () => {
    const s = { ...deal3(1, { mode: 'three', withNines: true }, 2), hands: [cs('zA zX zK mU'), cs('pA pX pK pF'), cs('tA tX tK tF')] as Deal3State['hands'] };
    for (const level of ['medium', 'hard'] as const) {
      const a = chooseAction(s, 0, level, mulberry32(1));
      expect(a.type === 'trump' && a.card.suit).toBe('zold');
    }
  });
});

describe('hard: sampling of the unseen cards', () => {
  it('does not peek: the same view gives the same decision whatever the hidden cards are', () => {
    for (let seed = 1; seed <= 12; seed++) {
      let s = deal2(seed, { mode: 'two', withNines: false });
      const rng = mulberry32(seed);
      for (let k = 0; k < 3 && !s.result; k++) s = applyAction(s, chooseAction(s, s.turn, 'medium', rng));
      if (s.result) continue;
      const me = s.turn;
      const opp = (1 - me) as 0 | 1;
      // Swap the opponent's hand with the talon (same unseen set, different layout).
      const pool = [...s.hands[opp], ...s.talon].reverse();
      const hands = (me === 0 ? [s.hands[0], pool.slice(0, s.hands[opp].length)] : [pool.slice(0, s.hands[opp].length), s.hands[1]]) as Deal2State['hands'];
      const t: Deal2State = { ...s, hands, talon: pool.slice(s.hands[opp].length) };
      expect(chooseAction(t, me, 'hard', mulberry32(99))).toEqual(chooseAction(s, me, 'hard', mulberry32(99)));
    }
  });

  it(`bold candidates (kontra, snapszer, close) get at least ${BOLD_MIN_SAMPLES} samples`, () => {
    const plain = [{ type: 'play' }, { type: 'play' }, { type: 'play' }, { type: 'play' }, { type: 'play' }];
    expect(sampleCount(plain, 20)).toBeLessThan(BOLD_MIN_SAMPLES);
    for (const bold of ['kontra', 'snapszer', 'close'] as const) {
      expect(sampleCount([...plain, { type: bold }], 20)).toBeGreaterThanOrEqual(BOLD_MIN_SAMPLES);
    }
  });

  it(`decides within ${HARD_DEADLINE_MS} ms < 150 ms (two and three players)`, () => {
    expect(HARD_DEADLINE_MS).toBeLessThan(150);
    let worst = 0;
    const time = (f: () => void) => {
      const t0 = performance.now();
      f();
      worst = Math.max(worst, performance.now() - t0);
    };
    for (let seed = 1; seed <= 10; seed++) {
      let s2 = deal2(seed, { mode: 'two', withNines: seed % 2 === 0 });
      const rng = mulberry32(seed);
      while (!s2.result) {
        let a: Action = { type: 'declare' };
        time(() => (a = chooseAction(s2, s2.turn, 'hard', rng)));
        s2 = applyAction(s2, a);
      }
      let s3 = deal3(seed, { mode: 'three', withNines: true }, (seed % 3) as Seat);
      while (!s3.result) {
        let a: Action3 = { type: 'declare' };
        time(() => (a = chooseAction(s3, s3.turn, 'hard', rng)));
        s3 = applyAction3(s3, a);
      }
    }
    expect(worst).toBeLessThan(150);
  }, 60_000);
});
