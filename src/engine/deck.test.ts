import { describe, expect, it } from 'vitest';
import type { HCard } from '../arcade/hungarian/cards';
import { cardKey, cardPoints, createDeck, mulberry32, rankStrength, shuffle } from './deck';

const sum = (cards: readonly HCard[]) => cards.reduce((n, card) => n + cardPoints(card), 0);

describe('createDeck', () => {
  it('two players: 20 cards (A, X, K, F, Alsó × 4 suits)', () => {
    const deck = createDeck({ mode: 'two', withNines: false });
    expect(deck).toHaveLength(20);
    expect(new Set(deck.map(cardKey)).size).toBe(20);
    expect(new Set(deck.map((card) => card.rank))).toEqual(new Set(['asz', 'X', 'kiraly', 'felso', 'also']));
  });
  it('two players with the nines: 24 cards', () => {
    const deck = createDeck({ mode: 'two', withNines: true });
    expect(deck).toHaveLength(24);
    expect(deck.filter((card) => card.rank === 'IX')).toHaveLength(4);
  });
  it('three players: always 24 cards', () => {
    expect(createDeck({ mode: 'three', withNines: false })).toHaveLength(24);
    expect(createDeck({ mode: 'three', withNines: true })).toHaveLength(24);
  });
  it('no VII or VIII ever', () => {
    for (const deck of [createDeck({ mode: 'two', withNines: true }), createDeck({ mode: 'three', withNines: false })]) {
      expect(deck.some((card) => card.rank === 'VII' || card.rank === 'VIII')).toBe(false);
    }
  });
});

describe('cardPoints', () => {
  it('A 11, X 10, K 4, F 3, Alsó 2, IX 0', () => {
    expect(cardPoints({ suit: 'piros', rank: 'asz' })).toBe(11);
    expect(cardPoints({ suit: 'tok', rank: 'X' })).toBe(10);
    expect(cardPoints({ suit: 'zold', rank: 'kiraly' })).toBe(4);
    expect(cardPoints({ suit: 'makk', rank: 'felso' })).toBe(3);
    expect(cardPoints({ suit: 'piros', rank: 'also' })).toBe(2);
    expect(cardPoints({ suit: 'piros', rank: 'IX' })).toBe(0);
  });
  it('the deck holds 120 points, the nines add 0', () => {
    expect(sum(createDeck({ mode: 'two', withNines: false }))).toBe(120);
    expect(sum(createDeck({ mode: 'two', withNines: true }))).toBe(120);
    expect(sum(createDeck({ mode: 'three', withNines: false }))).toBe(120);
  });
});

describe('rankStrength', () => {
  it('A > X > K > F > Alsó > IX', () => {
    const order = (['asz', 'X', 'kiraly', 'felso', 'also', 'IX'] as const).map(rankStrength);
    expect([...order].sort((a, b) => b - a)).toEqual(order);
    expect(new Set(order).size).toBe(6);
  });
});

describe('mulberry32 / shuffle', () => {
  it('is deterministic per seed and keeps every card', () => {
    const deck = createDeck({ mode: 'two', withNines: false });
    expect(shuffle(deck, mulberry32(3))).toEqual(shuffle(deck, mulberry32(3)));
    expect(shuffle(deck, mulberry32(3)).map(cardKey).sort()).toEqual(deck.map(cardKey).sort());
  });
});
