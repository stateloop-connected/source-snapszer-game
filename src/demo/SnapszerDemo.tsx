import { useEffect, useState } from 'react';
import { formatNumber, HungarianCard, useDental, useLang, useMessages, type ArcadeDemoProps, type HCard } from '../arcade';
import { cardKey, type Deal2State, type Seat } from '../engine';
import { botStep, nextDeal, startMatch, type Match } from '../game/match';
import { botDelay } from '../game/speed';
import { MESSAGES } from '../i18n';
import { SeatFigure } from '../ui/figures/SeatFigure';
import { suitName } from '../ui/labels';
import { SuitIcon } from '../ui/SuitIcon';
import { shownTrick, sortHand } from '../ui/tableUtils';
import styles from './SnapszerDemo.module.css';

export const DEMO_SEED = 1866;
/** The demo runs faster than Normal play. */
export const DEMO_FACTOR = 0.6;
export const DEMO_DEAL_PAUSE_MS = 2400;

const OPPONENT = 'Gazsi';
const BACK: HCard = { suit: 'piros', rank: 'VII' };

/** Two medium bots; the first frame is already two tricks in with a card led, so even a frozen preview shows play. */
function demoMatch(seed: number): Match {
  let m = startMatch({ mode: 'two', withNines: false, level: 'medium', seed, seats: ['medium', 'medium'] });
  for (let i = 0; i < 40 && m.phase === 'playing'; i += 1) {
    if (m.deal.tricks.length >= 2 && m.deal.trick.length === 1) break;
    m = botStep(m);
  }
  return m;
}

/**
 * Attract mode for the portal card: a two-player deal played by bots on the real engine, drawn as its own miniature
 * sized from the preview box (the game's Table fits itself to a page and collapses in the small box). No phone-fit
 * measuring or scrolling, writes nothing to storage; freezes on its current frame while `active` is false.
 */
export function SnapszerDemo({ active = true }: ArcadeDemoProps) {
  const tr = useMessages(MESSAGES);
  const [lang] = useLang();
  const [dental] = useDental();
  const [m, setM] = useState(() => demoMatch(DEMO_SEED));

  useEffect(() => {
    if (!active) return;
    const ms = m.phase === 'playing' ? botDelay(m.deal) * DEMO_FACTOR : DEMO_DEAL_PAUSE_MS;
    const id = window.setTimeout(
      () =>
        setM((x) => {
          if (x.phase === 'finished') return demoMatch(x.seed + 1);
          if (x.phase === 'dealOver') return nextDeal(x);
          return botStep(x);
        }),
      ms,
    );
    return () => window.clearTimeout(id);
  }, [m, active]);

  const deal = m.deal as Deal2State;
  const turn = m.phase === 'playing' ? deal.turn : null;
  const shown = shownTrick(deal);
  const card = (c: HCard, cls: string, faceDown = false) => (
    <HungarianCard card={c} faceDown={faceDown} dental={dental} size={0} lang={lang} className={cls} />
  );
  const seat = (s: Seat, name: string) => (
    <div className={`${styles.seat}${turn === s ? ` ${styles.turn}` : ''}`} data-testid={`demo-seat-${s}`} data-turn={turn === s ? 'true' : 'false'}>
      <span className={styles.portrait}>
        <SeatFigure seat={s} dental={dental} title={name} />
      </span>
      <span className={styles.info}>
        <strong className={styles.name}>
          {turn === s && <span aria-hidden="true">▶ </span>}
          {name}
        </strong>
        <span>{tr('tricksWon', { n: formatNumber(deal.tricks.filter((t) => t.winner === s).length, lang) })}</span>
      </span>
    </div>
  );

  return (
    <div className="arc-demo" aria-hidden="true">
      <div className={styles.demo} data-testid="snapszer-demo" data-active={active ? 'true' : 'false'}>
        <div className={styles.table}>
          {seat(1, OPPONENT)}
          <div className={styles.backs} data-testid="demo-backs">
            {deal.hands[1].map((_, i) => (
              <span key={i}>{card(BACK, styles.back, true)}</span>
            ))}
          </div>

          <div className={styles.stock}>
            <div className={styles.talon}>
              {deal.trumpCard && (
                <span className={styles.trumpUnder} data-testid="demo-trump-card">
                  {card(deal.trumpCard, styles.trumpCard)}
                </span>
              )}
              {deal.talon.length > 0 && card(BACK, styles.talonCard, true)}
            </div>
            {deal.trump && (
              <span className={styles.caption}>
                {tr('trumpIs', { suit: '' }).trim()} <SuitIcon suit={deal.trump} size={12} /> {suitName(deal.trump, tr)}
              </span>
            )}
          </div>
          <div className={styles.trick} data-testid="demo-trick">
            {shown?.cards.map((pc) => (
              <span key={pc.seat} className={pc.seat === 0 ? styles.mine : styles.theirs} data-played-by={pc.seat}>
                {card(pc.card, styles.trickCard)}
              </span>
            ))}
          </div>

          {seat(0, tr('you'))}
          <div className={styles.hand} data-testid="demo-hand">
            {sortHand(deal.hands[0], deal.trump).map((c) => (
              <span key={cardKey(c)} data-hand-card={cardKey(c)}>
                {card(c, styles.handCard)}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SnapszerDemo;
