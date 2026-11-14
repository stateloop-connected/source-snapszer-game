import type { HCard, HRank, HSuit } from '../../arcade/hungarian/cards';
import type { Deal2State, Deal3State, Seat, Seat2, Trick, Trick3 } from '../types';

const SUIT: Record<string, HSuit> = { p: 'piros', t: 'tok', z: 'zold', m: 'makk' };
const RANK: Record<string, HRank> = { A: 'asz', X: 'X', K: 'kiraly', F: 'felso', U: 'also', '9': 'IX' };

/** `c('pA')` = Piros ász; suits p t z m, ranks A X K F U (Alsó) 9. */
export function c(code: string): HCard {
  const suit = SUIT[code[0]];
  const rank = RANK[code.slice(1)];
  if (!suit || !rank) throw new Error(`Bad card code ${code}`);
  return { suit, rank };
}
export const cs = (codes: string): HCard[] => codes.split(/\s+/).filter(Boolean).map(c);

/** A finished trick won by `winner`, led by `leader` (default: the winner). */
export function trick(winner: Seat2, a: string, b: string, leader: Seat2 = winner): Trick {
  const other = (1 - leader) as Seat2;
  return { leader, winner, cards: [{ seat: leader, card: c(a) }, { seat: other, card: c(b) }] };
}

/** A hand-made mid-deal state; defaults: trump piros, seat 0 to lead, open talon. */
export function build(patch: Partial<Deal2State> & { hand0?: string; hand1?: string; talonCodes?: string; trumpCode?: string | null }): Deal2State {
  const { hand0, hand1, talonCodes, trumpCode, ...rest } = patch;
  const trumpCard = trumpCode === null ? null : c(trumpCode ?? 'p9');
  const base: Deal2State = {
    mode: 'two',
    opts: { mode: 'two', withNines: false },
    seed: 1,
    dealer: 1,
    trump: trumpCard ? trumpCard.suit : 'piros',
    trumpCard,
    talon: cs(talonCodes ?? 'tA tX zA zX mA mX'),
    hands: [cs(hand0 ?? 'pA pX tK tF zU'), cs(hand1 ?? 'pK pF zK zF mU')],
    turn: 0,
    leader: 0,
    trick: [],
    tricks: [],
    marriages: [],
    mustLead: null,
    closed: null,
    snapszer: null,
    kontra: { game: null, snapszer: null },
    result: null,
    log: [],
  };
  return { ...base, ...rest };
}

/** A finished three-card trick: cards in play order from `leader`, won by `winner`. */
export function trick3(winner: Seat, leader: Seat, a: string, b: string, d: string): Trick3 {
  const seats = [leader, ((leader + 1) % 3) as Seat, ((leader + 2) % 3) as Seat] as const;
  return { leader, winner, cards: [{ seat: seats[0], card: c(a) }, { seat: seats[1], card: c(b) }, { seat: seats[2], card: c(d) }] };
}

/** A hand-made three-player state in the play phase; defaults: dealer 2, caller 0 on lead, trump piros. */
export function build3(patch: Partial<Deal3State> & { hand0?: string; hand1?: string; hand2?: string }): Deal3State {
  const { hand0, hand1, hand2, ...rest } = patch;
  const base: Deal3State = {
    mode: 'three',
    opts: { mode: 'three', withNines: true },
    seed: 1,
    dealer: 2,
    caller: 0,
    phase: 'play',
    trump: 'piros',
    trumpCard: c('pU'),
    hands: [cs(hand0 ?? 'pA pX tA tX'), cs(hand1 ?? 'pK pF tK tF'), cs(hand2 ?? 'zA zX mA mX')],
    pending: [[], [], []],
    turn: 0,
    leader: 0,
    trick: [],
    tricks: [],
    marriages: [],
    mustLead: null,
    snapszer: false,
    kontra: { level: 0, by: null, played: [0, 0, 0] },
    result: null,
    log: [],
  };
  return { ...base, ...rest };
}
