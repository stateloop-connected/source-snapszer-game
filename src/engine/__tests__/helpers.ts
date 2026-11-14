import type { HCard, HRank, HSuit } from '../../arcade/hungarian/cards';
import type { Deal2State, Seat2, Trick } from '../types';

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
