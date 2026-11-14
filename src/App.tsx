import { ArcadeShell } from './arcade';
import { SnapszerGame } from './SnapszerGame';

export default function App() {
  return (
    <ArcadeShell gameId="snapszer">
      <SnapszerGame />
    </ArcadeShell>
  );
}
