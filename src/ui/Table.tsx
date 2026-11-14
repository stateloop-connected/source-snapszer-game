import type { CSSProperties, ReactNode } from 'react';
import type { Lang } from '../arcade';
import type { Deal2State, Deal3State, Seat as SeatNo } from '../engine';
import { Centre } from './Centre';
import { Hand, type HandProps } from './Hand';
import { suitName, type Tr } from './labels';
import { Seat } from './Seat';
import styles from './Table.module.css';

export type TableProps = {
  deal: Deal2State | Deal3State;
  /** Match units per seat. */
  units: Readonly<Record<SeatNo, number>>;
  target: number;
  name: (s: SeatNo) => string;
  figure: (s: SeatNo) => ReactNode;
  lang: Lang;
  tr: Tr;
  fmt: (n: number) => string;
  dental: boolean;
  /** Whose turn is highlighted (null while nobody is to move: paused, between deals). */
  turn: SeatNo | null;
  /** Your counted points, worded (only with „Pontok mutatása”); never the bots'. */
  myPoints: string | null;
  /** The bottom hand (seat 0). */
  hand: Omit<HandProps, 'cards' | 'trump' | 'lang' | 'label'>;
  /** Touch screens: the table fills a fixed height and sizes its cards from it as well. */
  fit?: boolean;
};

/**
 * The table seen from seat 0: you at the bottom, the opponent on top (two players) or the two opponents top-left
 * (seat 2) and top-right (seat 1), the trump, talon and trick in the centre. Only seat 0's cards are face up.
 */
export function Table({ deal, units, target, name, figure, lang, tr, fmt, dental, turn, myPoints, hand, fit = false }: TableProps) {
  const tricksOf = (s: SeatNo) => (deal.tricks as readonly { winner: SeatNo }[]).filter((t) => t.winner === s).length;
  const seat = (s: SeatNo, position: 'bottom' | 'top' | 'left' | 'right') => {
    const u = tr('unitsShort', { units: fmt(units[s]), target: fmt(target) });
    const badges: string[] = [];
    if (deal.dealer === s) badges.push(tr('dealer'));
    if (deal.mode === 'three') badges.push(deal.caller === s ? `★ ${tr('caller')}` : tr('defender'));
    const n = tricksOf(s);
    return (
      <Seat
        seat={s}
        name={name(s)}
        units={u}
        isTurn={turn === s}
        badges={badges}
        figure={figure(s)}
        backs={s === 0 ? undefined : deal.hands[s as 0].length}
        tricks={n}
        tricksText={tr('tricksWon', { n: fmt(n) })}
        pileLabel={tr('pileLabel', { name: name(s), n: fmt(n) })}
        marriages={deal.marriages
          .filter((m) => m.seat === s)
          .map((m) => ({
            suit: m.suit,
            points: m.points,
            text: fmt(m.points),
            label: tr('marriageLabel', { name: name(s), points: fmt(m.points), suit: suitName(m.suit, tr) }),
          }))}
        points={s === 0 ? myPoints : null}
        dental={dental}
        lang={lang}
        position={position}
        labels={{
          onTurn: tr('onTurn'),
          cards: tr('cardsCount', { n: fmt(deal.hands[s as 0].length) }),
          seat: tr('seatLabel', { name: name(s), units: u }),
        }}
      />
    );
  };
  const three = deal.mode === 'three';
  // Card slots across the hand: five cards side by side; eight overlap a little (four, while naming the trump, do not).
  const slots = three ? (deal.hands[0].length <= 4 ? 4.6 : 5.4) : 5;
  return (
    <div
      style={{ '--slots': slots } as CSSProperties}
      className={`${styles.table} ${three ? styles.three : styles.two}${fit ? ` ${styles.fit}` : ''}`} data-testid="snapszer-table" data-mode={deal.mode} data-dental={dental ? 'true' : 'false'}>
      <div className={styles.top}>
        {three ? (
          <>
            {seat(2, 'left')}
            {seat(1, 'right')}
          </>
        ) : (
          seat(1, 'top')
        )}
      </div>
      <div className={styles.mid}>
        <Centre deal={deal} name={name} lang={lang} tr={tr} fmt={fmt} dental={dental} />
      </div>
      <div className={styles.me}>{seat(0, 'bottom')}</div>
      <div className={styles.hand}>
        <Hand cards={deal.hands[0]} trump={deal.trump} lang={lang} label={tr('yourHand')} rows={three && deal.hands[0].length > 5} {...hand} />
      </div>
    </div>
  );
}

export default Table;
