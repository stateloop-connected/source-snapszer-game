import { HungarianCard, type Lang } from '../arcade';
import type { Deal2State, Deal3State, Seat } from '../engine';
import { suitName, type Tr } from './labels';
import { shownTrick } from './tableUtils';
import { SuitIcon } from './SuitIcon';
import styles from './Centre.module.css';

const POS3: Record<Seat, string> = { 0: 'south', 1: 'east', 2: 'west' };

export type CentreProps = {
  deal: Deal2State | Deal3State;
  name: (s: Seat) => string;
  lang: Lang;
  tr: Tr;
  fmt: (n: number) => string;
  dental: boolean;
};

/** Centre of the table: trump, talon (two players) and the trick. */
export function Centre({ deal, name, lang, tr, fmt, dental }: CentreProps) {
  const shown = shownTrick(deal);
  const back = (cls: string, key?: number) => (
    <HungarianCard key={key} card={{ suit: 'piros', rank: 'VII' }} faceDown dental={dental} size={0} lang={lang} className={cls} />
  );
  const trump = deal.trump;
  const kontraFactor = deal.mode === 'two' ? (deal.kontra.game !== null || deal.kontra.snapszer !== null ? 2 : 1) : 2 ** deal.kontra.level;
  const snapszerBy = deal.mode === 'two' ? (deal.snapszer?.by ?? null) : deal.snapszer ? deal.caller : null;

  return (
    <div className={`${styles.centre} ${deal.mode === 'two' ? styles.two : styles.three}`} data-testid="snapszer-centre">
      <div className={styles.stock}>
        {deal.mode === 'two' ? (
          <div className={styles.talon} data-testid="snapszer-talon" data-count={deal.talon.length} data-closed={deal.closed ? 'true' : 'false'}>
            {deal.trumpCard || deal.talon.length > 0 ? (
              <div className={`${styles.pile}${deal.closed ? ` ${styles.closed}` : ''}`}>
                {deal.trumpCard && (
                  <span className={styles.trumpUnder} data-testid="snapszer-trump-card">
                    <HungarianCard card={deal.trumpCard} size={0} lang={lang} className={styles.trumpCard} />
                  </span>
                )}
                {deal.talon.length > 0 && (
                  <span className={styles.stack} aria-hidden="true">
                    {[0, 1, 2].slice(0, Math.min(3, deal.talon.length)).map((i) => back(styles.stackCard, i))}
                  </span>
                )}
              </div>
            ) : null}
            <span className={styles.caption}>
              {deal.closed ? (
                <strong>
                  <span aria-hidden="true">✕ </span>
                  {tr('talonClosed', { name: name(deal.closed.by) })}
                </strong>
              ) : deal.talon.length > 0 || deal.trumpCard ? (
                <>
                  {tr('talon')} · {tr('talonCount', { n: fmt(deal.talon.length) })}
                </>
              ) : (
                tr('talonEmpty')
              )}
            </span>
          </div>
        ) : (
          deal.trumpCard && (
            <figure className={styles.named} data-testid="snapszer-trump-card">
              <HungarianCard card={deal.trumpCard} size={0} lang={lang} className={styles.namedCard} />
              <figcaption className={styles.caption}>
                {tr('callerCard')}: {name(deal.caller)}
              </figcaption>
            </figure>
          )
        )}
        <span className={styles.trump} data-testid="snapszer-trump">
          {trump ? (
            <>
              <SuitIcon suit={trump} size={18} /> {tr('trumpIs', { suit: suitName(trump, tr) })}
            </>
          ) : (
            tr('trumpIs', { suit: '—' })
          )}
        </span>
        {(snapszerBy !== null || kontraFactor > 1) && (
          <span className={styles.tags}>
            {snapszerBy !== null && <strong className={styles.tag}>{tr('snapszerTag', { name: name(snapszerBy) })}</strong>}
            {kontraFactor > 1 && <strong className={styles.tag}>{tr('kontraTag', { factor: fmt(kontraFactor) })}</strong>}
          </span>
        )}
      </div>

      <div className={styles.trick} data-testid="snapszer-trick" aria-live="polite">
        {shown && (
          <>
            <span className={styles.caption}>
              {tr('trickN', { n: fmt(shown.index + 1) })}
              {shown.winner !== null && ` · ${tr('takes', { name: name(shown.winner) })}`}
            </span>
            <div className={styles.trickCards}>
              {shown.cards.map((pc, i) => (
                <figure
                  key={pc.seat}
                  className={`${styles.played} ${deal.mode === 'two' ? (pc.seat === 0 ? styles.south : styles.north) : styles[POS3[pc.seat]]}`}
                  data-played-by={pc.seat}
                  style={{ zIndex: i + 1 }}
                >
                  <HungarianCard card={pc.card} size={0} lang={lang} className={styles.trickCard} />
                  <figcaption>
                    {shown.winner === pc.seat && <span aria-hidden="true">★ </span>}
                    {name(pc.seat)}
                  </figcaption>
                </figure>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Centre;
