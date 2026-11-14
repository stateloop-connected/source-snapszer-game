import { describe, expect, it } from 'vitest';
import { LANGS } from './arcade';
import { MESSAGES, type MessageKey } from './i18n';

/** Keys whose text may equal English: the game's own terms, names and pure templates. */
const SAME_OK: Record<'hu' | 'de', MessageKey[]> = {
  hu: ['statUnitsValue', 'marriageNone', 'snapszerBtn', 'kontraBtn', 'rekontraBtn', 'talon', 'unitsShort', 'snapszerTag', 'kontraTag', 'logPlay',
    'logKontra', 'pointsOf', 'unitsLine', 'suitPiros', 'suitTok', 'suitZold', 'suitMakk', 'logDeclare' as MessageKey],
  de: ['statUnitsValue', 'marriageNone', 'kontraBtn', 'rekontraBtn', 'subkontraBtn', 'talon', 'unitsShort', 'kontraTag', 'logPlay', 'logKontra',
    'pointsOf', 'unitsLine', 'speedNormal', 'marriageBtn'],
};

describe('Snapszer i18n', () => {
  it('has every key in en, hu and de with a non-empty value', () => {
    const keys = Object.keys(MESSAGES.en).sort();
    expect(keys.length).toBeGreaterThan(150);
    for (const lang of LANGS) {
      expect(Object.keys(MESSAGES[lang]).sort()).toEqual(keys);
      for (const k of keys) expect((MESSAGES[lang] as Record<string, string>)[k].trim()).not.toBe('');
    }
  });

  it('is really translated (only game terms and templates may match English)', () => {
    for (const lang of ['hu', 'de'] as const) {
      const same = (Object.keys(MESSAGES.en) as MessageKey[]).filter((k) => MESSAGES[lang][k] === MESSAGES.en[k]);
      expect(same.filter((k) => !SAME_OK[lang].includes(k))).toEqual([]);
    }
  });

  it('uses the brief’s Hungarian button words', () => {
    expect(MESSAGES.hu.declareBtn).toBe('Elég!');
    expect(MESSAGES.hu.exchangeBtn).toBe('Csere');
    expect(MESSAGES.hu.closeBtn).toBe('Betakarás');
    expect(MESSAGES.hu.showPoints).toBe('Pontok mutatása');
  });

  it('uses the Austrian / German Schnapsen terms in German', () => {
    expect(MESSAGES.de.declareBtn).toBe('Ich bin draußen!');
    expect(MESSAGES.de.setupBody).toContain('„Bummerl”');
    expect(MESSAGES.de.rulesScoringDeal).toContain('„Schneider”');
    expect(MESSAGES.de.rulesScoringDeal).toContain('„schwarz”');
    expect(MESSAGES.de.rulesRuleSnapszer).toContain('ungarische');
    expect(MESSAGES.de.reasonTrump).toContain('keine Karte in {led}');
    for (const k of Object.keys(MESSAGES.de) as MessageKey[]) expect(MESSAGES.de[k], k).not.toMatch(/Genug|Rádli|Maccs/);
  });

  it('keeps the same placeholders in every language', () => {
    const vars = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort().join();
    for (const k of Object.keys(MESSAGES.en) as MessageKey[]) {
      const set = new Set(vars(MESSAGES.en[k]).split(','));
      for (const lang of ['hu', 'de'] as const) expect(new Set(vars(MESSAGES[lang][k]).split(',')), `${lang}.${k}`).toEqual(set);
    }
  });
});
