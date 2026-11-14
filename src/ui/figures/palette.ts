import { H_OUTLINE as SW, H_PALETTE as P } from '../../arcade';

/** Outline props shared by every portrait shape, and the whites of the dental outfits. */
export const O = { stroke: P.ink, strokeWidth: SW, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };
export const WHITE = '#fbfaf4';
export const WHITE_SHADE = '#dfe3dc';
