import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { applyDental, applyLang, formatNumber, loadSession } from './arcade';
import { SAVE_SCHEMA } from './game/save';
import { matchScore } from './game/score';
import { canFinishNow } from './game/finish';
import { SnapszerGame } from './SnapszerGame';
import { findMatch, humanTurn, save } from './test/fixtures';

beforeEach(() => {
  localStorage.clear();
  applyDental(false, { silent: true });
  applyLang('hu', { silent: true });
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
  applyLang('en', { silent: true });
});

const key = (k: string) => act(() => void fireEvent.keyDown(window, { key: k }));
const click = (el: Element) => act(() => void fireEvent.click(el));
const tick = (ms: number) => act(() => void vi.advanceTimersByTime(ms));
const finishBtn = () => screen.queryByRole('button', { name: 'Befejezés' }) as HTMLButtonElement | null;
const stat = (label: string) => screen.getByText(label, { selector: 'dt' }).parentElement?.querySelector('dd')?.textContent;

/** A saved match between two deals, you ahead on units, so the Finish value is above 0. */
function resumeBetweenDeals() {
  const m = findMatch((x) => x.phase === 'dealOver' && x.units[0] > x.units[1] && x.deals.length >= 1);
  save(m, 90);
  return m;
}

describe('Snapszer finish early (only between deals)', () => {
  it('is hidden before the match starts and offered once it runs, before the first move', () => {
    render(<SnapszerGame />);
    expect(finishBtn()).toBeNull();
    click(screen.getByRole('button', { name: /Osztás/ }));
    expect(finishBtn()).toBeTruthy();
    expect(finishBtn()!.disabled).toBe(false);
  });

  it('a finish at the start ranks 0 once (matchScore of no completed deals)', () => {
    const onGameOver = vi.fn();
    render(<SnapszerGame onGameOver={onGameOver} />);
    click(screen.getByRole('button', { name: /Osztás/ }));
    expect(stat('Pont')).toBe(formatNumber(0, 'hu'));
    click(finishBtn()!);
    expect(screen.getByRole('alertdialog').textContent).toContain(`Befejezed a játékot? ${formatNumber(0, 'hu')} pont kerül a ranglistára.`);
    click(screen.getByRole('button', { name: 'Befejezem' }));
    expect(onGameOver).toHaveBeenCalledTimes(1);
    expect(onGameOver).toHaveBeenCalledWith(0, { finished: true });
    expect(screen.getByRole('dialog', { name: 'Idő előtt befejezve' })).toBeTruthy();
  });

  it('is not possible in the middle of a deal: the button is disabled and explains when it is', () => {
    const m = findMatch((x) => humanTurn(x) && x.deal.tricks.length >= 1);
    expect(canFinishNow(m)).toBe(false);
    save(m, 30);
    const onGameOver = vi.fn();
    render(<SnapszerGame onGameOver={onGameOver} />);
    key('p');
    expect(finishBtn()!.disabled).toBe(true);
    expect(finishBtn()!.getAttribute('title')).toBe('Befejezni két osztás között lehet.');
    click(finishBtn()!);
    expect(screen.queryByRole('alertdialog')).toBeNull();
    expect(onGameOver).not.toHaveBeenCalled();
  });

  it('between deals: confirms with the Score panel value (completed deals, no win bonus), ranks it once, shows the finished card', () => {
    const m = resumeBetweenDeals();
    const score = matchScore(m, false);
    expect(score).toBeGreaterThan(0);
    const onGameOver = vi.fn();
    render(<SnapszerGame onGameOver={onGameOver} />);
    key('p');
    expect(stat('Pont')).toBe(formatNumber(score, 'hu'));
    click(finishBtn()!);
    expect(screen.getByRole('alertdialog').textContent).toContain(`Befejezed a játékot? ${formatNumber(score, 'hu')} pont kerül a ranglistára.`);
    click(screen.getByRole('button', { name: 'Befejezem' }));
    expect(onGameOver).toHaveBeenCalledTimes(1);
    expect(onGameOver).toHaveBeenCalledWith(score, { finished: true });
    const card = screen.getByRole('dialog', { name: 'Idő előtt befejezve' });
    expect(card.textContent).toContain(`${formatNumber(score, 'hu')} pontot szereztél.`);
    expect(card.textContent).toContain(`${formatNumber(m.deals.length, 'hu')} osztás`);
    expect(loadSession('snapszer', SAVE_SCHEMA)).toBeNull();
    act(() => void window.dispatchEvent(new Event('pagehide')));
    tick(5000);
    expect(onGameOver).toHaveBeenCalledTimes(1);
    expect(loadSession('snapszer', SAVE_SCHEMA)).toBeNull();
    expect(finishBtn()).toBeNull();
  });

  it('Cancel changes nothing', () => {
    const m = resumeBetweenDeals();
    const onGameOver = vi.fn();
    render(<SnapszerGame onGameOver={onGameOver} />);
    key('p');
    click(finishBtn()!);
    click(screen.getByRole('button', { name: 'Mégse' }));
    expect(screen.queryByRole('alertdialog')).toBeNull();
    expect(onGameOver).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog', { name: `${formatNumber(m.dealNo, 'hu')}. osztás vége` })).toBeTruthy();
    expect(stat('Pont')).toBe(formatNumber(matchScore(m, false), 'hu'));
  });

  it('the bots and the clock stand still while the confirm is open', () => {
    const m = findMatch((x) => x.phase === 'playing' && x.deal.log.length === 1 && x.deal.turn !== 0 && x.dealNo > 1);
    expect(canFinishNow(m)).toBe(true);
    save(m, 30);
    render(<SnapszerGame />);
    key('p');
    click(finishBtn()!);
    const time = stat('Idő');
    tick(10_000);
    expect(stat('Idő')).toBe(time);
    act(() => void window.dispatchEvent(new Event('pagehide')));
    expect(loadSession<typeof m>('snapszer', SAVE_SCHEMA)?.data.deal.log.length).toBe(m.deal.log.length);
  });
});
