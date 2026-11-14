import type { ReactNode } from 'react';
import { formatNumber, Tooth, useDental, useIsTouch, useKitMessages, useLang, useMessages, type RulesSection } from './arcade';
import { LEVELS, type Level } from './bots';
import {
  CLOSE_FAILED_UNITS,
  DEAL3_ROUND,
  DEAL_FIRST,
  DEAL_SECOND,
  DECLARE_THRESHOLD,
  FOLD_ACE_UNITS,
  FOLD_UNITS,
  KONTRA_FACTOR,
  MACCS_THRESHOLD,
  MACCS_UNITS,
  MARRIAGE_POINTS,
  MIN_TALON_FOR_EXCHANGE,
  NO_TRICK_UNITS,
  SNAPSZER_RANKS,
  SNAPSZER_UNITS,
  WIN_UNITS,
  WRONG_DECLARE_UNITS,
  cardPoints,
} from './engine';
import { TARGET_UNITS } from './game/match';
import { DECK, EXAMPLE, exampleScore, startScore } from './game/rulesNumbers';
import { LEVEL_FACTOR, MAX_SCORE, UNIT_POINTS, WIN_BONUS } from './game/score';
import { MESSAGES, type MessageKey } from './i18n';
import { RANK_NAME, RANK_SHORT } from './ui/labels';
import styles from './rules.module.css';

const LEVEL_KEY: Record<Level, MessageKey> = { easy: 'diffEasy', medium: 'diffMedium', hard: 'diffHard' };

/** High to low: A, X, K, F, Alsó, IX. */
const VALUE_ORDER = [...SNAPSZER_RANKS].reverse();
const BOX = 44;
const GAP = 6;
const X0 = 10;

/**
 * Rules diagram: every rank with its card points, high to low. The nine (only with the nines) has a dashed frame,
 * so it stands out by shape; in dental mode a tooth marks the most valuable card.
 */
export function CardValueDiagram() {
  const m = useMessages(MESSAGES);
  const [lang] = useLang();
  const [dental] = useDental();
  const num = (v: number) => formatNumber(v, lang);
  const pts = (rank: (typeof VALUE_ORDER)[number]) => num(cardPoints({ suit: 'makk', rank }));
  const label = m('rulesValuesLabel', {
    a: pts('asz'), x: pts('X'), k: pts('kiraly'), f: pts('felso'), u: pts('also'), nine: pts('IX'),
    cards: num(DECK.cards), total: num(DECK.total),
  });
  const w = X0 * 2 + VALUE_ORDER.length * (BOX + GAP) - GAP;
  return (
    <svg viewBox={`0 0 ${w} 114`} role="img" aria-label={label} data-dental={dental ? 'true' : 'false'} className={styles.diagram} data-testid="snapszer-value-diagram">
      {VALUE_ORDER.map((rank, i) => {
        const x = X0 + i * (BOX + GAP);
        const nine = rank === 'IX';
        return (
          <g key={rank} data-rank={rank}>
            <rect x={x} y={8} width={BOX} height={62} rx={6} fill="var(--panel-bg-soft)" stroke="var(--text)" strokeWidth={nine ? 1.6 : 1.4} strokeDasharray={nine ? '4 3' : undefined} />
            <text x={x + BOX / 2} y={30} fontSize="14" fontWeight="700" textAnchor="middle" fill="var(--text-dim)">
              {RANK_SHORT[lang][rank]}
            </text>
            <text x={x + BOX / 2} y={58} fontSize="20" fontWeight="800" textAnchor="middle" fill="var(--text-strong)" data-points="">
              {pts(rank)}
            </text>
            <text x={x + BOX / 2} y={84} fontSize="9" textAnchor="middle" fill="var(--text-dim)">
              {RANK_NAME[lang][rank]}
            </text>
          </g>
        );
      })}
      {dental && (
        <g transform={`translate(${X0 + BOX / 2 - 9} 92)`} data-tooth="">
          <Tooth size={18} />
        </g>
      )}
    </svg>
  );
}

/**
 * Rules diagram: what a deal is worth — one, two or three unit squares (the count is the shape cue) over the
 * condition on the loser.
 */
export function DealPointsDiagram() {
  const m = useMessages(MESSAGES);
  const [lang] = useLang();
  const [dental] = useDental();
  const num = (v: number) => formatNumber(v, lang);
  const maccs = num(MACCS_THRESHOLD);
  const cols: { units: number; caption: string }[] = [
    { units: WIN_UNITS, caption: m('rulesDealWin', { maccs }) },
    { units: MACCS_UNITS, caption: m('rulesDealMaccs', { maccs }) },
    { units: NO_TRICK_UNITS, caption: m('rulesDealNoTrick') },
  ];
  const label = m('rulesDealLabel', { win: num(WIN_UNITS), maccs, maccsUnits: num(MACCS_UNITS), noTrick: num(NO_TRICK_UNITS) });
  const COL = 104;
  const SQ = 18;
  return (
    <svg viewBox={`0 0 ${COL * 3 + 8} 118`} role="img" aria-label={label} data-dental={dental ? 'true' : 'false'} className={styles.diagram} data-testid="snapszer-deal-diagram">
      {cols.map((c, i) => {
        const cx = 4 + i * COL + COL / 2;
        return (
          <g key={c.units} data-units={c.units}>
            {Array.from({ length: c.units }, (_, k) =>
              dental ? (
                <g key={k} transform={`translate(${cx - (c.units * (SQ + 4)) / 2 + k * (SQ + 4)} 10)`} data-tooth="">
                  <Tooth size={SQ} />
                </g>
              ) : (
                <rect key={k} x={cx - (c.units * (SQ + 4)) / 2 + k * (SQ + 4) + 2} y={10} width={SQ} height={SQ} rx={3} fill="var(--text-strong)" />
              ),
            )}
            <text x={cx} y={56} fontSize="15" fontWeight="800" textAnchor="middle" fill="var(--text-strong)">
              {m(c.units === 1 ? 'rulesDealUnit' : 'rulesDealUnits', { n: num(c.units) })}
            </text>
            <text x={cx} y={80} fontSize="12" textAnchor="middle" fill="var(--text-dim)">
              {c.caption}
            </text>
            <rect x={4 + i * COL + 3} y={2} width={COL - 6} height={92} rx={8} fill="none" stroke="var(--panel-border-strong)" />
          </g>
        );
      })}
    </svg>
  );
}

// eslint-disable-next-line react-refresh/only-export-components -- the diagrams and their hook belong together
export function useRulesSections(): RulesSection[] {
  const m = useMessages(MESSAGES);
  const k = useKitMessages();
  const [lang] = useLang();
  const touch = useIsTouch();
  const num = (v: number) => formatNumber(v, lang);
  const ios = typeof navigator !== 'undefined' && /iP(hone|od)/.test(navigator.userAgent);
  const level = (l: Level) => m(LEVEL_KEY[l]);
  const factors = Object.fromEntries(LEVELS.map((l) => [l, num(LEVEL_FACTOR[l])])) as Record<Level, string>;

  const mobile: ReactNode = (
    <ul>
      <li>{m('rulesMobileTap')}</li>
      <li>{m('rulesMobileBar')}</li>
      <li>{m('rulesMobileFs', { fs: k('fullscreen') })}</li>
      {ios && <li>{k('iosHomeScreenTip')}</li>}
    </ul>
  );

  return [
    { id: 'goal', body: <p>{m('rulesGoalText', { target: num(TARGET_UNITS), declare: num(DECLARE_THRESHOLD) })}</p> },
    { id: 'play', body: <p>{touch ? m('rulesPlayTouch') : m('rulesPlayKeys')}</p> },
    {
      id: 'rules',
      body: (
        <>
          <ul>
            <li>
              {m('rulesRuleDeck', {
                cards: num(DECK.cards), nines: num(DECK.nines), first: num(DEAL_FIRST), second: num(DEAL_SECOND),
                hand: num(DECK.hand), talon: num(DECK.talon), talonNines: num(DECK.talonNines),
              })}
            </li>
            <li>{m('rulesRulePlay')}</li>
            <li>{m('rulesRuleExchange', { min: num(MIN_TALON_FOR_EXCHANGE), declare: num(DECLARE_THRESHOLD), closeFailed: num(CLOSE_FAILED_UNITS) })}</li>
            <li>{m('rulesRuleMarriage', { plain: num(MARRIAGE_POINTS.plain), trump: num(MARRIAGE_POINTS.trump) })}</li>
            <li>{m('rulesRuleDeclare', { declare: num(DECLARE_THRESHOLD) })}</li>
            <li>{m('rulesRuleSnapszer')}</li>
            <li>
              {m('rulesRuleThree', {
                cards: num(DECK.three), hand: num(DECK.hand3), round: num(DEAL3_ROUND), fold: num(FOLD_UNITS), foldAce: num(FOLD_ACE_UNITS),
              })}
            </li>
          </ul>
          <p>{m('rulesValuesIntro')}</p>
          <CardValueDiagram />
        </>
      ),
    },
    {
      id: 'scoring',
      body: (
        <>
          <p>
            {m('rulesScoringDeal', {
              win: num(WIN_UNITS), maccsUnits: num(MACCS_UNITS), maccs: num(MACCS_THRESHOLD), noTrick: num(NO_TRICK_UNITS),
              snapszer: num(SNAPSZER_UNITS), declare: num(DECLARE_THRESHOLD), wrong: num(WRONG_DECLARE_UNITS), kontra: num(KONTRA_FACTOR),
            })}
          </p>
          <DealPointsDiagram />
          <p>
            {m('rulesScoringFormula', {
              zero: num(0), ppu: num(UNIT_POINTS), bonus: num(WIN_BONUS),
              easy: level('easy'), medium: level('medium'), hard: level('hard'),
              fe: factors.easy, fm: factors.medium, fh: factors.hard, max: num(MAX_SCORE),
            })}
          </p>
          <p>{m('rulesScoringExample', { you: num(EXAMPLE.you), opp: num(EXAMPLE.opp), level: level(EXAMPLE.level), points: num(exampleScore()) })}</p>
          <p>{m('rulesScoringOutcome')}</p>
          <p>{m('rulesScoringFinish', { zero: num(startScore()) })}</p>
        </>
      ),
    },
    { id: 'dental', body: <p>{m('rulesDentalText')}</p> },
    { id: 'mobile', body: mobile },
  ];
}
