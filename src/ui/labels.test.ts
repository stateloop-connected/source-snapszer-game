import { describe, expect, it } from 'vitest';
import { LANGS } from '../arcade';
import { RANK_SHORT } from './labels';

describe('corner index', () => {
  it('never uses the same mark for two ranks (hu Alsó is „Al”, Ász „Á”)', () => {
    expect(RANK_SHORT.hu.also).toBe('Al');
    for (const lang of LANGS) {
      const marks = Object.values(RANK_SHORT[lang]);
      expect(new Set(marks.map((m) => m.normalize('NFD').replace(/\p{Diacritic}/gu, ''))).size).toBe(marks.length);
    }
  });
});
