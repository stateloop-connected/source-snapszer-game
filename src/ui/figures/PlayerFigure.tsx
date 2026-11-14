import { H_PALETTE as P } from '../../arcade';
import { Cameo, Features, HeadBase, MouthMirror, Shoulders, WhiteCoat } from './parts';
import { O, WHITE_SHADE } from './palette';

/** The player: a young man with a trim moustache — feathered hat and doublet; dental: the dentist with head mirror. */
export function PlayerFigure({ dental, title }: { dental: boolean; title: string }) {
  return (
    <Cameo title={title} testId={dental ? 'snapszer-figure-dental' : 'snapszer-figure-classic'} figure="player">
      {dental ? (
        <WhiteCoat collar="lapel" />
      ) : (
        <g data-outfit="doublet">
          <Shoulders fill={P.brick} />
          <path d="M22 66 L24 96 M58 66 L56 96" stroke={P.ochreLight} strokeWidth="2" />
          <path d="M33 61 Q40 70 47 61 Q40 64 33 61 Z" fill={P.linen} {...O} />
          <circle cx="40" cy="78" r="1.4" fill={P.ochre} {...O} />
          <circle cx="40" cy="86" r="1.4" fill={P.ochre} {...O} />
        </g>
      )}
      <HeadBase />
      {/* short brown hair */}
      <path d="M28 37 Q26 22 40 21 Q54 22 52 37 Q50 29 44 28 Q38 31 30 30 Q28 33 28 37 Z" fill={P.brown} {...O} />
      <Features />
      {/* trim moustache */}
      <path d="M35 47.2 Q37.6 45.6 40 46.6 Q42.4 45.6 45 47.2 Q42.4 48 40 47.4 Q37.6 48 35 47.2 Z" fill={P.brown} {...O} strokeWidth="0.7" />
      {dental ? (
        <g data-tool="head-mirror">
          <path d="M28 30 Q40 25 52 30" fill="none" stroke={P.ink} strokeWidth="3.2" />
          <path d="M28 30 Q40 25 52 30" fill="none" stroke={WHITE_SHADE} strokeWidth="1.8" />
          <circle cx="40" cy="22" r="6.4" fill="#cfe3e8" {...O} />
          <circle cx="40" cy="22" r="1.6" fill={P.ink} />
          <MouthMirror x={55} y={86} />
        </g>
      ) : (
        <g data-outfit="hat">
          <path d="M34 22 C30 12 24 8 17 9 C22 13 27 18 31 25 Z" fill={P.linen} {...O} />
          <path d="M31 25 Q31 13 40 12.5 Q49 13 49 25 Z" fill={P.oliveDark} {...O} />
          <path d="M31.2 21.5 H48.8" stroke={P.ochreLight} strokeWidth="2" />
          <ellipse cx="40" cy="25.6" rx="16" ry="3.4" fill={P.oliveDark} {...O} />
        </g>
      )}
    </Cameo>
  );
}
