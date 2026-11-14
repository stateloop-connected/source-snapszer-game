import { useEffect, useRef } from 'react';
import type { Lang } from '../arcade';
import type { LogEntry, LogEntry3, Seat } from '../engine';
import type { Tr } from './labels';
import { logLines } from './logLines';
import styles from './LogPanel.module.css';

/** Readable log of the current deal; keeps the newest line in view. */
export function LogPanel({ log, dealNo, name, tr, lang, fmt }: { log: readonly (LogEntry | LogEntry3)[] | null; dealNo: number; name: (s: Seat) => string; tr: Tr; lang: Lang; fmt: (n: number) => string }) {
  const lines = log ? logLines(log, name, tr, lang, fmt) : [];
  const list = useRef<HTMLOListElement>(null);
  useEffect(() => {
    const el = list.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines.length]);
  return (
    <section className="arc-panel" aria-label={tr('panelLog')}>
      <h2 className="arc-panel__title">
        {tr('panelLog')}
        {log && <span className={styles.deal}> · {tr('logDealHead', { n: fmt(dealNo) })}</span>}
      </h2>
      {lines.length === 0 ? (
        <p className={styles.empty}>{tr('logEmpty')}</p>
      ) : (
        <ol className={styles.list} ref={list} role="log" data-testid="snapszer-log">
          {lines.map((l) => (
            <li key={l.id} className={styles[l.kind]}>
              {l.text}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

export default LogPanel;
