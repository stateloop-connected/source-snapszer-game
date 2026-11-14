import type { ReactNode } from 'react';
import { HungarianCard, type HSuit, type Lang } from '../arcade';
import type { Seat as SeatNo } from '../engine';
import styles from './Seat.module.css';

export type SeatMarriage = { suit: HSuit; points: number; label: string; text: string };

export type SeatProps = {
  seat: SeatNo;
  name: string;
  /** Match units, already formatted („2 / 7”). */
  units: string;
  isTurn: boolean;
  /** Dealer, caller, defender … (text badges; the turn has its own framed badge). */
  badges: readonly string[];
  figure: ReactNode;
  /** Opponents: cards in hand, drawn as backs only. Omitted for you (your hand is drawn below). */
  backs?: number;
  /** Won tricks: a face-down pile with a count. */
  tricks: number;
  tricksText: string;
  pileLabel: string;
  marriages: readonly SeatMarriage[];
  /** Your own counted points (only with „Pontok mutatása”), already worded. */
  points?: string | null;
  dental: boolean;
  lang: Lang;
  labels: { onTurn: string; cards: string; seat: string };
  position: 'bottom' | 'top' | 'left' | 'right';
};

/**
 * A seat: portrait, name, units and badges, the won-trick pile and the announced 20 / 40 (a small K + F pair with
 * its value). The turn is a framed ▶ badge and a thicker outline, never colour alone.
 */
export function Seat(p: SeatProps) {
  return (
    <section
      className={`${styles.seat} ${styles[p.position]}${p.isTurn ? ` ${styles.turn}` : ''}`}
      aria-label={p.labels.seat}
      aria-current={p.isTurn ? 'true' : undefined}
      data-seat={p.seat}
      data-turn={p.isTurn ? 'true' : 'false'}
    >
      <div className={styles.figure}>{p.figure}</div>
      <div className={styles.info}>
        <span className={styles.name}>
          {p.name} <span className={styles.units} data-testid={`seat-units-${p.seat}`}>{p.units}</span>
        </span>
        <span className={styles.badges}>
          {p.isTurn && (
            <span className={`${styles.badge} ${styles.turnBadge}`} data-testid={`seat-turn-${p.seat}`}>
              <span aria-hidden="true">▶ </span>
              {p.labels.onTurn}
            </span>
          )}
          {p.badges.map((b) => (
            <span key={b} className={styles.badge}>
              {b}
            </span>
          ))}
        </span>
        {p.points && (
          <span className={styles.points} data-testid="snapszer-my-points">
            {p.points}
          </span>
        )}
      </div>
      <div className={styles.extras}>
        {p.backs !== undefined && p.backs > 0 && (
          <div className={styles.backs} aria-label={p.labels.cards} role="img" data-testid={`seat-backs-${p.seat}`}>
            {Array.from({ length: p.backs }, (_, i) => (
              <HungarianCard key={i} card={{ suit: 'piros', rank: 'VII' }} faceDown dental={p.dental} size={0} lang={p.lang} className={styles.back} />
            ))}
          </div>
        )}
        <div className={styles.pile} role="img" aria-label={p.pileLabel} data-testid={`seat-pile-${p.seat}`} data-tricks={p.tricks}>
          {p.tricks > 0 ? (
            <>
              <span className={styles.pileStack} aria-hidden="true">
                <HungarianCard card={{ suit: 'piros', rank: 'VII' }} faceDown dental={p.dental} size={0} lang={p.lang} className={styles.pileCard} />
                {p.tricks > 1 && (
                  <HungarianCard card={{ suit: 'piros', rank: 'VII' }} faceDown dental={p.dental} size={0} lang={p.lang} className={`${styles.pileCard} ${styles.pileTop}`} />
                )}
              </span>
              <span className={styles.pileCount} aria-hidden="true">
                {p.tricksText}
              </span>
            </>
          ) : (
            <span className={styles.pileEmpty} aria-hidden="true">
              {p.tricksText}
            </span>
          )}
        </div>
        {p.marriages.map((m) => (
          <figure key={m.suit} className={styles.marriage} role="img" aria-label={m.label} data-marriage={m.suit} data-points={m.points}>
            <span className={styles.pair} aria-hidden="true">
              <HungarianCard card={{ suit: m.suit, rank: 'kiraly' }} size={0} lang={p.lang} className={styles.mini} />
              <HungarianCard card={{ suit: m.suit, rank: 'felso' }} size={0} lang={p.lang} className={`${styles.mini} ${styles.miniSecond}`} />
            </span>
            <figcaption aria-hidden="true">{m.text}</figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

export default Seat;
