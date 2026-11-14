import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SnapszerDemo } from './SnapszerDemo';

beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers();
});
afterEach(() => vi.useRealTimers());

const tick = (ms: number) => act(() => void vi.advanceTimersByTime(ms));
const demoHtml = () => screen.getByTestId('snapszer-demo').innerHTML;

describe('SnapszerDemo', () => {
  it('draws its own miniature: both seats, the talon with the trump under it, a trick and the hand — no game table', () => {
    const scrollSpy = vi.fn();
    Element.prototype.scrollIntoView = scrollSpy;
    render(<SnapszerDemo active={false} />);
    // Not the game's Table (its container-query and phone-fit layout collapses inside the small portal preview).
    expect(screen.queryByTestId('snapszer-table')).toBeNull();
    expect(screen.getByTestId('snapszer-demo').querySelector('[style*="--snap-fit-h"]')).toBeNull();
    expect(scrollSpy).not.toHaveBeenCalled();
    expect(screen.getByTestId('demo-seat-0').textContent).toMatch(/You/);
    expect(screen.getByTestId('demo-seat-1').textContent).toMatch(/Gazsi/);
    expect(screen.getByTestId('demo-backs').children.length).toBeGreaterThan(0);
    expect(screen.getByTestId('demo-hand').children.length).toBeGreaterThan(0);
    expect(screen.getByTestId('demo-trump-card')).toBeTruthy();
    expect(screen.getByTestId('demo-trick').children.length).toBeGreaterThan(0);
  });

  it('bots play real deals while active, writing nothing to storage', () => {
    render(<SnapszerDemo active />);
    const start = demoHtml();
    tick(3000);
    expect(demoHtml()).not.toBe(start);
    for (let i = 0; i < 80; i += 1) tick(1500);
    expect(screen.getByTestId('demo-seat-1').textContent).toMatch(/Gazsi/);
    expect(localStorage.length).toBe(0);
  });

  it('freezes while inactive', () => {
    const { rerender } = render(<SnapszerDemo active={false} />);
    const frozen = demoHtml();
    tick(10000);
    expect(demoHtml()).toBe(frozen);
    rerender(<SnapszerDemo active />);
    tick(3000);
    expect(demoHtml()).not.toBe(frozen);
  });
});
