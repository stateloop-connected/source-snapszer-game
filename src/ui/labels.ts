import type { HRank, HSuit, Lang, MessageVars } from '../arcade';
import type { ResultReason, ResultReason3 } from '../engine';
import type { MessageKey } from '../i18n';

export type Tr = (key: MessageKey, vars?: MessageVars) => string;

export const SUIT_KEY: Readonly<Record<HSuit, MessageKey>> = { piros: 'suitPiros', tok: 'suitTok', zold: 'suitZold', makk: 'suitMakk' };
export const suitName = (suit: HSuit, tr: Tr): string => tr(SUIT_KEY[suit]);

export const REASON_KEY: Readonly<Record<ResultReason | ResultReason3, MessageKey>> = {
  declared: 'reasonDeclared',
  lastTrick: 'reasonLastTrick',
  closeFailed: 'reasonCloseFailed',
  snapszer: 'reasonSnapszer',
  snapszerFailed: 'reasonSnapszerFailed',
  fold: 'reasonFold',
};

/** Corner index of a card: the numerals as printed, the court cards and the ace by their initial in that language. */
export const RANK_SHORT: Readonly<Record<Lang, Readonly<Record<HRank, string>>>> = {
  en: { VII: 'VII', VIII: 'VIII', IX: 'IX', X: 'X', also: 'U', felso: 'O', kiraly: 'K', asz: 'A' },
  hu: { VII: 'VII', VIII: 'VIII', IX: 'IX', X: 'X', also: 'Al', felso: 'F', kiraly: 'K', asz: 'Á' },
  de: { VII: 'VII', VIII: 'VIII', IX: 'IX', X: 'X', also: 'U', felso: 'O', kiraly: 'K', asz: 'A' },
};

/** Rank names as in the deck's own card labels, for the rules diagram. */
export const RANK_NAME: Readonly<Record<Lang, Readonly<Record<HRank, string>>>> = {
  en: { VII: 'Seven', VIII: 'Eight', IX: 'Nine', X: 'Ten', also: 'Under', felso: 'Over', kiraly: 'King', asz: 'Ace' },
  hu: { VII: 'hetes', VIII: 'nyolcas', IX: 'kilences', X: 'tízes', also: 'alsó', felso: 'felső', kiraly: 'király', asz: 'ász' },
  de: { VII: 'Sieben', VIII: 'Acht', IX: 'Neun', X: 'Zehn', also: 'Unter', felso: 'Ober', kiraly: 'König', asz: 'Ass' },
};
