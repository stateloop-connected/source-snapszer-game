import type { CSSProperties } from 'react';
import { HungarianCard, type HCard, type HSuit, type Lang } from '../arcade';
import { cardKey } from '../engine';
import { sortHand } from './tableUtils';
import { RANK_SHORT } from './labels';
import { SuitIcon } from './SuitIcon';
import styles from './Hand.module.css';

export type HandProps = {
  cards: readonly HCard[];
  trump: HSuit | null;
  lang: Lang;
  label: string;
  /** Key (`cardKey`) of the card raised on a touch screen (or the trump being chosen). */
  selected?: string | null;
  /** Keys of the cards that may be played now; the others are hatched (still tappable, for the reason). */
  playable?: ReadonlySet<string> | null;
  /** Null makes the hand read-only. */
  onCard?: ((card: HCard) => void) | null;
  /** Eight cards: on an upright phone they lay out in two overlapping rows of four, so every card shows a wide strip. */
  rows?: boolean;
};

/**
 * Your cards as buttons (more than five overlap, and then every card carries a corner index with rank and suit), sized from the hand's own width and the table's height (never the viewport), so five or
 * eight cards fit on a 360 px phone, in landscape and in full screen. Overlapping cards keep a corner index.
 */
export function Hand({ cards, trump, lang, label, selected = null, playable = null, onCard = null, rows = false }: HandProps) {
  const sorted = sortHand(cards, trump);
  return (
    <ul className={`${styles.hand}${rows ? ` ${styles.rows}` : ''}`} aria-label={label} data-testid="snapszer-hand" data-rows={rows ? 'true' : 'false'} style={{ '--n': Math.max(1, sorted.length) } as CSSProperties}>
      {sorted.map((card) => {
        const key = cardKey(card);
        const isSel = selected === key;
        const dim = playable !== null && !playable.has(key);
        return (
          <li key={key} className={styles.slot}>
            <button
              type="button"
              className={`${styles.cardBtn}${dim ? ` ${styles.dim}` : ''}`}
              disabled={onCard === null}
              aria-pressed={onCard ? isSel : undefined}
              data-hand-card={key}
              data-playable={playable === null ? undefined : dim ? 'false' : 'true'}
              onClick={() => onCard?.(card)}
            >
              <HungarianCard card={card} size={0} lang={lang} selected={isSel} className={styles.card} />
              {sorted.length > 5 && <span className={styles.corner} data-corner-index="" data-suit={card.suit} aria-hidden="true">
                {RANK_SHORT[lang][card.rank]}
                <SuitIcon suit={card.suit} size={11} />
              </span>}
              {dim && <span className={styles.hatch} aria-hidden="true" />}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export default Hand;
