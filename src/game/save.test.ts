import { beforeEach, describe, expect, it } from 'vitest';
import { loadSession, sessionKey } from '../arcade';
import { chooseAction } from '../bots';
import { mulberry32 } from '../engine';
import { act, isBotTurn, nextDeal, runBots, startMatch, type Match } from './match';
import { SAVE_GAME_ID, SAVE_SCHEMA, isMatch, loadMatch, saveMatch } from './save';

const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v));

/** Every state of a match whose human seat is played by the medium bot. */
function states(start: Match, limit = 400): Match[] {
  const out: Match[] = [];
  let m = start;
  while (m.phase !== 'finished' && out.length < limit) {
    out.push(m);
    if (m.phase === 'dealOver') m = nextDeal(m);
    else if (isBotTurn(m)) m = runBots(m);
    else m = act(m, chooseAction(m.deal, 0, 'medium', mulberry32(out.length)));
  }
  out.push(m);
  return out;
}

const two = states(startMatch({ mode: 'two', withNines: false, level: 'medium', seed: 12 }));
const three = states(startMatch({ mode: 'three', withNines: true, level: 'easy', seed: 12 }));

beforeEach(() => localStorage.clear());

describe('save (schema 1)', () => {
  it('every state of a two- and a three-player match passes the guard and round-trips through the session store', () => {
    expect(SAVE_SCHEMA).toBe(1);
    expect(SAVE_GAME_ID).toBe('snapszer');
    for (const m of [...two, ...three]) {
      expect(isMatch(clone(m))).toBe(true);
    }
    for (const m of [two[3], three[3], two[two.length - 1], three[three.length - 1]]) {
      expect(saveMatch(m, 42)).not.toBeNull();
      const back = loadMatch();
      expect(back?.match).toEqual(m);
      expect(back?.seconds).toBe(42);
    }
  });

  it('a fresh three-player match (trump not named yet) round-trips', () => {
    const m = startMatch({ mode: 'three', withNines: true, level: 'hard', seed: 3 });
    saveMatch(m, 0);
    expect(loadMatch()?.match).toEqual(m);
  });

  it('rejects corrupt saves and drops them from storage', () => {
    const m = clone(two.find((x) => x.deals.length >= 1 && x.phase === 'playing' && x.deal.log.length > 3) as Match);
    const bad: unknown[] = [
      null,
      42,
      'match',
      {},
      { ...m, level: 'expert' },
      { ...m, mode: 'four' },
      { ...m, units: { ...m.units, 0: m.units[0] + 1 } },
      { ...m, seats: ['human', 'hard'] },
      { ...m, dealNo: m.dealNo + 1 },
      { ...m, phase: 'finished' },
      { ...m, deals: m.deals.slice(1) },
      { ...m, deal: { ...m.deal, hands: [m.deal.hands[1], m.deal.hands[0]] } },
      { ...m, deal: { ...m.deal, seed: m.deal.seed + 1 } },
      { ...m, deal: { ...m.deal, log: m.deal.log.slice(0, -1) } },
      { ...m, deal: three[4].deal },
    ];
    for (const v of bad) expect(isMatch(v)).toBe(false);
    for (const v of bad.slice(4)) {
      localStorage.setItem(sessionKey('snapszer'), JSON.stringify({ v: 1, game: 'snapszer', schema: 1, savedAt: Date.now(), seconds: 1, score: 0, data: v }));
      expect(loadMatch()).toBeNull();
      expect(localStorage.getItem(sessionKey('snapszer'))).toBeNull();
    }
  });

  it('rejects a save from another schema and unreadable JSON', () => {
    saveMatch(two[2], 5);
    const raw = JSON.parse(localStorage.getItem(sessionKey('snapszer')) as string);
    localStorage.setItem(sessionKey('snapszer'), JSON.stringify({ ...raw, schema: 2 }));
    expect(loadMatch()).toBeNull();
    localStorage.setItem(sessionKey('snapszer'), '{not json');
    expect(loadMatch()).toBeNull();
    expect(loadSession('snapszer', SAVE_SCHEMA, isMatch)).toBeNull();
  });
});
