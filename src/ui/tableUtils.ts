import { H_SUITS, type HCard, type HSuit } from '../arcade';
import { rankStrength, type Deal2State, type Deal3State, type Seat } from '../engine';

/** Trump first, then the other suits in deck order; high to low inside a suit. */
export function sortHand(cards: readonly HCard[], trump: HSuit | null): HCard[] {
  const order = (s: HSuit) => (s === trump ? -1 : H_SUITS.indexOf(s));
  return cards.slice().sort((a, b) => order(a.suit) - order(b.suit) || rankStrength(b.rank) - rankStrength(a.rank));
}

type Played = { seat: Seat; card: Deal2State['trick'][number]['card'] };

/** The trick in progress, or the last completed one until the next card is led. */
export function shownTrick(deal: Deal2State | Deal3State): { cards: readonly Played[]; index: number; winner: Seat | null } | null {
  if (deal.trick.length > 0) return { cards: deal.trick, index: deal.tricks.length, winner: null };
  const last = deal.tricks[deal.tricks.length - 1];
  return last ? { cards: last.cards, index: deal.tricks.length - 1, winner: last.winner } : null;
}

