import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { applyDental, applyLang, formatNumber, type Lang } from './arcade';
import {
  CLOSE_FAILED_UNITS,
  DEAL3_ROUND,
  DEAL_FIRST,
  DEAL_SECOND,
  DECLARE_THRESHOLD,
  FOLD_ACE_UNITS,
  FOLD_UNITS,
  KONTRA_FACTOR,
  MACCS_THRESHOLD,
  MACCS_UNITS,
  MARRIAGE_POINTS,
  MIN_TALON_FOR_EXCHANGE,
  NO_TRICK_UNITS,
  SNAPSZER_UNITS,
  WIN_UNITS,
  WRONG_DECLARE_UNITS,
  cardPoints,
  createDeck,
  deal2,
  deal3,
  chooseTrump,
} from './engine';
import { TARGET_UNITS } from './game/match';
import { LEVEL_FACTOR, MAX_SCORE, UNIT_POINTS, WIN_BONUS, matchScore } from './game/score';
import { SnapszerGame } from './SnapszerGame';
import { findMatch, humanTurn, save, savedMatch } from './test/fixtures';
import { setCoarsePointer } from './test/touchEnv';

beforeEach(() => {
  localStorage.clear();
  applyDental(false, { silent: true });
  applyLang('hu', { silent: true });
  vi.useFakeTimers();
  setCoarsePointer(false);
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  applyLang('en', { silent: true });
  applyDental(false, { silent: true });
});

const key = (k: string) => act(() => void fireEvent.keyDown(window, { key: k }));
const click = (el: Element) => act(() => void fireEvent.click(el));
const openRules = () => click(screen.getByRole('button', { name: /Szabályok/ }));
const dialog = () => screen.getByRole('dialog', { name: /szabályok|Regeln|rules/ });
const headings = () => within(dialog()).getAllByRole('heading', { level: 3 }).map((h) => h.textContent);
const n = (v: number, lang: Lang = 'hu') => formatNumber(v, lang);

describe('Snapszer rules dialog', () => {
  it('shows a Rules button; opening it mid-match pauses, closing leaves the game paused', () => {
    const onStatusChange = vi.fn();
    render(<SnapszerGame onStatusChange={onStatusChange} />);
    expect(screen.getByRole('button', { name: /Szabályok/ })).toBeTruthy();
    click(screen.getByRole('button', { name: /Osztás/ }));
    expect(onStatusChange.mock.calls[onStatusChange.mock.calls.length - 1]?.[0].status).toBe('running');
    openRules();
    expect(screen.getByRole('dialog', { name: 'Snapszer — szabályok' })).toBeTruthy();
    expect(onStatusChange.mock.calls[onStatusChange.mock.calls.length - 1]?.[0].status).toBe('paused');
    click(screen.getByRole('button', { name: 'Bezárás' }));
    expect(screen.queryByRole('dialog', { name: 'Snapszer — szabályok' })).toBeNull();
    expect(onStatusChange.mock.calls[onStatusChange.mock.calls.length - 1]?.[0].status).toBe('paused');
    expect(screen.getByRole('dialog', { name: 'Szünet' })).toBeTruthy();
  });

  it('R opens the rules', () => {
    render(<SnapszerGame />);
    key('r');
    expect(screen.getByRole('dialog', { name: 'Snapszer — szabályok' })).toBeTruthy();
  });

  it('lists goal, play, rules, scoring, dental in order; mobile only with a coarse pointer, with the touch rows', () => {
    const { unmount } = render(<SnapszerGame />);
    openRules();
    expect(headings()).toEqual(['Cél', 'Így játssz', 'Szabályok', 'Pontozás', 'Fogas mód']);
    expect(dialog().textContent).toContain('Kattints egy lapra, és kijátszod.');
    unmount();
    setCoarsePointer(true);
    render(<SnapszerGame />);
    openRules();
    expect(headings()).toEqual(['Cél', 'Így játssz', 'Szabályok', 'Pontozás', 'Fogas mód', 'Mobilon']);
    const text = dialog().textContent ?? '';
    expect(text).toContain('Koppints egy lapra: kiemelkedik; koppints rá újra: kijátszod.');
    expect(text).toContain('az asztal alatti sávban van (fekvő telefonon mellette)');
    expect(text).toContain('Teljes képernyő');
    expect(text).not.toContain('Kattints egy lapra');
  });

  it('prints the deck, deal and announcement numbers from the engine as full sentences', () => {
    const two = deal2(1, { mode: 'two', withNines: false });
    const nines = deal2(1, { mode: 'two', withNines: true });
    const three = chooseTrump(deal3(1, { mode: 'three', withNines: true }, 2), deal3(1, { mode: 'three', withNines: true }, 2).hands[0][0]);
    const hand = two.hands[0].length;
    expect(DEAL_FIRST + DEAL_SECOND).toBe(hand);
    render(<SnapszerGame />);
    openRules();
    const text = dialog().textContent ?? '';
    expect(text).toContain(`Érj el ${n(TARGET_UNITS)} egységet a gépek előtt: ezzel megnyered a rádlit. Egy osztást az nyer, aki összegyűjt ${n(DECLARE_THRESHOLD)} kártyapontot és bemondja: „Elég!”`);
    expect(text).toContain(
      `Ketten ${n(createDeck({ mode: 'two', withNines: false }).length)} lappal játszotok (minden színből ász, tízes, király, felső és alsó), a kilencesekkel ${n(createDeck({ mode: 'two', withNines: true }).length)} lappal. Mindenki ${n(DEAL_FIRST)} lapot kap, aztán egy lapot felfordítanak adunak, majd még ${n(DEAL_SECOND)} lapot: így ${n(hand)} lap van a kézben. A maradék ${n(two.talon.length)} lap képpel lefelé fekszik az adun, ez a talon (a kilencesekkel ${n(nines.talon.length)}).`,
    );
    expect(text).toContain(
      `amíg legalább ${n(MIN_TALON_FOR_EXCHANGE)} lap van a talonon az adu fölött, kicserélheted az adu alsódat a felfordított adura (csere), vagy betakarhatod a talont (betakarás). Aki betakar, és nem éri el a ${n(DECLARE_THRESHOLD)} pontot, ${n(CLOSE_FAILED_UNITS)} egységet ad az ellenfelének.`,
    );
    expect(text).toContain(`ez a bemondás, ${n(MARRIAGE_POINTS.plain)} pont, aduban ${n(MARRIAGE_POINTS.trump)}.`);
    expect(text).toContain(
      `Hárman: ${n(createDeck({ mode: 'three', withNines: true }).length)} lap, mindenkinek ${n(three.hands[0].length)}, ${n(DEAL3_ROUND)} és ${n(DEAL3_ROUND)} lapos körben osztva. A hívó az első ${n(DEAL3_ROUND)} lapjából mond adut`,
    );
    expect(text).toContain(`ekkor mindkét ellenjátékos ${n(FOLD_UNITS)} egységet kap, vagy ${n(FOLD_ACE_UNITS)} egységet, ha a hívónál ász van.`);
  });

  it('prints the deal units and the score formula, example and finish rule as full sentences (hu and de)', () => {
    const example = matchScore({ mode: 'two', level: 'medium', units: { 0: TARGET_UNITS, 1: 3, 2: 0 } }, true);
    expect(example).toBe(1350);
    const start = matchScore({ mode: 'two', level: 'hard', units: { 0: 0, 1: 0, 2: 0 } }, false);
    render(<SnapszerGame />);
    openRules();
    let text = dialog().textContent ?? '';
    expect(text).toContain(
      `Egy osztás ${n(WIN_UNITS)} egységet ér, ${n(MACCS_UNITS)} egységet, ha a vesztesnek ${n(MACCS_THRESHOLD)} pontnál kevesebb van („maccs”), és ${n(NO_TRICK_UNITS)} egységet, ha a vesztes egy ütést sem vitt. A snapszer mindkét irányban ${n(SNAPSZER_UNITS)} egység, a ${n(DECLARE_THRESHOLD)} pont alatti „Elég!” pedig ${n(WRONG_DECLARE_UNITS)} egységet ad az ellenfélnek. A kontra ×${n(KONTRA_FACTOR)} szorzót ad az osztásra.`,
    );
    expect(text).toContain(
      `A pontszámod: (a te egységeid − a legjobb gép egységei, legalább ${n(0)}) × ${n(UNIT_POINTS)}, és ha megnyered a rádlit, még ${n(WIN_BONUS)}, mindez szorozva a szinttel (Könnyű ×${n(LEVEL_FACTOR.easy)}, Közepes ×${n(LEVEL_FACTOR.medium)}, Nehéz ×${n(LEVEL_FACTOR.hard)}); legfeljebb ${n(MAX_SCORE)} pont.`,
    );
    expect(text).toContain('Közepes ×1,5');
    expect(text).toContain(`Példa: Közepes szinten ${n(TARGET_UNITS)}–${n(3)} arányban nyered a rádlit: ez ${n(example)} pont.`);
    expect(text).toContain(`A „Befejezés” két osztás között lehetséges. Ilyenkor a lejátszott osztások számítanak, győzelmi bónusz nélkül: a legelején ez ${n(start)} pont.`);

    act(() => applyLang('de'));
    text = dialog().textContent ?? '';
    expect(text).toContain(
      `Deine Punktzahl: (deine Einheiten − die Einheiten des besten Bots, mindestens ${n(0, 'de')}) × ${n(UNIT_POINTS, 'de')}, plus ${n(WIN_BONUS, 'de')}, wenn du das Bummerl gewinnst, mal der Stufe (Leicht ×${n(LEVEL_FACTOR.easy, 'de')}, Mittel ×${n(LEVEL_FACTOR.medium, 'de')}, Schwer ×${n(LEVEL_FACTOR.hard, 'de')}); höchstens ${n(MAX_SCORE, 'de')} Punkte.`,
    );
    expect(text).toContain(`Beispiel: Du gewinnst das Bummerl ${n(TARGET_UNITS, 'de')} zu ${n(3, 'de')} auf der Stufe Mittel: Das sind ${n(example, 'de')} Punkte.`);
  });

  it('has a described card-value diagram from cardPoints and a deal-points diagram; both follow dental mode', () => {
    render(<SnapszerGame />);
    openRules();
    const p = (rank: 'asz' | 'X' | 'kiraly' | 'felso' | 'also' | 'IX') => n(cardPoints({ suit: 'piros', rank }));
    const deck = createDeck({ mode: 'two', withNines: false });
    const total = deck.reduce((t, c) => t + cardPoints(c), 0);
    expect(total).toBe(120);
    const values = within(dialog()).getByTestId('snapszer-value-diagram');
    expect(values.getAttribute('role')).toBe('img');
    expect(values.getAttribute('aria-label')).toBe(
      `A lapok értéke: ász ${p('asz')}, tízes ${p('X')}, király ${p('kiraly')}, felső ${p('felso')}, alsó ${p('also')}, kilences ${p('IX')}. A ${n(deck.length)} lap együtt ${n(total)} pontot ér.`,
    );
    expect([...values.querySelectorAll('[data-points]')].map((t) => t.textContent)).toEqual([p('asz'), p('X'), p('kiraly'), p('felso'), p('also'), p('IX')]);
    const deals = within(dialog()).getByTestId('snapszer-deal-diagram');
    expect(deals.getAttribute('aria-label')).toBe(
      `Az osztás értéke: ${n(WIN_UNITS)} egység, ha a vesztesnek legalább ${n(MACCS_THRESHOLD)} pontja van, ${n(MACCS_UNITS)} egység, ha ${n(MACCS_THRESHOLD)} pontnál kevesebb, ${n(NO_TRICK_UNITS)} egység, ha a vesztes egy ütést sem vitt.`,
    );
    expect([...deals.querySelectorAll('[data-units]')].map((g) => g.getAttribute('data-units'))).toEqual([WIN_UNITS, MACCS_UNITS, NO_TRICK_UNITS].map(String));
    expect(values.getAttribute('data-dental')).toBe('false');
    act(() => applyDental(true));
    expect(within(dialog()).getByTestId('snapszer-value-diagram').getAttribute('data-dental')).toBe('true');
    expect(within(dialog()).getByTestId('snapszer-deal-diagram').querySelectorAll('[data-tooth]')).toHaveLength(WIN_UNITS + MACCS_UNITS + NO_TRICK_UNITS);
  });

  it('keeps the match when the language changes inside the rules', () => {
    const m = findMatch((x) => humanTurn(x) && x.deal.tricks.length >= 1);
    save(m, 40);
    render(<SnapszerGame />);
    key('p');
    const cards = document.querySelectorAll('[data-hand-card]').length;
    openRules();
    act(() => applyLang('de'));
    expect(screen.getByRole('heading', { level: 2, name: 'Schnapsen — Regeln' })).toBeTruthy();
    expect(screen.getByRole('heading', { level: 3, name: 'Ziel' })).toBeTruthy();
    click(screen.getByRole('button', { name: 'Schließen' }));
    expect(screen.getByRole('dialog', { name: 'Pausiert' })).toBeTruthy();
    expect(document.querySelectorAll('[data-hand-card]')).toHaveLength(cards);
    const after = savedMatch();
    expect(after?.dealNo).toBe(m.dealNo);
    expect(after?.deal.log.length).toBe(m.deal.log.length);
    expect(after?.units).toEqual(m.units);
  });
});
