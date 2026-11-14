import { hCardLabel, type Lang } from '../arcade';
import type { DealResult, Deal3Result, LogEntry, LogEntry3, Seat } from '../engine';
import { REASON_KEY, suitName, type Tr } from './labels';

export type LogLine = { id: number; kind: 'info' | 'play' | 'trick'; text: string };

const KONTRA_WORD = { 1: 'kontraBtn', 2: 'rekontraBtn', 3: 'subkontraBtn' } as const;

/** Seats that won the deal and the units each got. */
export function winners(result: DealResult | Deal3Result): { seats: Seat[]; units: number } {
  if ('units' in result && typeof result.units === 'number') return { seats: [(result as DealResult).winner], units: result.units };
  const u = (result as Deal3Result).units;
  const seats = ([0, 1, 2] as Seat[]).filter((s) => u[s] > 0);
  return { seats, units: seats.length > 0 ? u[seats[0]] : 0 };
}

/** The deal's log as readable lines (cards by their deck names, numbers through `fmt`). */
export function logLines(log: readonly (LogEntry | LogEntry3)[], name: (s: Seat) => string, tr: Tr, lang: Lang, fmt: (n: number) => string): LogLine[] {
  return log.map((e, id): LogLine => {
    switch (e.type) {
      case 'deal':
        return 'caller' in e
          ? { id, kind: 'info', text: tr('logDealCaller', { dealer: name(e.dealer), caller: name(e.caller) }) }
          : { id, kind: 'info', text: `${tr('logDeal', { dealer: name(e.dealer) })} ${tr('logTrumpCard', { card: hCardLabel(e.trumpCard, lang) })}` };
      case 'trump':
        return { id, kind: 'info', text: tr('logTrump', { name: name(e.seat), suit: suitName(e.card.suit, tr), card: hCardLabel(e.card, lang) }) };
      case 'play':
        return { id, kind: 'play', text: tr('logPlay', { name: name(e.seat), card: hCardLabel(e.card, lang) }) };
      case 'trick':
        return { id, kind: 'trick', text: tr('logTrick', { n: fmt(e.index + 1), name: name(e.winner) }) };
      case 'exchange':
        return { id, kind: 'info', text: tr('logExchange', { name: name(e.seat) }) };
      case 'close':
        return { id, kind: 'info', text: tr('logClose', { name: name(e.seat) }) };
      case 'marriage':
        return { id, kind: 'info', text: tr('logMarriage', { name: name(e.seat), points: fmt(e.points), suit: suitName(e.suit, tr) }) };
      case 'declare':
        return { id, kind: 'info', text: tr('logDeclare', { name: name(e.seat), points: fmt(e.points) }) };
      case 'snapszer':
        return { id, kind: 'info', text: tr('logSnapszer', { name: name(e.seat) }) };
      case 'kontra': {
        const word = 'level' in e ? tr(KONTRA_WORD[e.level]) : tr('kontraBtn');
        return { id, kind: 'info', text: tr('logKontra', { name: name(e.seat), word }) };
      }
      case 'fold':
        return { id, kind: 'info', text: tr('logFold', { name: name(e.seat) }) };
      case 'over': {
        const w = winners(e.result);
        const names = w.seats.length === 2 ? tr('and', { a: name(w.seats[0]), b: name(w.seats[1]) }) : name(w.seats[0]);
        const vars = { names, units: fmt(w.units), reason: tr(REASON_KEY[e.result.reason]) };
        return { id, kind: 'info', text: tr(w.seats.length === 2 ? 'logOver' : 'logOverOne', vars) };
      }
    }
  });
}
