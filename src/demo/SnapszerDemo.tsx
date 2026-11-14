import type { ArcadeDemoProps } from '../arcade';

/** Placeholder until the autopilot demo lands; writes nothing to storage. */
export function SnapszerDemo({ active = true }: ArcadeDemoProps) {
  return <div data-testid="snapszer-demo" data-active={active ? 'true' : 'false'} />;
}
