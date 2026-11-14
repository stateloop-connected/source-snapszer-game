import type { HCard, HSuit } from '../arcade/hungarian/cards';
import {
  applyAction, applyAction3, canClose, canFold3, canKontra, canKontra3, canSnapszer, canSnapszer3, cardKey, legalPlays,
  legalPlays3, other, rankStrength, sameCard, shuffle,
  type Action, type Action3, type Deal2State, type Deal3State, type Seat, type Seat2,
} from '../engine';
import { beats, deckOf, freeAction2, freeAction3, seenKeys, type Rng } from './common';
import { medium2, mediumCard2, mediumCard3, rolloutAction3, trumpChoice } from './medium';

/*
 * Hard: deals the unseen cards at random, consistent with everything the seat has seen (face-up and exchanged
 * trumps, announced 20 / 40, suits a player showed out of or could not beat in strict play), plays every candidate
 * out with the medium bot in all seats and takes the best average. The same samples are used for every candidate.
 * Closing, snapszer, kontra and the fold are candidates too, so it decides them on the samples as well.
 */

/** Simulated card plays per decision: a deterministic budget that stays well inside the time limit. */
export const HARD_ROLLOUTS = 360;
/** Safety stop: no decision samples for longer than this (the plan's limit is 150 ms). */
export const HARD_DEADLINE_MS = 120;
const MIN_SAMPLES = 6;
const MAX_SAMPLES = 120;
/** Risk margins (units) a bold announcement must win by over the best plain card. */
const MARGIN: Partial<Record<Action['type'], number>> = { kontra: 0.35, snapszer: 0.35, close: 0.15 };
/** A bold candidate (kontra, snapszer, close) is never judged on fewer samples than this. */
export const BOLD_MIN_SAMPLES = 24;

/** Samples per decision: the rollout budget spread over the candidates, with a higher floor for bold ones. */
export function sampleCount(candidates: readonly { type: string }[], cardsLeft: number): number {
  const n = Math.max(MIN_SAMPLES, Math.min(MAX_SAMPLES, Math.floor(HARD_ROLLOUTS / (candidates.length * Math.max(1, cardsLeft / 4)))));
  const bold = candidates.some((a) => MARGIN[a.type as Action['type']] !== undefined);
  return bold ? Math.max(n, BOLD_MIN_SAMPLES) : n;
}

interface SeatCons {
  readonly voids: Set<HSuit>;
  /** suit → highest rank strength the seat may still hold in it. */
  readonly caps: Map<HSuit, number>;
  readonly known: HCard[];
}

const emptyCons = (): SeatCons => ({ voids: new Set(), caps: new Map(), known: [] });

const allowed = (c: SeatCons, card: HCard): boolean => {
  if (c.voids.has(card.suit)) return false;
  const cap = c.caps.get(card.suit);
  return cap === undefined || rankStrength(card.rank) <= cap;
};

const capAt = (c: SeatCons, suit: HSuit, strength: number) =>
  c.caps.set(suit, Math.min(c.caps.get(suit) ?? Infinity, strength));

/** What a follower revealed in strict play: `played` against the best card `best` of a trick led in `led`. */
function learn(c: SeatCons, played: HCard, best: HCard, led: HSuit, trump: HSuit): void {
  if (played.suit !== led) {
    c.voids.add(led);
    if (played.suit !== trump) c.voids.add(trump);
    else if (best.suit === trump && !beats(played, best, trump)) capAt(c, trump, rankStrength(best.rank));
  } else if (best.suit === led && !beats(played, best, trump)) {
    capAt(c, led, rankStrength(best.rank));
  }
}

/** Marriage halves still in the announcer's hand. */
function marriageCards(marriages: readonly { seat: Seat; suit: HSuit }[], seat: Seat): HCard[] {
  return marriages
    .filter((m) => m.seat === seat)
    .flatMap((m) => [{ suit: m.suit, rank: 'kiraly' as const }, { suit: m.suit, rank: 'felso' as const }]);
}

/* ---------- two players ---------- */

function cons2(state: Deal2State, me: Seat2): SeatCons {
  const opp = other(me);
  const c = emptyCons();
  const seen = seenKeys(state, me);
  // Face-up cards that went into the opponent's hand: the turned-up trump (by exchange or the last draw) and the
  // exchanged Alsó.
  const faceUp: HCard[] = [];
  for (const e of state.log) {
    if (e.type === 'deal') faceUp.push(e.trumpCard);
    if (e.type === 'exchange') faceUp.push({ suit: state.trump, rank: 'also' });
  }
  for (const card of [...faceUp, ...marriageCards(state.marriages, opp)]) {
    if (!seen.has(cardKey(card)) && !c.known.some((k) => sameCard(k, card))) c.known.push(card);
  }
  const drawTricks = (deckOf(state).length - 10) / 2;
  state.tricks.forEach((t, i) => {
    const strict = (state.closed !== null && i >= state.closed.atTrick) || i >= drawTricks;
    if (strict && t.cards[1].seat === opp) learn(c, t.cards[1].card, t.cards[0].card, t.cards[0].card.suit, state.trump);
  });
  return c;
}

function sample2(state: Deal2State, me: Seat2, c: SeatCons, rng: Rng): Deal2State {
  const opp = other(me);
  const seen = seenKeys(state, me);
  const knownKeys = new Set(c.known.map(cardKey));
  const pool = shuffle(deckOf(state).filter((x) => !seen.has(cardKey(x)) && !knownKeys.has(cardKey(x))), rng);
  const hand = [...c.known];
  const rest: HCard[] = [];
  for (const card of pool) {
    if (hand.length < state.hands[opp].length && allowed(c, card)) hand.push(card);
    else rest.push(card);
  }
  while (hand.length < state.hands[opp].length) hand.push(rest.shift() as HCard);
  const hands = (me === 0 ? [state.hands[0], hand] : [hand, state.hands[1]]) as Deal2State['hands'];
  return { ...state, hands, talon: rest };
}

function rollout2(state: Deal2State): Deal2State {
  let s = state;
  while (!s.result) s = applyAction(s, medium2(s));
  return s;
}

const value2 = (s: Deal2State, me: Seat2): number => {
  const r = s.result;
  if (!r) throw new Error('rollout did not finish');
  return r.winner === me ? r.units : -r.units;
};

/** Average value of each candidate over the same samples; stops early at the deadline. */
function evaluate<S, A extends { type: string }>(
  candidates: readonly A[],
  draw: () => S,
  score: (s: S, a: A) => number,
  cardsLeft: number,
): A {
  const n = sampleCount(candidates, cardsLeft);
  const totals = candidates.map(() => 0);
  const start = performance.now();
  let done = 0;
  for (; done < n; done++) {
    if (done > 0 && performance.now() - start > HARD_DEADLINE_MS) break;
    const s = draw();
    candidates.forEach((a, i) => (totals[i] += score(s, a)));
  }
  let best = 0;
  let bestValue = -Infinity;
  candidates.forEach((a, i) => {
    const v = totals[i] / done - (MARGIN[a.type as Action['type']] ?? 0);
    if (v > bestValue) {
      bestValue = v;
      best = i;
    }
  });
  return candidates[best];
}

const sameAction = (a: { type: string; card?: HCard }, b: { type: string; card?: HCard }) =>
  a.type === b.type && (!a.card || !b.card || sameCard(a.card, b.card));

export function hard2(state: Deal2State, rng: Rng): Action {
  const me = state.turn;
  const free = freeAction2(state, me);
  if (free) return free;
  const first: Action = { type: 'play', card: mediumCard2(state, me) };
  const candidates: Action[] = [first];
  for (const card of legalPlays(state, me)) if (!sameCard(card, first.card)) candidates.push({ type: 'play', card });
  if (canClose(state, me)) candidates.push({ type: 'close' });
  if (canSnapszer(state, me)) candidates.push({ type: 'snapszer' });
  if (canKontra(state, me)) candidates.push({ type: 'kontra' });
  if (candidates.length === 1) return first;
  const c = cons2(state, me);
  const left = state.hands[0].length + state.hands[1].length;
  const chosen = evaluate(candidates, () => sample2(state, me, c, rng), (s, a) => value2(rollout2(applyAction(s, a)), me), left);
  return candidates.find((a) => sameAction(a, chosen)) as Action;
}

/* ---------- three players ---------- */

function cons3(state: Deal3State, me: Seat): Record<Seat, SeatCons> {
  const cons: Record<Seat, SeatCons> = { 0: emptyCons(), 1: emptyCons(), 2: emptyCons() };
  const seen = seenKeys(state, me);
  const trump = state.trump as HSuit;
  const keep = (seat: Seat, card: HCard) => {
    if (seat !== me && !seen.has(cardKey(card)) && !cons[seat].known.some((k) => sameCard(k, card))) cons[seat].known.push(card);
  };
  if (state.trumpCard) keep(state.caller, state.trumpCard);
  for (const m of state.marriages) for (const card of marriageCards([m], m.seat)) keep(m.seat, card);
  for (const t of [...state.tricks.map((x) => x.cards), state.trick]) {
    for (let i = 1; i < t.length; i++) {
      const best = t.slice(0, i).reduce((b, p) => (beats(p.card, b.card, trump) ? p : b));
      learn(cons[t[i].seat], t[i].card, best.card, t[0].card.suit, trump);
    }
  }
  return cons;
}

function sample3(state: Deal3State, me: Seat, cons: Record<Seat, SeatCons>, rng: Rng): Deal3State {
  const others = ([0, 1, 2] as Seat[]).filter((s) => s !== me);
  const seen = seenKeys(state, me);
  const known = new Set(others.flatMap((s) => cons[s].known.map(cardKey)));
  const pool = shuffle(deckOf(state).filter((x) => !seen.has(cardKey(x)) && !known.has(cardKey(x))), rng);
  const hands: Record<number, HCard[]> = { [others[0]]: [...cons[others[0]].known], [others[1]]: [...cons[others[1]].known] };
  const need = (s: Seat) => state.hands[s].length - hands[s].length;
  const rest: HCard[] = [];
  for (const card of pool) {
    const ok = others.filter((s) => need(s) > 0 && allowed(cons[s], card));
    if (ok.length === 0) rest.push(card);
    else if (ok.length === 1) hands[ok[0]].push(card);
    else hands[rng() * (need(ok[0]) + need(ok[1])) < need(ok[0]) ? ok[0] : ok[1]].push(card);
  }
  for (const card of rest) hands[need(others[0]) > 0 ? others[0] : others[1]].push(card);
  const all = state.hands.map((h, s) => (s === me ? h : hands[s])) as unknown as Deal3State['hands'];
  return { ...state, hands: all };
}

function rollout3(state: Deal3State): Deal3State {
  let s = state;
  while (!s.result) s = applyAction3(s, rolloutAction3(s));
  return s;
}

function value3(s: Deal3State, me: Seat): number {
  const r = s.result;
  if (!r) throw new Error('rollout did not finish');
  const rival = me === s.caller ? (([0, 1, 2] as Seat[]).find((x) => x !== me) as Seat) : s.caller;
  return r.units[me] - r.units[rival];
}

export function hard3(state: Deal3State, rng: Rng): Action3 {
  if (state.phase === 'trump') return trumpChoice(state);
  const me = state.turn;
  const free = freeAction3(state, me);
  if (free) return free;
  const first: Action3 = { type: 'play', card: mediumCard3(state, me) };
  const candidates: Action3[] = [first];
  for (const card of legalPlays3(state, me)) if (!sameCard(card, first.card)) candidates.push({ type: 'play', card });
  if (canSnapszer3(state, me)) candidates.push({ type: 'snapszer' });
  if (canKontra3(state, me)) candidates.push({ type: 'kontra' });
  if (canFold3(state, me)) candidates.push({ type: 'fold' });
  if (candidates.length === 1) return first;
  const cons = cons3(state, me);
  const left = state.hands[0].length + state.hands[1].length + state.hands[2].length;
  const chosen = evaluate(candidates, () => sample3(state, me, cons, rng), (s, a) => value3(rollout3(applyAction3(s, a)), me), left);
  return candidates.find((a) => sameAction(a, chosen)) as Action3;
}
