import { matchOutcome, type AnyDeal, type Match } from './match';
import { matchScore } from './score';

/** No action has been taken in this deal yet (only the deal itself is in the log). */
export const dealUntouched = (deal: AnyDeal): boolean => deal.log.length === 1;

/**
 * Finish is offered only between deals — after a deal is over, or before anybody has acted in the new one — so a
 * deal that is going badly cannot be escaped. It ranks the completed deals only (`matchScore(match, false)`).
 */
export const canFinishNow = (m: Match): boolean => m.phase === 'dealOver' || (m.phase === 'playing' && dealUntouched(m.deal));

/** Leaderboard score shown in the Score panel: the finish-early value, or the final one once the match is decided. */
export function shownScore(m: Match | null, finishedEarly: boolean): number {
  if (!m) return 0;
  if (m.phase === 'finished' && !finishedEarly) return matchScore(m, matchOutcome(m) === 'win');
  return matchScore(m, false);
}
