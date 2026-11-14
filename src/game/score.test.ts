import { describe, expect, it } from 'vitest';
import { LEVEL_FACTOR, MAX_SCORE, UNIT_POINTS, WIN_BONUS, matchScore } from './score';

const two = (you: number, opp: number, level: 'easy' | 'medium' | 'hard') =>
  ({ mode: 'two', level, units: { 0: you, 1: opp, 2: 0 } }) as const;
const three = (you: number, a: number, b: number, level: 'easy' | 'medium' | 'hard') =>
  ({ mode: 'three', level, units: { 0: you, 1: a, 2: b } }) as const;

describe('matchScore', () => {
  it('round((max(0, you − best opponent) × 100 + (won ? 500 : 0)) × level)', () => {
    expect(UNIT_POINTS).toBe(100);
    expect(WIN_BONUS).toBe(500);
    expect(LEVEL_FACTOR).toEqual({ easy: 1, medium: 1.5, hard: 2 });
    expect(matchScore(two(7, 3, 'medium'), true)).toBe(1350);
    expect(matchScore(two(7, 3, 'easy'), true)).toBe(900);
    expect(matchScore(two(7, 6, 'hard'), true)).toBe(1200);
    expect(matchScore(two(5, 2, 'easy'), false)).toBe(300);
  });
  it('finished early behind the opponent scores 0', () => {
    expect(matchScore(two(2, 4, 'hard'), false)).toBe(0);
    expect(matchScore(two(0, 0, 'hard'), false)).toBe(0);
  });
  it('is clamped to 0 … 5000', () => {
    expect(MAX_SCORE).toBe(5000);
    expect(matchScore(two(30, 0, 'hard'), true)).toBe(5000);
    expect(matchScore(two(22, 0, 'hard'), true)).toBe(5000);
    expect(matchScore(two(20, 0, 'hard'), false)).toBe(4000);
  });
  it('three players: the best opponent counts, each opponent separately (not their sum)', () => {
    expect(matchScore(three(8, 3, 5, 'medium'), true)).toBe(Math.round((300 + 500) * 1.5));
    expect(matchScore(three(4, 3, 3, 'easy'), false)).toBe(100);
    expect(matchScore(three(4, 6, 1, 'easy'), false)).toBe(0);
  });
});
