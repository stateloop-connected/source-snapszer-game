import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SnapszerDemo } from './SnapszerDemo';

beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers();
});
afterEach(() => vi.useRealTimers());

const tick = (ms: number) => act(() => void vi.advanceTimersByTime(ms));
const tableText = () => screen.getByTestId('snapszer-table').textContent;

describe('SnapszerDemo', () => {
  it('bots play real deals while active, writing nothing to storage', () => {
    render(<SnapszerDemo active />);
    const start = document.querySelectorAll('[data-hand-card]').length + (tableText() ?? '');
    tick(3000);
    expect(document.querySelectorAll('[data-hand-card]').length + (tableText() ?? '')).not.toBe(start);
    for (let i = 0; i < 80; i += 1) tick(1500);
    expect(screen.getByTestId('snapszer-demo').textContent).toMatch(/Gazsi/);
    expect(localStorage.length).toBe(0);
  });

  it('freezes while inactive', () => {
    const { rerender } = render(<SnapszerDemo active={false} />);
    const frozen = screen.getByTestId('snapszer-demo').innerHTML;
    tick(10000);
    expect(screen.getByTestId('snapszer-demo').innerHTML).toBe(frozen);
    rerender(<SnapszerDemo active />);
    tick(3000);
    expect(screen.getByTestId('snapszer-demo').innerHTML).not.toBe(frozen);
  });
});
