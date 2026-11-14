import { useId, type ReactNode } from 'react';
import { H_PALETTE as P } from '../../arcade';
import { O, WHITE, WHITE_SHADE } from './palette';
import { hSvgId as svgId } from '../../arcade';

/**
 * Seat portraits in the deck's woodcut look: a cream cameo, flat period colours, dark-brown outlines.
 * Space is 80 × 96; the head sits at (40, 40). The faces never change between the classic and dental outfits.
 */

/** Oval cameo with a double frame; the contents are clipped to the inner oval. */
export function Cameo({ children, title, testId, figure }: { children: ReactNode; title: string; testId: string; figure: string }) {
  const clip = svgId(useId(), 'snfig');
  return (
    <svg viewBox="0 0 80 96" role="img" aria-label={title} data-testid={testId} data-figure={figure}>
      <title>{title}</title>
      <defs>
        <clipPath id={clip}>
          <ellipse cx="40" cy="48" rx="34" ry="42" />
        </clipPath>
      </defs>
      <ellipse cx="40" cy="48" rx="38.5" ry="46.5" fill={P.stock} stroke={P.ink} strokeWidth="1.4" />
      <ellipse cx="40" cy="48" rx="34" ry="42" fill={P.sky} stroke={P.ink} strokeWidth="1" />
      <g clipPath={`url(#${clip})`}>
        {/* woodcut hatching in the background */}
        <path d="M10 20 l8 -8 M10 30 l14 -14 M10 40 l18 -18 M52 18 l14 -12 M56 26 l14 -12 M60 34 l12 -10" stroke={P.stockShade} strokeWidth="1.2" />
        {children}
      </g>
      <ellipse cx="40" cy="48" rx="36.2" ry="44.2" fill="none" stroke={P.brick} strokeWidth="0.8" />
    </svg>
  );
}

/** Neck and the head shape with ears (skin only). */
export function HeadBase({ chin = 0 }: { chin?: number }) {
  return (
    <>
      <path d="M34.5 50 L34 62 L46 62 L45.5 50 Z" fill={P.skin} {...O} />
      <ellipse cx="27.6" cy="41" rx="2.6" ry="3.6" fill={P.skin} {...O} />
      <ellipse cx="52.4" cy="41" rx="2.6" ry="3.6" fill={P.skin} {...O} />
      <path d={`M28 36 Q28 24 40 24 Q52 24 52 36 Q52 ${50 + chin} 40 ${55 + chin} Q28 ${50 + chin} 28 36 Z`} fill={P.skin} {...O} />
    </>
  );
}

/** Eyes, brows, nose and the mouth line: the part of the face that identifies the person. */
export function Features({ brow = P.brown, smile = true, lashes = false }: { brow?: string; smile?: boolean; lashes?: boolean }) {
  return (
    <g>
      <path d="M32.5 35.6 Q35.5 33.8 38 35.4 M42 35.4 Q44.5 33.8 47.5 35.6" fill="none" stroke={brow} strokeWidth="1.4" strokeLinecap="round" />
      <ellipse cx="35.4" cy="39" rx="1.3" ry="1.1" fill={P.ink} />
      <ellipse cx="44.6" cy="39" rx="1.3" ry="1.1" fill={P.ink} />
      {lashes && <path d="M33.3 37.9 l-1 -0.9 M46.7 37.9 l1 -0.9" stroke={P.ink} strokeWidth="0.7" strokeLinecap="round" />}
      <path d="M40 39.5 Q38.4 44 39 45 Q40 45.6 41.2 45" fill="none" stroke={P.brown} strokeWidth="0.9" strokeLinecap="round" />
      <circle cx="33.5" cy="45" r="2" fill={P.brick} opacity="0.25" />
      <circle cx="46.5" cy="45" r="2" fill={P.brick} opacity="0.25" />
      <path d={smile ? 'M36.4 49 Q40 51.6 43.6 49' : 'M36.8 49.6 H43.2'} fill="none" stroke={P.brickDark} strokeWidth="1" strokeLinecap="round" />
    </g>
  );
}

/** Shoulders filling the bottom of the cameo. */
export function Shoulders({ fill, d = 'M2 96 L8 74 Q14 64 34 61 L46 61 Q66 64 72 74 L78 96 Z' }: { fill: string; d?: string }) {
  return <path d={d} fill={fill} {...O} />;
}

/** White coat over the shoulders with lapels and a breast pocket (all dental outfits). */
export function WhiteCoat({ collar }: { collar: 'lapel' | 'tunic' }) {
  return (
    <g data-outfit="white-coat">
      <Shoulders fill={WHITE} />
      {collar === 'lapel' ? (
        <>
          <path d="M34 61 L40 80 L46 61" fill={P.linen} {...O} />
          <path d="M30 62 L36 76 L40 80 L33 66 Z M50 62 L44 76 L40 80 L47 66 Z" fill={WHITE_SHADE} {...O} />
        </>
      ) : (
        <path d="M33 61 Q40 68 47 61" fill="none" {...O} />
      )}
      <path d="M40 80 L40 96" stroke={P.ink} strokeWidth="0.8" />
      <rect x="49" y="78" width="10" height="9" rx="1" fill={WHITE_SHADE} {...O} />
      <path d="M52 78 L52 74 M55 78 L55 75" stroke={P.ink} strokeWidth="1.4" strokeLinecap="round" />
    </g>
  );
}

/** A dental mouth mirror held up (handle + round mirror). */
export function MouthMirror({ x, y }: { x: number; y: number }) {
  return (
    <g data-tool="mirror">
      <path d={`M${x} ${y} L${x + 6} ${y - 16}`} stroke={P.ink} strokeWidth="3" strokeLinecap="round" />
      <path d={`M${x} ${y} L${x + 6} ${y - 16}`} stroke={P.steel} strokeWidth="1.6" strokeLinecap="round" />
      <circle cx={x + 7.2} cy={y - 19} r="3.4" fill="#cfe3e8" {...O} />
      <circle cx={x + 2} cy={y + 2} r="3.2" fill={P.skin} {...O} />
    </g>
  );
}

/** A dental probe (thin hooked tip). */
export function Probe({ x, y }: { x: number; y: number }) {
  return (
    <g data-tool="probe">
      <path d={`M${x} ${y} L${x - 5} ${y - 17}`} stroke={P.ink} strokeWidth="3" strokeLinecap="round" />
      <path d={`M${x} ${y} L${x - 5} ${y - 17}`} stroke={P.steel} strokeWidth="1.6" strokeLinecap="round" />
      <path d={`M${x - 5} ${y - 17} q-1 -4 2 -5`} fill="none" stroke={P.ink} strokeWidth="1" strokeLinecap="round" />
      <circle cx={x - 1} cy={y + 2} r="3.2" fill={P.skin} {...O} />
    </g>
  );
}
