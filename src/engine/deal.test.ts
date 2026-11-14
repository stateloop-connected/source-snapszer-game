import { describe, expect, it } from 'vitest';
import { cardKey, createDeck, mulberry32, shuffle } from './deck';
import { assertDrawableTalon, deal2 } from './deal';

const opts = { mode: 'two', withNines: false } as const;

describe('deal2', () => {
  it('5 cards each, the turn-up trump and 9 talon cards under it (20-card deck)', () => {
    const s = deal2(11, opts);
    expect(s.hands.map((h) => h.length)).toEqual([5, 5]);
    expect(s.talon).toHaveLength(9);
    expect(s.trumpCard).not.toBeNull();
    expect(s.trump).toBe(s.trumpCard?.suit);
    const all = [...s.hands[0], ...s.hands[1], ...s.talon, s.trumpCard!].map(cardKey);
    expect(new Set(all).size).toBe(20);
  });
  it('with the nines: 13 talon cards', () => {
    const s = deal2(11, { mode: 'two', withNines: true });
    expect(s.hands.map((h) => h.length)).toEqual([5, 5]);
    expect(s.talon).toHaveLength(13);
  });
  it('deals 3 + turn-up trump + 2, the dealer’s opponent first, and the rest is the talon', () => {
    const deck = shuffle(createDeck(opts), mulberry32(11));
    const s = deal2(11, opts, 1);
    expect(s.hands[0]).toEqual([...deck.slice(0, 3), ...deck.slice(7, 9)]);
    expect(s.hands[1]).toEqual([...deck.slice(3, 6), ...deck.slice(9, 11)]);
    expect(s.trumpCard).toEqual(deck[6]);
    expect(s.talon).toEqual(deck.slice(11));
  });
  it('the dealer’s opponent leads; default dealer is seat 1, so seat 0 leads', () => {
    expect(deal2(5, opts).dealer).toBe(1);
    expect(deal2(5, opts).turn).toBe(0);
    const s = deal2(5, opts, 0);
    expect(s.turn).toBe(1);
    expect(s.leader).toBe(1);
  });
  it('same seed, same deal', () => {
    expect(deal2(99, opts)).toEqual(deal2(99, opts));
    expect(deal2(99, opts).hands).not.toEqual(deal2(100, opts).hands);
  });
  it('rejects the three-player mode', () => {
    expect(() => deal2(1, { mode: 'three', withNines: true })).toThrow();
  });
  it('the talon above the trump is odd, so the last pair takes the last talon card and the trump', () => {
    expect(deal2(3, opts).talon.length % 2).toBe(1);
    expect(deal2(3, { mode: 'two', withNines: true }).talon.length % 2).toBe(1);
    expect(() => assertDrawableTalon(9)).not.toThrow();
    expect(() => assertDrawableTalon(13)).not.toThrow();
    expect(() => assertDrawableTalon(8)).toThrow(/odd/);
    expect(() => assertDrawableTalon(0)).toThrow(/odd/);
  });
});
