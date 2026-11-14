import { useCallback, useEffect, useState } from 'react';
import { formatNumber, useDental, useLang, useMessages, type ArcadeDemoProps } from '../arcade';
import type { Seat, SnapszerMode } from '../engine';
import { botStep, nextDeal, startMatch, TARGET_UNITS, type Match } from '../game/match';
import { botDelay } from '../game/speed';
import { MESSAGES } from '../i18n';
import { SeatFigure } from '../ui/figures/SeatFigure';
import { Table } from '../ui/Table';
import styles from './SnapszerDemo.module.css';

export const DEMO_SEED = 1866;
/** The demo runs faster than Normal play. */
export const DEMO_FACTOR = 0.6;
export const DEMO_DEAL_PAUSE_MS = 2400;

const NAMES = { 1: 'Gazsi', 2: 'Rozi' } as const;

/** Medium bots in every seat; each new match switches between two and three players. */
const demoMatch = (seed: number, mode: SnapszerMode): Match =>
  startMatch({ mode, withNines: false, level: 'medium', seed, seats: mode === 'two' ? ['medium', 'medium'] : ['medium', 'medium', 'medium'] });

/**
 * Attract mode for the portal card: bots play real deals on the real engine, one move per beat. Writes nothing to
 * storage; freezes on its current frame while `active` is false.
 */
export function SnapszerDemo({ active = true }: ArcadeDemoProps) {
  const tr = useMessages(MESSAGES);
  const [lang] = useLang();
  const [dental] = useDental();
  const [m, setM] = useState(() => demoMatch(DEMO_SEED, 'two'));

  useEffect(() => {
    if (!active) return;
    const ms = m.phase === 'playing' ? botDelay(m.deal) * DEMO_FACTOR : DEMO_DEAL_PAUSE_MS;
    const id = window.setTimeout(
      () =>
        setM((x) => {
          if (x.phase === 'finished') return demoMatch(x.seed + 1, x.mode === 'two' ? 'three' : 'two');
          if (x.phase === 'dealOver') return nextDeal(x);
          return botStep(x);
        }),
      ms,
    );
    return () => window.clearTimeout(id);
  }, [m, active]);

  const name = useCallback((s: Seat) => (s === 0 ? tr('you') : NAMES[s]), [tr]);
  const fmt = useCallback((n: number) => formatNumber(n, lang), [lang]);
  return (
    <div className={styles.demo} data-testid="snapszer-demo" data-active={active ? 'true' : 'false'} aria-hidden="true">
      <Table
        deal={m.deal}
        units={m.units}
        target={TARGET_UNITS}
        name={name}
        figure={(s) => <SeatFigure seat={s} dental={dental} title={name(s)} />}
        lang={lang}
        tr={tr}
        fmt={fmt}
        dental={dental}
        turn={m.phase === 'playing' ? m.deal.turn : null}
        myPoints={null}
        hand={{ onCard: null }}
      />
    </div>
  );
}

export default SnapszerDemo;
