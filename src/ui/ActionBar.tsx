import type { ReactNode } from 'react';
import styles from './ActionBar.module.css';

export type BarButton = {
  id: string;
  label: ReactNode;
  /** Accessible name when the label is not plain text. */
  name?: string;
  title?: string;
  disabled: boolean;
  primary?: boolean;
  onClick(): void;
  /** Several buttons sharing this one cell (the 20 / 40 suits), so the grid never grows a row. */
  split?: readonly BarButton[];
};

export type ActionBarProps = {
  label: string;
  /** What the moment asks for (▶ when it is your move). */
  prompt: string;
  mine: boolean;
  notice: string | null;
  /** The play / trump button for the card raised on a touch screen. */
  play: BarButton | null;
  buttons: readonly BarButton[];
  /** Touch layout: thumb-sized buttons in a fixed grid, so the bar never changes height during a deal. */
  bar: boolean;
};

/**
 * The announcements of the moment as buttons: always the same set in the same place during a deal (disabled when
 * not allowed now), so nothing jumps under your thumb.
 */
export function ActionBar(p: ActionBarProps) {
  return (
    <section className={`arc-panel ${styles.panel}${p.bar ? ` ${styles.bar}` : ''}`} aria-label={p.label} data-testid="snapszer-actions" data-bar={p.bar ? 'bottom' : undefined}>
      <div className={styles.head}>
        {p.notice ? (
          <p className={styles.notice} role="alert" data-testid="snapszer-notice">
            <span aria-hidden="true">⚠ </span>
            {p.notice}
          </p>
        ) : (
          <p className={styles.prompt} data-testid="snapszer-prompt">
            {p.mine && <span aria-hidden="true">▶ </span>}
            {p.prompt}
          </p>
        )}
        {p.play && (
          <button type="button" className="arc-btn arc-btn--primary" disabled={p.play.disabled} onClick={p.play.onClick} title={p.play.title}>
            {p.play.label}
          </button>
        )}
      </div>
      {p.buttons.length > 0 && (
        <div className={styles.buttons} role="group" aria-label={p.label}>
          {p.buttons.map((b) =>
            b.split ? (
              <div key={b.id} className={styles.split} data-cell={b.id}>
                {b.split.map((x) => (
                  <button key={x.id} type="button" className="arc-btn" disabled={x.disabled} title={x.title} aria-label={x.name} data-action={x.id} onClick={x.onClick}>
                    {x.label}
                  </button>
                ))}
              </div>
            ) : (
            <button
              key={b.id}
              type="button"
              className={`arc-btn${b.primary ? ' arc-btn--primary' : ''}`}
              disabled={b.disabled}
              title={b.title}
              aria-label={b.name}
              data-action={b.id}
              onClick={b.onClick}
            >
              {b.label}
            </button>
            ),
          )}
        </div>
      )}
    </section>
  );
}

export default ActionBar;
