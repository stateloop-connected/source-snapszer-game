import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { applyDental, applyLang, hCardLabel } from './arcade';
import {
  canClose,
  canDeclareWin,
  canExchange,
  canFold3,
  canKontra,
  canSnapszer,
  cardKey,
  legalPlays,
  marriageOptions,
  WRONG_DECLARE_UNITS,
  type Deal2State,
  type Deal3State,
} from './engine';
import type { Match } from './game/match';
import { MESSAGES } from './i18n';
import { SUIT_KEY } from './ui/labels';
import { SnapszerGame } from './SnapszerGame';
import { findMatch, humanTurn, save, savedMatch } from './test/fixtures';
import { setCoarsePointer } from './test/touchEnv';

beforeEach(() => {
  localStorage.clear();
  applyDental(false, { silent: true });
  applyLang('en', { silent: true });
  vi.useFakeTimers();
  setCoarsePointer(true);
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  document.querySelectorAll('.header').forEach((h) => h.remove());
});

const en = MESSAGES.en;
const lastOf = <T,>(xs: readonly T[] | undefined): T | undefined => xs?.[xs.length - 1];
const lastType = (): string | undefined => {
  const log = savedMatch()?.deal.log as readonly { type: string }[] | undefined;
  return lastOf(log)?.type;
};
const key = (k: string) => act(() => void fireEvent.keyDown(window, { key: k }));
const tap = (el: Element) =>
  act(() => {
    fireEvent.pointerDown(el, { pointerId: 1, pointerType: 'touch', button: 0 });
    fireEvent.pointerUp(el, { pointerId: 1, pointerType: 'touch', button: 0 });
    fireEvent.click(el);
  });
const handButtons = () => [...document.querySelectorAll<HTMLButtonElement>('[data-hand-card]')];
const bar = () => screen.getByTestId('snapszer-actions');
const action = (id: string) => bar().querySelector<HTMLButtonElement>(`[data-action="${id}"]`)!;
const two = (m: Match) => m.deal as Deal2State;

function resume(m: Match) {
  save(m);
  render(<SnapszerGame />);
  key('p');
}

describe('Snapszer touch controls', () => {
  it('the board is a tap board and the announcements sit in a bottom bar', () => {
    resume(findMatch(humanTurn));
    expect(document.querySelector('.arc-board-tap')).toBeTruthy();
    expect(bar().getAttribute('data-bar')).toBe('bottom');
    expect(['declare', 'exchange', 'close', 'snapszer', 'kontra'].every((id) => action(id))).toBe(true);
  });

  it('tap selects a card, tapping it again plays it', () => {
    const m = findMatch((x) => humanTurn(x) && x.deal.trick.length === 0 && !x.deal.mustLead);
    resume(m);
    const before = handButtons().length;
    const card = document.querySelector<HTMLButtonElement>('[data-playable="true"]')!;
    const k = card.getAttribute('data-hand-card');
    tap(card);
    expect(handButtons()).toHaveLength(before);
    expect(card.getAttribute('aria-pressed')).toBe('true');
    expect(savedMatch()?.deal.log.length).toBe(m.deal.log.length);
    tap(document.querySelector(`[data-hand-card="${k}"]`)!);
    expect(document.querySelector(`[data-hand-card="${k}"]`)).toBeNull();
    expect(savedMatch()?.deal.log.length).toBeGreaterThan(m.deal.log.length);
  });

  it('tapping another card moves the selection', () => {
    const m = findMatch((x) => humanTurn(x) && x.deal.trick.length === 0 && !x.deal.mustLead && x.deal.hands[0].length >= 3);
    resume(m);
    const [a, b] = [...document.querySelectorAll<HTMLButtonElement>('[data-playable="true"]')];
    tap(a);
    tap(b);
    expect(a.getAttribute('aria-pressed')).toBe('false');
    expect(b.getAttribute('aria-pressed')).toBe('true');
    expect(handButtons()).toHaveLength(m.deal.hands[0].length);
  });

  it('a card that may not be played is hatched; tapping it explains why and selects nothing', () => {
    const m = findMatch((x) => humanTurn(x) && x.deal.mode === 'two' && legalPlays(two(x), 0).length < x.deal.hands[0].length);
    resume(m);
    const illegal = document.querySelector<HTMLButtonElement>('[data-playable="false"]')!;
    expect(illegal.querySelector('[class*="hatch"]')).toBeTruthy();
    tap(illegal);
    expect(screen.getByTestId('snapszer-notice').textContent).toMatch(/must/);
    expect(illegal.getAttribute('aria-pressed')).toBe('false');
    expect(handButtons()).toHaveLength(m.deal.hands[0].length);
  });

  it('the bottom bar offers a Play button for the raised card', () => {
    const m = findMatch((x) => humanTurn(x) && x.deal.trick.length === 0 && !x.deal.mustLead);
    resume(m);
    const card = document.querySelector<HTMLButtonElement>('[data-playable="true"]')!;
    const c = m.deal.hands[0].find((h) => cardKey(h) === card.getAttribute('data-hand-card'))!;
    tap(card);
    tap(within(bar()).getByRole('button', { name: en.playBtn.replace('{card}', hCardLabel(c, 'en')) }));
    expect(handButtons()).toHaveLength(m.deal.hands[0].length - 1);
  });

  it('points hidden (default): „Enough!” is enabled on your turn even under 66 and looks the same as at 66', () => {
    const low = findMatch((x) => humanTurn(x) && !canDeclareWin(two(x), 0));
    resume(low);
    expect(action('declare').disabled).toBe(false);
    expect(action('declare').className).not.toMatch(/primary/);
  });

  it('points hidden: a wrong „Enough!” under 66 gives the opponent WRONG_DECLARE_UNITS', () => {
    const m = findMatch((x) => humanTurn(x) && !canDeclareWin(two(x), 0) && two(x).kontra.game === null && !two(x).snapszer);
    resume(m);
    tap(action('declare'));
    const after = savedMatch()!;
    expect(after.deal.result).toEqual({ winner: 1, units: WRONG_DECLARE_UNITS, reason: 'declared' });
    expect(after.units[1]).toBe(m.units[1] + WRONG_DECLARE_UNITS);
  });

  it('points shown: „Enough!” is enabled only at 66', () => {
    localStorage.setItem('snapszer.showPoints', '1');
    const low = findMatch((x) => humanTurn(x) && !canDeclareWin(two(x), 0));
    resume(low);
    expect(action('declare').disabled).toBe(true);
  });

  it('„Enough!” at 66 ends the deal for you (points shown, the button is highlighted)', () => {
    localStorage.setItem('snapszer.showPoints', '1');
    const m = findMatch((x) => humanTurn(x) && canDeclareWin(two(x), 0));
    resume(m);
    expect(action('declare').disabled).toBe(false);
    expect(action('declare').className).toMatch(/primary/);
    tap(action('declare'));
    const after = savedMatch()!;
    expect(after.deal.result?.winner).toBe(0);
    expect(after.deal.result?.reason).toBe('declared');
  });

  it('two 20 / 40 buttons share one cell: icon and value only, the suit in the accessible name', () => {
    const m = findMatch((x) => humanTurn(x) && marriageOptions(two(x), 0).length === 2, { maxSeed: 3000 });
    resume(m);
    const cells = bar().querySelector('[role="group"]')!.children;
    expect(cells).toHaveLength(6);
    for (const suit of marriageOptions(two(m), 0)) {
      const b = action(`marriage-${suit}`);
      const pts = suit === two(m).trump ? '40' : '20';
      expect(b.textContent).toBe(pts);
      expect(b.querySelector('svg')).toBeTruthy();
      expect(b.getAttribute('aria-label')).toBe(en.marriageBtn.replace('{points}', pts).replace('{suit}', MESSAGES.en[SUIT_KEY[suit]]));
    }
  });

  it('three players with eight cards: the hand can lay out in two rows of four', () => {
    const m = findMatch((x) => humanTurn(x) && x.deal.mode === 'three' && x.deal.hands[0].length === 8 && (x.deal as Deal3State).phase === 'play', { mode: 'three' });
    resume(m);
    expect(screen.getByTestId('snapszer-hand').getAttribute('data-rows')).toBe('true');
  });

  it('Exchange swaps the trump Under from the bar', () => {
    const m = findMatch((x) => humanTurn(x) && canExchange(two(x), 0));
    resume(m);
    tap(action('exchange'));
    expect(lastType()).toBe('exchange');
  });

  it('Close closes the talon from the bar', () => {
    const m = findMatch((x) => humanTurn(x) && canClose(two(x), 0));
    resume(m);
    tap(action('close'));
    expect((savedMatch()?.deal as Deal2State).closed?.by).toBe(0);
  });

  it('20 / 40 is announced from the bar, then the King or Over must be led', () => {
    const m = findMatch((x) => humanTurn(x) && marriageOptions(two(x), 0).length > 0, { maxSeed: 600 });
    resume(m);
    const suit = marriageOptions(two(m), 0)[0];
    tap(action(`marriage-${suit}`));
    const after = savedMatch()!.deal as Deal2State;
    expect(lastOf(after.marriages)).toMatchObject({ seat: 0, suit });
    expect(after.mustLead).toBe(suit);
  });

  it('Snapszer is announced from the bar', () => {
    const m = findMatch((x) => humanTurn(x) && canSnapszer(two(x), 0));
    resume(m);
    tap(action('snapszer'));
    expect((savedMatch()?.deal as Deal2State).snapszer?.by).toBe(0);
  });

  it('Kontra is said from the bar', () => {
    const m = findMatch((x) => humanTurn(x) && canKontra(two(x), 0));
    resume(m);
    tap(action('kontra'));
    expect(lastType()).toBe('kontra');
  });

  it('three players: tap a card twice to name the trump, and fold from the bar', () => {
    const m = findMatch((x) => humanTurn(x) && x.deal.mode === 'three' && x.deal.phase === 'trump', { mode: 'three' });
    resume(m);
    expect(handButtons()).toHaveLength(4);
    const first = handButtons()[0];
    const k = first.getAttribute('data-hand-card')!;
    tap(first);
    expect(savedMatch()?.deal.log.length).toBe(m.deal.log.length);
    tap(document.querySelector(`[data-hand-card="${k}"]`)!);
    const after = savedMatch()!.deal as Deal3State;
    expect(after.phase).toBe('play');
    expect(after.trumpCard && cardKey(after.trumpCard)).toBe(k);
    expect(canFold3(after, 0)).toBe(true);
    tap(action('fold'));
    expect(savedMatch()?.deal.result?.reason).toBe('fold');
  });

  it('shows touch help next to the (hidden) key help', () => {
    render(<SnapszerGame />);
    expect(screen.getByText(en.touchTap)).toBeTruthy();
    expect(screen.getByText(en.touchBar)).toBeTruthy();
  });

  it('the table and the bar get the height under the sticky page header (standalone bar or portal header)', () => {
    const header = document.createElement('div');
    header.className = 'header';
    header.style.position = 'sticky';
    header.getBoundingClientRect = () => ({ bottom: 56, top: 0, left: 0, right: 390, width: 390, height: 56, x: 0, y: 0, toJSON: () => ({}) });
    document.body.appendChild(header);
    const scroll = vi.fn();
    Element.prototype.scrollIntoView = scroll;
    resume(findMatch(humanTurn));
    const root = screen.getByTestId('snapszer-game');
    expect(root.style.getPropertyValue('--snap-fit-h')).toBe(`${window.innerHeight - 56}px`);
    expect(scroll).toHaveBeenCalledWith({ block: 'end', behavior: 'smooth' });
    expect(screen.getByTestId('snapszer-table').className).toMatch(/fit/);
  });

  it('the table scrolls into view again when the next deal starts', () => {
    const scroll = vi.fn();
    Element.prototype.scrollIntoView = scroll;
    resume(findMatch((x) => x.phase === 'dealOver'));
    const before = scroll.mock.calls.length;
    key('Enter');
    expect(scroll.mock.calls.length).toBeGreaterThan(before);
  });

  it('the full-screen button toggles the immersive mode', () => {
    render(<SnapszerGame />);
    act(() => void fireEvent.click(screen.getByRole('button', { name: /Full screen/ })));
    expect(document.documentElement.dataset.arcadeImmersive).toBe('1');
    act(() => void fireEvent.click(screen.getByRole('button', { name: /Exit full screen/ })));
    expect(document.documentElement.dataset.arcadeImmersive).toBeUndefined();
  });

  it('with a mouse a click still plays at once', () => {
    setCoarsePointer(false);
    const m = findMatch((x) => humanTurn(x) && x.deal.trick.length === 0 && !x.deal.mustLead);
    resume(m);
    act(() => void fireEvent.click(document.querySelector('[data-playable="true"]')!));
    expect(handButtons()).toHaveLength(m.deal.hands[0].length - 1);
  });
});
