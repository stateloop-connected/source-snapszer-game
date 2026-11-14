import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { applyDental, applyLang, formatNumber, hCardLabel, loadSession } from './arcade';
import { points, type Deal2State } from './engine';
import { SAVE_SCHEMA } from './game/save';
import { BOT_NAMES, SnapszerGame } from './SnapszerGame';
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
});

const key = (k: string) => act(() => void fireEvent.keyDown(window, { key: k }));
const click = (el: Element) => act(() => void fireEvent.click(el));
const tick = (ms: number) => act(() => void vi.advanceTimersByTime(ms));

describe('SnapszerGame', () => {
  it('starts a two-player match from the setup card: five cards each, the talon with the turned-up trump', () => {
    render(<SnapszerGame />);
    click(screen.getByRole('button', { name: /Osztás/ }));
    expect(document.querySelectorAll('[data-hand-card]')).toHaveLength(5);
    expect(screen.getByTestId('seat-backs-1').querySelectorAll('svg')).toHaveLength(5);
    expect(screen.getByTestId('snapszer-talon').getAttribute('data-count')).toBe('9');
    expect(screen.getByTestId('snapszer-trump-card')).toBeTruthy();
    expect(screen.getByTestId('snapszer-table').textContent).toContain(BOT_NAMES[1]);
  });

  it('plays a whole deal through the UI with the bots (mouse)', () => {
    render(<SnapszerGame />);
    click(screen.getByRole('button', { name: /Osztás/ }));
    for (let i = 0; i < 200 && !screen.queryByTestId('snapszer-deal-result'); i++) {
      const card = document.querySelector<HTMLButtonElement>('[data-playable="true"]:not(:disabled)');
      if (card) click(card);
      else tick(1500);
    }
    expect(screen.getByTestId('snapszer-deal-result').textContent).toMatch(/egység/);
    const m = savedMatch()!;
    expect(m.phase === 'dealOver' || m.phase === 'finished').toBe(true);
    expect(m.deals).toHaveLength(1);
  });

  it('your points are hidden by default; „Pontok mutatása” shows yours, never the bots’', () => {
    const m = findMatch((x) => humanTurn(x) && x.deal.tricks.some((t) => t.winner === 0) && x.deal.tricks.some((t) => t.winner === 1));
    save(m);
    render(<SnapszerGame />);
    key('p');
    expect(screen.queryByTestId('snapszer-my-points')).toBeNull();
    click(screen.getByRole('checkbox', { name: /Pontok mutatása/ }));
    const mine = points(m.deal as Deal2State, 0);
    expect(screen.getByTestId('snapszer-my-points').textContent).toContain(`Pontjaid: ${formatNumber(mine, 'hu')}`);
    const opp = points(m.deal as Deal2State, 1);
    const seat1 = screen.getByRole('region', { name: new RegExp(`^${BOT_NAMES[1]},`) });
    expect(seat1.textContent).not.toContain('Pont');
    expect(within(seat1).queryByTestId('snapszer-my-points')).toBeNull();
    expect(opp).toBeGreaterThan(0);
  });

  it('three players: two opponents with their own names and portraits; you name the trump from four cards', () => {
    const m = findMatch((x) => humanTurn(x) && x.deal.mode === 'three' && x.deal.phase === 'trump', { mode: 'three' });
    save(m);
    render(<SnapszerGame />);
    key('p');
    expect(screen.getByTestId('snapszer-table').getAttribute('data-mode')).toBe('three');
    expect(screen.getAllByTestId('snapszer-figure-classic').map((f) => f.getAttribute('data-figure'))).toEqual(['rozi', 'gazsi', 'player']);
    expect(document.querySelectorAll('[data-hand-card]')).toHaveLength(4);
    click(document.querySelector('[data-hand-card]')!);
    expect(document.querySelectorAll('[data-hand-card]')).toHaveLength(8);
  });

  it('when you follow, the prompt names the led card and who led it (not the last card on the table)', () => {
    const m = findMatch((x) => humanTurn(x) && x.deal.mode === 'three' && x.deal.trick.length === 2, { mode: 'three' });
    save(m);
    render(<SnapszerGame />);
    key('p');
    const led = m.deal.trick[0];
    expect(screen.getByTestId('snapszer-prompt').textContent).toContain(`${BOT_NAMES[led.seat as 1 | 2]} hívta: ${hCardLabel(led.card, 'hu')}. Tegyél rá.`);
  });

  it('changing the mode mid-match asks first, then gives the match up unranked', () => {
    const onGameOver = vi.fn();
    const onRunEnd = vi.fn();
    render(<SnapszerGame onGameOver={onGameOver} onRunEnd={onRunEnd} />);
    click(screen.getByRole('button', { name: /Osztás/ }));
    const settings = screen.getByRole('heading', { name: 'Beállítások' }).parentElement!;
    click(within(settings).getByRole('button', { name: 'Hárman' }));
    expect(screen.getByRole('dialog', { name: 'Módosítod a beállítást?' }).textContent).toContain('nem kerül a ranglistára');
    click(screen.getByRole('button', { name: /Játszom tovább/ }));
    expect(document.querySelectorAll('[data-hand-card]')).toHaveLength(5);
    click(within(settings).getByRole('button', { name: 'Hárman' }));
    click(screen.getByRole('button', { name: 'Módosítom, feladom' }));
    expect(onGameOver).not.toHaveBeenCalled();
    expect(onRunEnd).not.toHaveBeenCalled();
    expect(loadSession('snapszer', SAVE_SCHEMA)).toBeNull();
    click(screen.getByRole('button', { name: /Osztás/ }));
    expect(screen.getByTestId('snapszer-table').getAttribute('data-mode')).toBe('three');
  });

  it('the nines setting deals 24 cards (a 13-card talon) in two-player mode', () => {
    render(<SnapszerGame />);
    const setupCard = screen.getAllByRole('dialog')[0];
    click(within(setupCard).getByRole('checkbox', { name: /Kilencesekkel/ }));
    click(within(setupCard).getByRole('button', { name: /Osztás/ }));
    expect(screen.getByTestId('snapszer-talon').getAttribute('data-count')).toBe('13');
  });
});
