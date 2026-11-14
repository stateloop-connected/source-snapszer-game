import { H_PALETTE as P } from '../../arcade';
import { Cameo, Features, HeadBase, Shoulders, WhiteCoat } from './parts';
import { O, WHITE } from './palette';

/** Round spectacles, the part of Gazsi's face that never changes. */
function Spectacles() {
  return (
    <g data-part="spectacles">
      <circle cx="35.4" cy="39" r="3.6" fill="none" stroke={P.ink} strokeWidth="1" />
      <circle cx="44.6" cy="39" r="3.6" fill="none" stroke={P.ink} strokeWidth="1" />
      <path d="M39 38.6 Q40 37.8 41 38.6 M31.8 38.6 L28.6 37.6 M48.2 38.6 L51.4 37.6" fill="none" stroke={P.ink} strokeWidth="0.9" />
    </g>
  );
}

/** Gazsi: an older coachman with a grey beard and round spectacles — peaked cap and waistcoat; dental: the dental technician with loupes and a denture. */
export function GazsiFigure({ dental, title }: { dental: boolean; title: string }) {
  return (
    <Cameo title={title} testId={dental ? 'snapszer-figure-dental' : 'snapszer-figure-classic'} figure="gazsi">
      {dental ? (
        <WhiteCoat collar="lapel" />
      ) : (
        <g data-outfit="waistcoat">
          <Shoulders fill={P.linen} />
          <path d="M16 96 L20 72 Q28 65 35 63 L38 96 Z M64 96 L60 72 Q52 65 45 63 L42 96 Z" fill={P.brown} {...O} />
          <path d="M38 80 Q44 84 50 80" fill="none" stroke={P.ochre} strokeWidth="1.2" />
          <circle cx="50.5" cy="80" r="1.6" fill={P.ochreLight} {...O} strokeWidth="0.6" />
          {[72, 79, 86].map((y) => (
            <circle key={y} cx="37" cy={y} r="1.1" fill={P.ochre} {...O} strokeWidth="0.5" />
          ))}
        </g>
      )}
      <HeadBase chin={1} />
      {/* grey hair over the ears, a bald crown */}
      <path d="M28 41 Q26 31 30 27 Q32 33 31 41 Z M52 41 Q54 31 50 27 Q48 33 49 41 Z" fill={P.steelLight} {...O} />
      <Features brow={P.steel} smile={false} />
      <Spectacles />
      {/* full grey beard and moustache */}
      <path
        d="M29.5 44 Q30 55 34 59 Q40 64 46 59 Q50 55 50.5 44 Q48 50 44 50.5 Q40 49 36 50.5 Q32 50 29.5 44 Z"
        fill={P.steelLight}
        {...O}
      />
      <path d="M35 48.4 Q40 45.8 45 48.4 Q40 49.6 35 48.4 Z" fill={P.steel} {...O} strokeWidth="0.7" />
      <path d="M36 54 l1 3 M40 55 v3.4 M44 54 l-1 3" stroke={P.steel} strokeWidth="0.7" strokeLinecap="round" />
      {dental ? (
        <g data-tool="loupes">
          {/* magnifying loupes clipped onto the spectacles */}
          <rect x="32.4" y="35.6" width="6" height="6.4" rx="1.6" fill={P.slate} {...O} />
          <rect x="41.6" y="35.6" width="6" height="6.4" rx="1.6" fill={P.slate} {...O} />
          <circle cx="35.4" cy="38.8" r="1.6" fill="#cfe3e8" />
          <circle cx="44.6" cy="38.8" r="1.6" fill="#cfe3e8" />
          {/* a denture held up in the hand */}
          <g data-tool="denture" transform="translate(12 74)">
            <path d="M0 6 Q10 -4 20 6 L18 10 Q10 3 2 10 Z" fill="#e7a6a0" {...O} />
            {[3.4, 6.6, 10, 13.4, 16.6].map((x) => (
              <rect key={x} x={x - 1.4} y={x === 10 ? 1.2 : 2.4} width="2.8" height="3.4" rx="0.8" fill={WHITE} stroke={P.ink} strokeWidth="0.5" />
            ))}
            <circle cx="10" cy="15" r="3.2" fill={P.skin} {...O} />
          </g>
        </g>
      ) : (
        <g data-outfit="cap">
          <path d="M28.6 29 Q29 17 40 16.6 Q51 17 51.4 29 Q40 25.6 28.6 29 Z" fill={P.slate} {...O} />
          <path d="M27 29.4 Q40 24.4 53 29.4 Q50 32.6 40 31 Q30 32.6 27 29.4 Z" fill={P.ink} />
          <path d="M31 22 Q40 19 49 22" fill="none" stroke={P.steel} strokeWidth="0.8" />
          <circle cx="40" cy="17.4" r="1.4" fill={P.slate} {...O} strokeWidth="0.6" />
        </g>
      )}
    </Cameo>
  );
}
