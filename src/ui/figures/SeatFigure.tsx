import type { Seat } from '../../engine';
import { GazsiFigure } from './GazsiFigure';
import { PlayerFigure } from './PlayerFigure';
import { RoziFigure } from './RoziFigure';

/** The portrait at a seat: 0 you, 1 Gazsi, 2 Rozi; `dental` dresses them as dentist, dental technician and orthodontist. */
export function SeatFigure({ seat, dental, title }: { seat: Seat; dental: boolean; title: string }) {
  if (seat === 0) return <PlayerFigure dental={dental} title={title} />;
  if (seat === 1) return <GazsiFigure dental={dental} title={title} />;
  return <RoziFigure dental={dental} title={title} />;
}

export default SeatFigure;
