import { H_PALETTE as P } from '../../arcade';
import { Tooth } from '../../arcade';
import { Cameo, Features, HeadBase, Shoulders, WhiteCoat } from './parts';
import { O, WHITE } from './palette';

/** Rozi: a young innkeeper with a fringe and earrings — polka-dot headscarf and embroidered blouse; dental: the orthodontist with a tooth in braces. */
export function RoziFigure({ dental, title }: { dental: boolean; title: string }) {
  return (
    <Cameo title={title} testId={dental ? 'snapszer-figure-dental' : 'snapszer-figure-classic'} figure="rozi">
      {dental ? (
        <WhiteCoat collar="tunic" />
      ) : (
        <g data-outfit="blouse">
          <Shoulders fill={P.linen} />
          <path d="M33 61 Q40 69 47 61" fill="none" stroke={P.olive} strokeWidth="2" />
          {[30, 36, 44, 50].map((x) => (
            <path key={x} d={`M${x} 72 l2 -2.4 l2 2.4 l-2 2.4 Z`} fill={x % 12 === 0 ? P.brick : P.ochre} {...O} strokeWidth="0.5" />
          ))}
          <path d="M8 96 L12 76 Q18 70 24 68 L26 96 Z M72 96 L68 76 Q62 70 56 68 L54 96 Z" fill={P.oliveDark} {...O} />
        </g>
      )}
      <HeadBase />
      {/* a short fringe under the scarf (or the cap) */}
      <path d="M29 34 Q30 26 40 25.6 Q50 26 51 34 Q46 30 40 31 Q34 30 29 34 Z" fill={P.brownLight} {...O} />
      <Features lashes />
      {/* earrings */}
      <circle cx="27.4" cy="46.6" r="1.6" fill={P.ochreLight} {...O} strokeWidth="0.6" />
      <circle cx="52.6" cy="46.6" r="1.6" fill={P.ochreLight} {...O} strokeWidth="0.6" />
      {dental ? (
        <g data-outfit="bun">
          <path d="M28.4 33 Q27 21 40 20 Q53 21 51.6 33 Q46 26 40 26 Q34 26 28.4 33 Z" fill={P.brownLight} {...O} />
          <ellipse cx="40" cy="18" rx="6" ry="4.4" fill={P.brownLight} {...O} />
          {/* a tooth in braces held up in the hand */}
          <g data-tool="braces" transform="translate(12 66)">
            <Tooth size={18} fill={WHITE} stroke={P.ink} />
            <path d="M2 7.6 H16" stroke={P.steel} strokeWidth="1.4" />
            <rect x="4.6" y="5.8" width="3.4" height="3.6" rx="0.6" fill={P.steelLight} stroke={P.ink} strokeWidth="0.5" />
            <rect x="10" y="5.8" width="3.4" height="3.6" rx="0.6" fill={P.steelLight} stroke={P.ink} strokeWidth="0.5" />
            <circle cx="9" cy="22" r="3.2" fill={P.skin} {...O} />
          </g>
        </g>
      ) : (
        <g data-outfit="headscarf">
          <path d="M26.6 38 Q24 17 40 16 Q56 17 53.4 38 Q52 29 40 27.4 Q28 29 26.6 38 Z" fill={P.brick} {...O} />
          <path d="M53 37 Q57 48 52 58 L48 55 Q52 47 51 38 Z" fill={P.brick} {...O} />
          {[
            [33, 22], [40, 20], [47, 22], [30, 29], [50, 29], [37, 25], [44, 25], [53, 45],
          ].map(([x, y]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r="1.1" fill={P.linen} />
          ))}
        </g>
      )}
    </Cameo>
  );
}
