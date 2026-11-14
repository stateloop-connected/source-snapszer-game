import type { HCard, HSuit } from '../arcade';
import { isTalonOpen, legalPlays, legalPlays3, rankStrength, sameCard, type Deal2State, type Deal3State } from '../engine';

export type IllegalReason = 'follow' | 'beat' | 'trump' | 'overtrump' | 'marriage';

const beats = (card: HCard, best: HCard, trump: HSuit) =>
  card.suit === best.suit ? rankStrength(card.rank) > rankStrength(best.rank) : card.suit === trump;

/**
 * Why seat 0 may not play `card` now (null when it may). Only explains the engine's own `legalPlays` — it never
 * decides legality itself.
 */
export function illegalReason(deal: Deal2State | Deal3State, card: HCard): IllegalReason | null {
  const legal = deal.mode === 'two' ? legalPlays(deal, 0) : legalPlays3(deal, 0);
  if (legal.length === 0 || legal.some((c) => sameCard(c, card))) return null;
  if (deal.trick.length === 0) return 'marriage';
  const trump = deal.trump as HSuit;
  const led = deal.trick[0].card;
  const hand = deal.hands[0];
  if (hand.some((c) => c.suit === led.suit)) return card.suit === led.suit ? 'beat' : 'follow';
  if (deal.mode === 'two' && isTalonOpen(deal)) return null;
  const best = deal.trick.reduce((b, p) => (beats(p.card, b.card, trump) ? p : b)).card;
  return card.suit === trump && !beats(card, best, trump) ? 'overtrump' : 'trump';
}
