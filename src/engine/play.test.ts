import { describe, expect, it } from 'vitest';
import type { HCard } from '../arcade/hungarian/cards';
import { c, cs, build, trick } from './__tests__/helpers';
import { cardKey, mulberry32 } from './deck';
import { deal2 } from './deal';
import {
  applyAction, canClose, canDeclare, canDeclareWin, canExchange, canKontra, canSnapszer, isTalonOpen, legalActions, legalPlays,
  marriageOptions, trickWinner,
} from './play';
import { points } from './scoring';
import type { Deal2State } from './types';

const keys = (cards: readonly HCard[]) => cards.map(cardKey).sort();
const play = (s: Deal2State, code: string) => applyAction(s, { type: 'play', card: c(code) });

describe('trickWinner', () => {
  it('higher card of the led suit wins, trump beats, an off-suit card loses', () => {
    expect(trickWinner([{ seat: 0, card: c('tK') }, { seat: 1, card: c('tX') }], 'piros')).toBe(1);
    expect(trickWinner([{ seat: 0, card: c('tA') }, { seat: 1, card: c('tX') }], 'piros')).toBe(0);
    expect(trickWinner([{ seat: 0, card: c('tA') }, { seat: 1, card: c('pU') }], 'piros')).toBe(1);
    expect(trickWinner([{ seat: 1, card: c('tU') }, { seat: 0, card: c('zA') }], 'piros')).toBe(1);
    expect(trickWinner([{ seat: 1, card: c('pK') }, { seat: 0, card: c('pX') }], 'piros')).toBe(0);
  });
});

describe('open talon: free play', () => {
  it('the follower may play any card while the talon is open', () => {
    const s = play(build({ hand0: 'tK pA', hand1: 'tA tF pX zA mU' }), 'tK');
    expect(isTalonOpen(s)).toBe(true);
    expect(keys(legalPlays(s, 1))).toEqual(keys(cs('tA tF pX zA mU')));
  });
  it('the leader may lead any card; the seat not on turn has no plays', () => {
    const s = build({});
    expect(legalPlays(s, 0)).toHaveLength(5);
    expect(legalPlays(s, 1)).toEqual([]);
  });
  it('after a trick the winner draws the top talon card first, the loser the next; the winner leads', () => {
    let s = build({ hand0: 'tK pA', hand1: 'tA zU', talonCodes: 'mA mX zA zX' });
    s = play(s, 'tK');
    s = play(s, 'tA');
    expect(s.tricks).toHaveLength(1);
    expect(s.tricks[0].winner).toBe(1);
    expect(keys(s.hands[1])).toEqual(keys(cs('zU mA')));
    expect(keys(s.hands[0])).toEqual(keys(cs('pA mX')));
    expect(s.talon).toEqual(cs('zA zX'));
    expect(s.turn).toBe(1);
    expect(s.leader).toBe(1);
  });
  it('with one talon card left the winner takes it and the loser takes the turned-up trump', () => {
    let s = build({ hand0: 'tK pA', hand1: 'tA zU', talonCodes: 'mA', trumpCode: 'pU' });
    s = play(play(s, 'tK'), 'tA');
    expect(keys(s.hands[1])).toEqual(keys(cs('zU mA')));
    expect(keys(s.hands[0])).toEqual(keys(cs('pA pU')));
    expect(s.trumpCard).toBeNull();
    expect(s.trump).toBe('piros');
    expect(isTalonOpen(s)).toBe(false);
  });
});

describe('closed or empty talon: follow, beat, else trump, else any', () => {
  const closed = (hand1: string, lead = 'tK', trumpCode = 'p9') =>
    play(build({ hand0: `${lead} mA`, hand1, closed: { by: 0, atTrick: 0 }, trumpCode }), lead);
  it('must follow suit and beat when possible', () => {
    expect(keys(legalPlays(closed('tA tF pX zA mU'), 1))).toEqual(keys(cs('tA')));
    expect(keys(legalPlays(closed('tA tX tF pX'), 1))).toEqual(keys(cs('tA tX')));
  });
  it('must follow suit even when it cannot beat', () => {
    expect(keys(legalPlays(closed('tF tU pX zA'), 1))).toEqual(keys(cs('tF tU')));
  });
  it('without the suit it must trump', () => {
    expect(keys(legalPlays(closed('pX pU zA mU'), 1))).toEqual(keys(cs('pX pU')));
  });
  it('without suit and trump any card', () => {
    expect(keys(legalPlays(closed('zA mU zF'), 1))).toEqual(keys(cs('zA mU zF')));
  });
  it('a trump lead must be followed and beaten with trump', () => {
    expect(keys(legalPlays(closed('pA pU zA', 'pX'), 1))).toEqual(keys(cs('pA')));
    expect(keys(legalPlays(closed('pU zA', 'pX'), 1))).toEqual(keys(cs('pU')));
  });
  it('the same strict rules once the talon is used up', () => {
    let s = build({ hand0: 'tK mA', hand1: 'tA tF pX', talonCodes: '', trumpCode: null, trump: 'piros' });
    expect(isTalonOpen(s)).toBe(false);
    s = play(s, 'tK');
    expect(keys(legalPlays(s, 1))).toEqual(keys(cs('tA')));
  });
  it('an illegal card throws', () => {
    expect(() => play(closed('tA tF pX zA mU'), 'pX')).toThrow();
  });
  it('a closed talon is never drawn from', () => {
    let s = build({ hand0: 'tK mA', hand1: 'tA zU', closed: { by: 0, atTrick: 0 } });
    const talon = s.talon;
    s = play(play(s, 'tK'), 'tA');
    expect(s.talon).toEqual(talon);
    expect(s.hands.map((h) => h.length)).toEqual([1, 1]);
  });
});

describe('exchange (trump Alsó for the turned-up trump)', () => {
  const base = { trumpCode: 'pA', hand0: 'pU tK tF zU mA', hand1: 'pK pF zK zF mU' };
  it('allowed for the leader holding the trump Alsó with ≥ 3 talon cards above the trump', () => {
    const s = build({ ...base, talonCodes: 'tA tX zA' });
    expect(canExchange(s, 0)).toBe(true);
    const t = applyAction(s, { type: 'exchange' });
    expect(keys(t.hands[0])).toEqual(keys(cs('pA tK tF zU mA')));
    expect(t.trumpCard).toEqual(c('pU'));
    expect(t.trump).toBe('piros');
    expect(t.turn).toBe(0);
  });
  it('forbidden with only 2 talon cards above the trump', () => {
    expect(canExchange(build({ ...base, talonCodes: 'tA tX' }), 0)).toBe(false);
  });
  it('forbidden when it is not your turn, or you are following', () => {
    const s = build({ ...base, hand1: 'pU pK zK zF mU', hand0: 'tK tF zU mA zA' });
    expect(canExchange(s, 1)).toBe(false);
    const followed = play(s, 'tK');
    expect(followed.turn).toBe(1);
    expect(canExchange(followed, 1)).toBe(false);
  });
  it('forbidden once the talon is closed, and without the trump Alsó', () => {
    expect(canExchange(build({ ...base, closed: { by: 1, atTrick: 0 } }), 0)).toBe(false);
    expect(canExchange(build({ ...base, hand0: 'tU tK tF zU mA' }), 0)).toBe(false);
  });
  it('a forbidden exchange throws', () => {
    expect(() => applyAction(build({ ...base, talonCodes: 'tA' }), { type: 'exchange' })).toThrow();
  });
});

describe('close (betakarás)', () => {
  it('allowed on your lead with ≥ 3 talon cards above the trump, forbidden otherwise', () => {
    expect(canClose(build({ talonCodes: 'tA tX zA' }), 0)).toBe(true);
    expect(canClose(build({ talonCodes: 'tA tX' }), 0)).toBe(false);
    expect(canClose(build({}), 1)).toBe(false);
    expect(canClose(build({ closed: { by: 0, atTrick: 0 } }), 0)).toBe(false);
    expect(canClose(play(build({ hand0: 'tK mA' }), 'tK'), 1)).toBe(false);
  });
  it('closing marks the closer, then following becomes strict', () => {
    let s = build({ hand0: 'tK mA', hand1: 'tA tF pX' });
    s = applyAction(s, { type: 'close' });
    expect(s.closed).toEqual({ by: 0, atTrick: 0 });
    expect(isTalonOpen(s)).toBe(false);
    expect(canExchange(s, 0)).toBe(false);
    s = play(s, 'tK');
    expect(keys(legalPlays(s, 1))).toEqual(keys(cs('tA')));
  });
});

describe('marriages (20 / 40)', () => {
  it('20 in a plain suit, 40 in trump; only the leader may announce', () => {
    const s = build({ hand0: 'tK tF pK pF zU', hand1: 'zK zF mU mA mX' });
    expect(marriageOptions(s, 0).sort()).toEqual(['piros', 'tok']);
    expect(marriageOptions(s, 1)).toEqual([]);
    expect(applyAction(s, { type: 'marriage', suit: 'tok' }).marriages).toEqual([{ seat: 0, suit: 'tok', points: 20 }]);
    expect(applyAction(s, { type: 'marriage', suit: 'piros' }).marriages).toEqual([{ seat: 0, suit: 'piros', points: 40 }]);
    const followed = play(s, 'zU');
    expect(marriageOptions(followed, 1)).toEqual([]);
  });
  it('one marriage per turn, then the K or F of that suit must be led', () => {
    const s = applyAction(build({ hand0: 'tK tF pK pF zU' }), { type: 'marriage', suit: 'tok' });
    expect(s.mustLead).toBe('tok');
    expect(marriageOptions(s, 0)).toEqual([]);
    expect(keys(legalPlays(s, 0))).toEqual(keys(cs('tK tF')));
    expect(() => applyAction(s, { type: 'marriage', suit: 'piros' })).toThrow();
    expect(() => play(s, 'zU')).toThrow();
    expect(play(s, 'tF').mustLead).toBeNull();
  });
  it('is not counted before the announcer has won a trick, counted after', () => {
    let s = build({ hand0: 'tK tF zU', hand1: 'zA mU', talonCodes: 'mA mX' });
    s = applyAction(s, { type: 'marriage', suit: 'tok' });
    expect(points(s, 0)).toBe(0);
    s = play(s, 'tK');
    s = play(s, 'mU');
    expect(s.tricks[0].winner).toBe(0);
    expect(points(s, 0)).toBe(20 + 4 + 2);
  });
  it('without the K + F pair there is nothing to announce', () => {
    expect(() => applyAction(build({ hand0: 'tK zF pA pX zU' }), { type: 'marriage', suit: 'tok' })).toThrow();
  });
});

describe('turn-bound announcements', () => {
  it('declare, snapszer and kontra only for the seat on turn', () => {
    const s = build({});
    expect(canDeclare(s, 0)).toBe(true);
    expect(canDeclare(s, 1)).toBe(false);
    expect(canSnapszer(s, 1)).toBe(false);
    expect(canKontra(s, 1)).toBe(false);
    expect(canSnapszer(s, 0)).toBe(true);
    expect(canKontra(s, 0)).toBe(true);
  });
});

describe('canDeclareWin (no losing „Elég!” by accident)', () => {
  const win = [trick(0, 'pA', 'tX'), trick(0, 'tA', 'zX'), trick(0, 'zA', 'mX'), trick(0, 'mA', 'tK')];
  it('true only for the seat on turn with ≥ 66 counted points', () => {
    expect(canDeclareWin(build({ tricks: win }), 0)).toBe(true);
    expect(canDeclareWin(build({ tricks: win.slice(0, 3) }), 0)).toBe(false);
    expect(canDeclareWin(build({ tricks: win, turn: 1 }), 0)).toBe(false);
  });
  it('a marriage without a won trick does not count', () => {
    const s = build({ tricks: [trick(1, 'pA', 'tX')], marriages: [{ seat: 0, suit: 'piros', points: 40 }, { seat: 0, suit: 'tok', points: 20 }, { seat: 0, suit: 'zold', points: 20 }] });
    expect(canDeclareWin(s, 0)).toBe(false);
  });
  it('the losing declare stays legal', () => {
    const s = build({});
    expect(canDeclareWin(s, 0)).toBe(false);
    expect(canDeclare(s, 0)).toBe(true);
    expect(legalActions(s)).toContainEqual({ type: 'declare' });
  });
});

describe('random legal play (seeded)', () => {
  it('300 deals: legalActions never throw, cards are conserved, every deal ends with a result', () => {
    for (let seed = 1; seed <= 300; seed++) {
      const rng = mulberry32(seed);
      let s = deal2(seed, { mode: 'two', withNines: seed % 2 === 0 }, (seed % 2) as 0 | 1);
      const total = seed % 2 === 0 ? 24 : 20;
      for (let step = 0; step < 200 && !s.result; step++) {
        const actions = legalActions(s);
        expect(actions.length).toBeGreaterThan(0);
        const plays = actions.filter((a) => a.type === 'play');
        const pick = rng() < 0.85 && plays.length > 0 ? plays : actions.filter((a) => a.type !== 'declare' || points(s, s.turn) >= 66 || rng() < 0.05);
        s = applyAction(s, pick[Math.floor(rng() * pick.length)] ?? plays[0]);
        const cards = [...s.hands[0], ...s.hands[1], ...s.talon, ...(s.trumpCard ? [s.trumpCard] : []), ...s.trick.map((p) => p.card), ...s.tricks.flatMap((t) => t.cards.map((p) => p.card))];
        expect(new Set(cards.map(cardKey)).size).toBe(total);
        expect(cards).toHaveLength(total);
      }
      expect(s.result).not.toBeNull();
      expect(legalActions(s)).toEqual([]);
    }
  });
  it('actions never mutate the previous state', () => {
    const s = deal2(9, { mode: 'two', withNines: false });
    const before = JSON.stringify(s);
    applyAction(s, legalActions(s)[0]);
    applyAction(s, { type: 'kontra' });
    expect(JSON.stringify(s)).toBe(before);
  });
  it('a finished deal accepts no further action', () => {
    const s = applyAction(build({}), { type: 'declare' });
    expect(s.result).not.toBeNull();
    expect(() => play(s, 'pA')).toThrow();
  });
  it('trick helper sanity', () => {
    expect(trick(1, 'pA', 'tX', 0).cards[1].seat).toBe(1);
  });
});
