import type { HSuit } from '../arcade';
import { HSuitSign as SuitSign } from '../arcade';

/** A suit sign of the deck as an inline icon (shape tells the suit, never colour alone). */
export function SuitIcon({ suit, size = 16, title }: { suit: HSuit; size?: number; title?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" role={title ? 'img' : undefined} aria-label={title} aria-hidden={title ? undefined : true} style={{ verticalAlign: '-0.2em', flex: 'none' }}>
      <SuitSign suit={suit} x={50} y={50} size={92} />
    </svg>
  );
}
