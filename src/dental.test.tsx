import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { applyDental, applyLang } from './arcade';
import { SnapszerGame } from './SnapszerGame';
import { findMatch, humanTurn, save, savedMatch } from './test/fixtures';

beforeEach(() => {
  localStorage.clear();
  applyLang('en', { silent: true });
  vi.useFakeTimers();
});
afterEach(() => {
  applyDental(false, { silent: true });
  vi.useRealTimers();
});

const key = (k: string) => act(() => void fireEvent.keyDown(window, { key: k }));
const table = () => screen.getByTestId('snapszer-table');
const faces = () => [...document.querySelectorAll('[data-hand-card] [data-card]')].map((el) => el.getAttribute('data-card')).join(' ');

function resume(mode: 'two' | 'three' = 'two') {
  const m = findMatch((x) => humanTurn(x) && x.deal.tricks.length >= 1, { mode });
  save(m, 30);
  render(<SnapszerGame />);
  key('p');
  return m;
}

describe('dental mode changes only the card backs and the portraits', () => {
  it('three players: dentist, dental technician and orthodontist, and a tooth on the backs', () => {
    applyDental(true);
    resume('three');
    expect(table().getAttribute('data-dental')).toBe('true');
    const figs = screen.getAllByTestId('snapszer-figure-dental');
    expect(figs.map((f) => f.getAttribute('data-figure'))).toEqual(['rozi', 'gazsi', 'player']);
    expect(figs[0].querySelector('[data-tool="braces"]')).not.toBeNull();
    expect(figs[1].querySelector('[data-tool="loupes"]')).not.toBeNull();
    expect(figs[2].querySelector('[data-tool="head-mirror"]')).not.toBeNull();
    expect(screen.queryByTestId('snapszer-figure-classic')).toBeNull();
    expect(screen.getAllByTestId('hcard-back-tooth').length).toBeGreaterThan(0);
    expect(screen.queryByTestId('hcard-back-classic')).toBeNull();
  });

  it('off: the classic figures (cap, headscarf) and backs', () => {
    resume('three');
    const figs = screen.getAllByTestId('snapszer-figure-classic');
    expect(figs).toHaveLength(3);
    expect(figs[0].querySelector('[data-outfit="headscarf"]')).not.toBeNull();
    expect(figs[1].querySelector('[data-outfit="cap"]')).not.toBeNull();
    expect(screen.queryByTestId('hcard-back-tooth')).toBeNull();
  });

  it('toggling it mid-deal keeps the deal, the card faces and the clock', () => {
    const m = resume();
    const before = faces();
    act(() => void fireEvent.click(screen.getByRole('checkbox', { name: /Dental mode/ })));
    expect(table().getAttribute('data-dental')).toBe('true');
    expect(faces()).toBe(before);
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(savedMatch()?.deal.log.length).toBe(m.deal.log.length);
  });
});
