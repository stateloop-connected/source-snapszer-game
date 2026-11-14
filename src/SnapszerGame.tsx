import { gameName, useLang, type ArcadeGameProps } from './arcade';

/** Placeholder until the table UI lands: the arcade contract is wired, the game itself comes later. */
export function SnapszerGame({ embedded = false }: ArcadeGameProps) {
  const [lang] = useLang();
  return <div data-testid="snapszer-game">{embedded ? null : <h1>{gameName('snapszer', lang)}</h1>}</div>;
}

export default SnapszerGame;
