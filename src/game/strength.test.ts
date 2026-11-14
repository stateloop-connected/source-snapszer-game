import { describe, expect, it } from 'vitest';
import { STRENGTH_MATCHES, strengthTally, strengthTally3 } from './strength';

/*
 * Strength gates (two players): 200 duplicate-seeded matches per pair — every seed is played twice with the seats
 * swapped, so both bots get the same cards. Three players: legality is checked in the bot tests; here hard must do
 * at least as well as easy over seeded matches with every seating of hard, easy and a medium third seat.
 */
describe('strength', () => {
  it('hard beats easy in ≥ 75 % of 200 duplicate-seeded two-player matches', () => {
    const t = strengthTally('hard', 'easy', STRENGTH_MATCHES);
    expect(t.matches).toBe(200);
    expect(t.wins / t.matches).toBeGreaterThanOrEqual(0.75);
  }, 600_000);

  it('medium beats easy in ≥ 60 % of 200 duplicate-seeded two-player matches', () => {
    const t = strengthTally('medium', 'easy', STRENGTH_MATCHES);
    expect(t.matches).toBe(200);
    expect(t.wins / t.matches).toBeGreaterThanOrEqual(0.6);
  }, 600_000);

  it('hard beats medium in ≥ 55 % of 60 duplicate-seeded two-player matches', () => {
    const t = strengthTally('hard', 'medium', 60);
    expect(t.matches).toBe(60);
    expect(t.wins / t.matches).toBeGreaterThanOrEqual(0.55);
  }, 600_000);

  it('three players: hard does at least as well as easy (match wins and units)', () => {
    const t = strengthTally3('hard', 'easy', 24);
    expect(t.matches).toBe(24);
    expect(t.winsA).toBeGreaterThanOrEqual(t.winsB);
    expect(t.unitsA).toBeGreaterThanOrEqual(t.unitsB);
  }, 600_000);
});
