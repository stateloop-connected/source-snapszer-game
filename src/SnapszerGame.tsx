import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import {
  FinishButton,
  formatClock,
  formatNumber,
  FullscreenButton,
  gameName,
  GameOverlay,
  hCardLabel,
  KeyHelp,
  RulesButton,
  SaveBadge,
  shouldIgnoreKey,
  StatPanel,
  TouchHelp,
  useArcadeRun,
  useDental,
  useImmersive,
  useIsTouch,
  useKitMessages,
  useLang,
  useMessages,
  useRestoredSession,
  useRunTimer,
  useSessionAutosave,
  type ArcadeGameProps,
  type ArcadeStatus,
  type HCard,
  type HSuit,
  type OverlayAction,
} from './arcade';
import { LEVELS, type Level } from './bots';
import {
  canClose,
  canDeclare,
  canDeclare3,
  canDeclareWin,
  canDeclareWin3,
  canExchange,
  canFold3,
  canKontra,
  canKontra3,
  canSnapszer,
  canSnapszer3,
  cardKey,
  createDeck,
  DECLARE_THRESHOLD,
  hasTrick,
  marriageOptions,
  marriageOptions3,
  marriagePoints,
  MARRIAGE_POINTS,
  points,
  points3,
  sideOf,
  sidePoints3,
  type Action,
  type Action3,
  type Seat,
  type SnapszerMode,
} from './engine';
import { act, botStep, isBotTurn, matchOutcome, nextDeal, startMatch, TARGET_UNITS, type Match } from './game/match';
import { readSetup, readShowPoints, writeSetup, writeShowPoints, type Setup } from './game/prefs';
import { isMatch, SAVE_GAME_ID, SAVE_SCHEMA } from './game/save';
import { matchScore } from './game/score';
import { canFinishNow, shownScore } from './game/finish';
import { botDelay, readSpeed, SPEED_FACTOR, SPEEDS, writeSpeed, type Speed } from './game/speed';
import { MESSAGES, type MessageKey } from './i18n';
import { useRulesSections } from './rules';
import { ActionBar, type BarButton } from './ui/ActionBar';
import { SeatFigure } from './ui/figures/SeatFigure';
import { REASON_KEY, suitName } from './ui/labels';
import { illegalReason, type IllegalReason } from './ui/legality';
import { LogPanel } from './ui/LogPanel';
import { winners } from './ui/logLines';
import { SuitIcon } from './ui/SuitIcon';
import { Table } from './ui/Table';
import { PHONE_LANDSCAPE, useMediaQuery } from './ui/useMediaQuery';
import styles from './SnapszerGame.module.css';

export { SAVE_SCHEMA } from './game/save';

/** The opponents' names: seat 1 (the two-player opponent, top-right with three) and seat 2 (top-left). */
export const BOT_NAMES = { 1: 'Gazsi', 2: 'Rozi' } as const;

/** Sticky page headers above the game: the standalone top bar and the portal's header. */
const STICKY_HEADERS = '.arc-topbar, .header';

type UiPhase = 'idle' | 'live' | 'paused';
/** A message worded at render time, so a language switch re-words it. */
type Notice = { reason: IllegalReason; suit: HSuit | null; led: HSuit | null };
type Confirm = { kind: 'abandon' } | { kind: 'setting'; label: MessageKey; next: Setup };

const DIFF_LABEL: Record<Level, MessageKey> = { easy: 'diffEasy', medium: 'diffMedium', hard: 'diffHard' };
const MODE_LABEL: Record<SnapszerMode, MessageKey> = { two: 'modeTwo', three: 'modeThree' };
const SPEED_LABEL: Record<Speed, MessageKey> = { slow: 'speedSlow', normal: 'speedNormal', fast: 'speedFast' };
const NOTICE_KEY: Record<IllegalReason, MessageKey> = {
  follow: 'reasonFollow',
  beat: 'reasonBeat',
  trump: 'reasonTrump',
  overtrump: 'reasonOvertrump',
  marriage: 'reasonMarriage',
};
const FIGURE_TITLE: Record<'classic' | 'dental', Record<Seat, MessageKey>> = {
  classic: { 0: 'figurePlayer', 1: 'figureGazsi', 2: 'figureRozi' },
  dental: { 0: 'figureDentist', 1: 'figureTechnician', 2: 'figureOrthodontist' },
};

const newSeed = () => (Date.now() ^ Math.floor(Math.random() * 0x7fffffff)) >>> 0;

function Segmented<T extends string>({ label, value, options, names, onChange, disabled = false }: {
  label: string;
  value: T;
  options: readonly T[];
  names: (v: T) => string;
  onChange(v: T): void;
  disabled?: boolean;
}) {
  return (
    <div className="arc-field" role="group" aria-label={label}>
      <span>{label}</span>
      <div className="arc-segmented">
        {options.map((o) => (
          <button key={o} type="button" aria-pressed={o === value} disabled={disabled} onClick={() => onChange(o)}>
            {names(o)}
          </button>
        ))}
      </div>
    </div>
  );
}

function Check({ label, desc, checked, disabled = false, onChange }: { label: string; desc?: string; checked: boolean; disabled?: boolean; onChange(v: boolean): void }) {
  return (
    <label className="arc-field" title={desc}>
      <input type="checkbox" checked={checked} disabled={disabled} onChange={(e) => onChange(e.currentTarget.checked)} />
      <span>
        {label}
        {desc && <small className={styles.desc}>{desc}</small>}
      </span>
    </label>
  );
}

export function SnapszerGame(props: ArcadeGameProps = {}) {
  const { embedded = false } = props;
  const tr = useMessages(MESSAGES);
  const k = useKitMessages();
  const [lang] = useLang();
  const [dental, setDental] = useDental();
  const restored = useRestoredSession<Match>(SAVE_GAME_ID, SAVE_SCHEMA, isMatch);
  const resumable = restored !== null && restored.data.phase !== 'finished';

  const [match, setMatch] = useState<Match | null>(() => (resumable ? restored.data : null));
  const [ui, setUi] = useState<UiPhase>(resumable ? 'paused' : 'idle');
  const [welcomeBack, setWelcomeBack] = useState(resumable);
  const [runKey, setRunKey] = useState(0);
  const [setup, setSetup] = useState<Setup>(() =>
    resumable ? { mode: restored.data.mode, withNines: restored.data.withNines, level: restored.data.level } : readSetup(),
  );
  const [speed, setSpeedState] = useState<Speed>(readSpeed);
  const [showPoints, setShowPointsState] = useState<boolean>(readShowPoints);
  const [confirm, setConfirm] = useState<Confirm | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [finishOpen, setFinishOpen] = useState(false);
  const [finishedEarly, setFinishedEarly] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLDivElement>(null);
  const toolsRef = useRef<HTMLDivElement>(null);
  const immersive = useImmersive(rootRef);
  const touch = useIsTouch();
  const phoneLandscape = useMediaQuery(PHONE_LANDSCAPE);
  const rulesSections = useRulesSections();

  const over = finishedEarly || match?.phase === 'finished';
  const status: ArcadeStatus = ui === 'idle' || !match ? 'idle' : over ? 'gameOver' : ui === 'paused' ? 'paused' : 'running';
  const running = status === 'running';
  const score = shownScore(match, finishedEarly);

  const seconds = useRunTimer(running && !finishOpen && !confirm, runKey, runKey === 0 && resumable ? (restored?.seconds ?? 0) : 0);
  const stats = useArcadeRun({
    gameId: 'snapszer',
    status,
    score,
    seconds,
    runKey,
    outcome: () => (finishedEarly ? 'finished' : match ? matchOutcome(match) : 'over'),
    props,
  });
  const savedAt = useSessionAutosave({
    gameId: SAVE_GAME_ID,
    schema: SAVE_SCHEMA,
    enabled: ui !== 'idle' && match !== null && !over,
    discard: ui === 'idle' || over,
    data: match,
    seconds,
    score: match ? matchScore(match, false) : 0,
  });

  const name = useCallback((s: Seat) => (s === 0 ? tr('you') : BOT_NAMES[s]), [tr]);
  const fmt = useCallback((n: number) => formatNumber(n, lang), [lang]);
  const deal = match?.deal ?? null;
  const moveKey = match ? `${match.dealNo}:${match.deal.log.length}` : '';

  // Any move clears the half-made choices.
  useEffect(() => {
    setSelected(null);
    setNotice(null);
  }, [moveKey]);

  // ── Bots: one move per turn after a visible delay; a pause, a confirm or a turn change cancels it. ──
  const latest = useRef(match);
  latest.current = match;
  const botKey = match && running && !confirm && !finishOpen && isBotTurn(match) ? moveKey : null;
  useEffect(() => {
    if (botKey === null || !latest.current) return;
    const ms = botDelay(latest.current.deal) * SPEED_FACTOR[speed];
    // The decision (the hard bot samples: a few ms) runs once, in its own task after the visible delay.
    const id = window.setTimeout(() => {
      const base = latest.current;
      if (!base || !isBotTurn(base)) return;
      const next = botStep(base);
      setMatch((m) => (m === base ? next : m));
    }, ms);
    return () => window.clearTimeout(id);
  }, [botKey, speed]);

  // Leaving the tab pauses, so neither the clock nor the bots run unseen.
  useEffect(() => {
    if (!running) return;
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') setUi((p) => (p === 'live' ? 'paused' : p));
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [running]);

  // ── Phone fit: the table and the bar take exactly the height left under a sticky page header. ──
  const immersiveOn = immersive.active;
  const inMatch = match !== null && ui !== 'idle';
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!touch || !root) return;
    const measure = () => {
      let top = 0;
      if (!immersiveOn) {
        for (const header of document.querySelectorAll(STICKY_HEADERS)) {
          const cs = window.getComputedStyle(header);
          if ((cs.position === 'sticky' || cs.position === 'fixed') && cs.display !== 'none' && cs.visibility !== 'hidden') {
            top = Math.max(top, header.getBoundingClientRect().bottom);
          }
        }
      }
      const h = window.visualViewport?.height ?? window.innerHeight;
      root.style.setProperty('--snap-fit-h', `${Math.round(h - top)}px`);
      root.style.setProperty('--snap-tools-h', `${Math.round(toolsRef.current?.getBoundingClientRect().height ?? 44)}px`);
    };
    measure();
    window.addEventListener('resize', measure);
    window.addEventListener('orientationchange', measure);
    window.visualViewport?.addEventListener('resize', measure);
    document.addEventListener('fullscreenchange', measure);
    return () => {
      window.removeEventListener('resize', measure);
      window.removeEventListener('orientationchange', measure);
      window.visualViewport?.removeEventListener('resize', measure);
      document.removeEventListener('fullscreenchange', measure);
    };
  }, [touch, immersiveOn, inMatch, phoneLandscape]);

  // When play starts or resumes on a phone, bring the table and the bar into view, the bar at the bottom edge.
  // Again whenever a new deal starts (the deal-over card may have been scrolled).
  const dealNo = match?.dealNo ?? 0;
  useEffect(() => {
    if (!touch || !running) return;
    mainRef.current?.scrollIntoView?.({ block: 'end', behavior: 'smooth' });
  }, [touch, running, dealNo]);

  // ── Match control ───────────────────────────────────────────
  const start = useCallback(() => {
    writeSetup(setup);
    setMatch(startMatch({ ...setup, seed: newSeed() }));
    setWelcomeBack(false);
    setConfirm(null);
    setFinishedEarly(false);
    setUi('live');
    setRunKey((n) => n + 1);
  }, [setup]);

  const togglePause = useCallback(() => {
    if (ui === 'idle' || over) return;
    setWelcomeBack(false);
    setUi((p) => (p === 'live' ? 'paused' : 'live'));
  }, [ui, over]);

  const toSetup = useCallback(() => {
    setMatch(null);
    setConfirm(null);
    setWelcomeBack(false);
    setFinishedEarly(false);
    setUi('idle');
  }, []);

  const requestNew = useCallback(() => {
    if (over || ui === 'idle') toSetup();
    else setConfirm({ kind: 'abandon' });
  }, [over, ui, toSetup]);

  /** Mode, nines and difficulty: changing one mid-match gives the match up (unranked) after an in-page confirm. */
  const changeSetup = useCallback(
    (label: MessageKey, next: Setup) => {
      if (inMatch && !over) {
        setConfirm({ kind: 'setting', label, next });
        return;
      }
      setSetup(next);
      writeSetup(next);
    },
    [inMatch, over],
  );

  const applySetting = useCallback(() => {
    if (confirm?.kind !== 'setting') return;
    setSetup(confirm.next);
    writeSetup(confirm.next);
    toSetup();
  }, [confirm, toSetup]);

  const finish = useCallback(() => {
    if (latest.current && canFinishNow(latest.current)) setFinishedEarly(true);
  }, []);

  // Opening the rules pauses a live match; closing them leaves it paused.
  const onRulesOpen = useCallback((open: boolean) => {
    if (open) setUi((p) => (p === 'live' ? 'paused' : p));
  }, []);

  const goNextDeal = useCallback(() => setMatch((m) => (m && m.phase === 'dealOver' ? nextDeal(m) : m)), []);

  // ── Your moves (the engine rejects anything illegal) ─────────
  const myTurn = running && !confirm && !finishOpen && match !== null && match.phase === 'playing' && match.deal.turn === 0;
  const doAct = useCallback((a: Action | Action3) => {
    const m = latest.current;
    if (!m) return;
    try {
      setMatch(act(m, a));
    } catch {
      /* not legal now: nothing changes */
    }
  }, []);

  const trumpPhase = deal?.mode === 'three' && deal.phase === 'trump';
  const onCard = useCallback(
    (card: HCard) => {
      if (!deal) return;
      const key = cardKey(card);
      if (deal.mode === 'three' && deal.phase === 'trump') {
        if (touch && selected !== key) return setSelected(key);
        return doAct({ type: 'trump', card });
      }
      const reason = illegalReason(deal, card);
      if (reason) {
        setNotice({ reason, suit: deal.mustLead ?? (reason === 'follow' || reason === 'beat' ? (deal.trick[0]?.card.suit ?? null) : deal.trump), led: deal.trick[0]?.card.suit ?? null });
        setSelected(null);
        return;
      }
      // Touch: the first tap raises the card, a second tap on the same card plays it.
      if (touch && selected !== key) {
        setNotice(null);
        setSelected(key);
        return;
      }
      doAct({ type: 'play', card });
    },
    [deal, doAct, touch, selected],
  );

  // ── Keys ────────────────────────────────────────────────────
  const dealOver = match?.phase === 'dealOver';
  // CSS full screen (iPhone) leaves on Escape; then Escape does only that.
  const cssImmersive = immersive.active && !immersive.native;
  const keyState = useRef({ status, confirm, dealOver, start, togglePause, goNextDeal, toSetup, cssImmersive });
  keyState.current = { status, confirm, dealOver, start, togglePause, goNextDeal, toSetup, cssImmersive };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (shouldIgnoreKey(e)) return;
      const s = keyState.current;
      if (e.key === 'Escape' && s.confirm) {
        e.preventDefault();
        setConfirm(null);
        return;
      }
      if (e.key === 'Escape' && s.cssImmersive) return;
      if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
        e.preventDefault();
        if (s.confirm) return;
        s.togglePause();
        return;
      }
      if (e.key === 'Enter') {
        if ((e.target as HTMLElement | null)?.closest?.('button, a, [role="button"], input, label')) return;
        e.preventDefault();
        if (s.confirm) return;
        if (s.status === 'idle') s.start();
        else if (s.status === 'paused') s.togglePause();
        else if (s.status === 'gameOver') s.toSetup();
        else if (s.dealOver) s.goNextDeal();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // ── View ────────────────────────────────────────────────────
  const keyRows = useMemo(
    (): [string, string][] => [
      ['Enter', tr('keyConfirm')],
      ['P Esc', tr('keyPause')],
      ['Tab', tr('keyCards')],
      ['R', k('rulesButton')],
    ],
    [tr, k],
  );
  const touchRows = useMemo(
    (): [string, string][] => [
      [tr('touchTap'), tr('touchTapAction')],
      [tr('touchBar'), tr('touchBarAction')],
    ],
    [tr],
  );

  const selectedCard = deal && selected ? (deal.hands[0].find((c) => cardKey(c) === selected) ?? null) : null;

  let statusLabel: string | undefined;
  if (running && match) {
    if (match.phase === 'dealOver') statusLabel = tr('dealOverStatus');
    else if (match.deal.turn === 0) statusLabel = tr('yourTurn');
    else statusLabel = tr('thinking', { name: name(match.deal.turn) });
  }

  // Your counted points (never the bots'), only with „Pontok mutatása”.
  let myPoints: string | null = null;
  if (showPoints && deal) {
    if (deal.mode === 'two') {
      const pending = hasTrick(deal, 0) ? 0 : marriagePoints(deal, 0);
      myPoints = tr('yourPoints', { points: fmt(points(deal, 0)) }) + (pending > 0 ? tr('pendingMarriage', { points: fmt(pending) }) : '');
    } else if (deal.phase === 'play') {
      myPoints = tr(sideOf(deal, 0) === 'caller' ? 'yourPoints' : 'pairPoints', { points: fmt(points3(deal, 0)) });
    }
  }

  // ── The action bar ──────────────────────────────────────────
  const mine = myTurn && deal !== null;
  let prompt = '';
  if (match && deal && running) {
    if (match.phase !== 'playing') prompt = '';
    else if (deal.turn !== 0) prompt = tr('promptWait', { name: name(deal.turn) });
    else if (trumpPhase) prompt = selectedCard ? tr('promptTapTrump', { card: hCardLabel(selectedCard, lang), suit: suitName(selectedCard.suit, tr) }) : tr('promptTrump');
    else if (selectedCard) prompt = tr('promptTapAgain', { card: hCardLabel(selectedCard, lang) });
    else if (deal.mustLead) prompt = tr('promptMarriage', { suit: suitName(deal.mustLead, tr) });
    else if (deal.trick.length > 0) prompt = tr('promptFollow', { card: hCardLabel(deal.trick[0].card, lang), name: name(deal.trick[0].seat) });
    else prompt = tr('promptLead');
  }
  const noticeText = notice
    ? tr(NOTICE_KEY[notice.reason], { suit: notice.suit ? suitName(notice.suit, tr) : '—', led: notice.led ? suitName(notice.led, tr) : '—' })
    : null;

  const buttons: BarButton[] = [];
  if (deal) {
    const on = (b: boolean) => !(mine && b);
    const play = deal.mode === 'two' || deal.phase === 'play';
    // „Elég!”: with the points hidden you count in your head, as at the table — the call is always open on your turn
    // (a wrong one costs WRONG_DECLARE_UNITS) and looks the same at 66. With the points shown, only a winning call.
    const declareWins = deal.mode === 'two' ? canDeclareWin(deal, 0) : canDeclareWin3(deal, 0);
    const declareLegal = deal.mode === 'two' ? canDeclare(deal, 0) : canDeclare3(deal, 0);
    buttons.push({
      id: 'declare', label: tr('declareBtn'), title: tr('declareInfo', { declare: fmt(DECLARE_THRESHOLD) }),
      disabled: on(play && (showPoints ? declareWins : declareLegal)), primary: showPoints && mine && declareWins,
      onClick: () => doAct({ type: 'declare' }),
    });
    if (deal.mode === 'two') {
      buttons.push({ id: 'exchange', label: tr('exchangeBtn'), title: tr('exchangeInfo'), disabled: on(canExchange(deal, 0)), onClick: () => doAct({ type: 'exchange' }) });
      buttons.push({ id: 'close', label: tr('closeBtn'), title: tr('closeInfo'), disabled: on(canClose(deal, 0)), onClick: () => doAct({ type: 'close' }) });
    }
    const suits = deal.mode === 'two' ? marriageOptions(deal, 0) : marriageOptions3(deal, 0);
    const marriageTitle = tr('marriageInfo', { plain: fmt(MARRIAGE_POINTS.plain), trump: fmt(MARRIAGE_POINTS.trump) });
    if (suits.length === 0 || !mine) {
      buttons.push({ id: 'marriage', label: tr('marriageNone'), title: marriageTitle, disabled: true, onClick: () => undefined });
    } else {
      // One cell whatever the count: the suit icon and the value on the button, the suit in its accessible name.
      const split = suits.map((suit): BarButton => {
        const pts = fmt(suit === deal.trump ? MARRIAGE_POINTS.trump : MARRIAGE_POINTS.plain);
        return {
          id: `marriage-${suit}`, name: tr('marriageBtn', { points: pts, suit: suitName(suit, tr) }), title: marriageTitle, disabled: false,
          onClick: () => doAct({ type: 'marriage', suit }),
          label: (
            <>
              <SuitIcon suit={suit} size={16} />
              {pts}
            </>
          ),
        };
      });
      buttons.push({ id: 'marriage', label: '', disabled: false, onClick: () => undefined, split });
    }
    buttons.push({
      id: 'snapszer', label: tr('snapszerBtn'), title: tr('snapszerInfo'),
      disabled: on(deal.mode === 'two' ? canSnapszer(deal, 0) : canSnapszer3(deal, 0)), onClick: () => doAct({ type: 'snapszer' }),
    });
    const kontraWord: MessageKey = deal.mode === 'three' ? (['kontraBtn', 'rekontraBtn', 'subkontraBtn', 'subkontraBtn'] as const)[deal.kontra.level] : 'kontraBtn';
    buttons.push({
      id: 'kontra', label: tr(kontraWord), title: tr('kontraInfo'),
      disabled: on(deal.mode === 'two' ? canKontra(deal, 0) : canKontra3(deal, 0)), onClick: () => doAct({ type: 'kontra' }),
    });
    if (deal.mode === 'three') {
      buttons.push({ id: 'fold', label: tr('foldBtn'), title: tr('foldInfo'), disabled: on(canFold3(deal, 0)), onClick: () => doAct({ type: 'fold' }) });
    }
  }
  const playButton: BarButton | null =
    mine && touch && selectedCard
      ? {
          id: 'play',
          label: trumpPhase ? tr('trumpBtn', { suit: suitName(selectedCard.suit, tr) }) : tr('playBtn', { card: hCardLabel(selectedCard, lang) }),
          disabled: false,
          primary: true,
          onClick: () => onCard(selectedCard),
        }
      : null;

  // ── Overlays ────────────────────────────────────────────────
  const dealResult = (m: Match): ReactNode => {
    const d = m.deal;
    if (!d.result) return null;
    const w = winners(d.result);
    const names = w.seats.length === 2 ? tr('and', { a: name(w.seats[0]), b: name(w.seats[1]) }) : name(w.seats[0]);
    const vars = { names, units: fmt(w.units), reason: tr(REASON_KEY[d.result.reason]) };
    const seats: Seat[] = d.mode === 'two' ? [0, 1] : [0, 1, 2];
    const cardPts =
      d.mode === 'two'
        ? seats.map((s) => tr('pointsOf', { name: name(s), points: fmt(points(d, s)) }))
        : [
            tr('pointsOf', { name: name(d.caller), points: fmt(sidePoints3(d, 'caller')) }),
            tr('pointsOf', {
              name: tr('and', { a: name(seats.filter((s) => s !== d.caller)[0]), b: name(seats.filter((s) => s !== d.caller)[1]) }),
              points: fmt(sidePoints3(d, 'defenders')),
            }),
          ];
    return (
      <div className={styles.result} data-testid="snapszer-deal-result">
        <p>
          <strong>{tr(w.seats.length === 2 ? 'logOver' : 'logOverOne', vars)}</strong>
        </p>
        {d.result.reason !== 'fold' && <p>{tr('dealPoints', { list: cardPts.join(' · ') })}</p>}
        <p>{seats.map((s) => tr('unitsLine', { name: name(s), units: tr('unitsShort', { units: fmt(m.units[s]), target: fmt(TARGET_UNITS) }) })).join(' · ')}</p>
      </div>
    );
  };

  let overlay: { title: string; message?: string; actions: OverlayAction[]; children?: ReactNode } | null = null;
  if (confirm?.kind === 'abandon') {
    overlay = {
      title: tr('abandonTitle'),
      message: tr('abandonBody'),
      actions: [
        { label: tr('abandon'), onClick: toSetup, primary: true },
        { label: tr('keepPlaying'), onClick: () => setConfirm(null), kbd: 'Esc' },
      ],
    };
  } else if (confirm?.kind === 'setting') {
    overlay = {
      title: tr('settingsTitle'),
      message: tr('settingsBody', { setting: tr(confirm.label) }),
      actions: [
        { label: tr('settingsApply'), onClick: applySetting, primary: true },
        { label: tr('keepPlaying'), onClick: () => setConfirm(null), kbd: 'Esc' },
      ],
    };
  } else if (status === 'paused' && match) {
    overlay = {
      title: welcomeBack ? k('welcomeBack') : k('paused'),
      message: welcomeBack
        ? tr('welcomeBody', { deal: fmt(match.dealNo), you: fmt(match.units[0]), target: fmt(TARGET_UNITS) })
        : tr('pausedBody'),
      actions: [
        { label: welcomeBack ? tr('continue') : k('resume'), onClick: togglePause, primary: true, kbd: 'P' },
        { label: tr('newMatch'), onClick: requestNew },
      ],
    };
  } else if (status === 'gameOver' && match) {
    const outcome = matchOutcome(match);
    const best = Math.max(stats.best, score);
    overlay = {
      title: finishedEarly ? k('finishedEarly') : tr(outcome === 'win' ? 'wonTitle' : outcome === 'draw' ? 'drawTitle' : 'lostTitle'),
      message:
        (score > 0 ? tr('resultPoints', { points: fmt(score) }) : tr('resultNoPoints')) +
        tr('resultTail', { deals: fmt(match.deals.length), time: formatClock(seconds), best: fmt(best) }) +
        (score > 0 && score > stats.bestBeforeRun ? tr('newBestSuffix') : ''),
      children: finishedEarly ? undefined : dealResult(match),
      actions: [{ label: tr('newMatch'), onClick: toSetup, primary: true, kbd: 'Enter' }],
    };
  } else if (running && match?.phase === 'dealOver') {
    overlay = {
      title: tr('dealOverTitle', { n: fmt(match.dealNo) }),
      children: dealResult(match),
      actions: [{ label: tr('nextDeal'), onClick: goNextDeal, primary: true, kbd: 'Enter' }],
    };
  }

  const finishAllowed = match !== null && !over && canFinishNow(match);
  const style = { '--game-color': 'var(--game-snapszer)' } as CSSProperties;
  const figure = (s: Seat) => <SeatFigure seat={s} dental={dental} title={tr(FIGURE_TITLE[dental ? 'dental' : 'classic'][s])} />;
  const playable =
    deal && myTurn && !trumpPhase ? new Set(deal.hands[0].filter((c) => illegalReason(deal, c) === null).map(cardKey)) : null;
  const ninesCards = fmt(createDeck({ mode: 'two', withNines: true }).length);

  const setupFields = (
    <>
      <Segmented<SnapszerMode>
        label={tr('mode')}
        value={setup.mode}
        options={['two', 'three']}
        names={(v) => tr(MODE_LABEL[v])}
        onChange={(mode) => mode !== setup.mode && changeSetup('mode', { ...setup, mode })}
      />
      <Check
        label={tr('nines')}
        desc={tr('ninesDesc', { cards: ninesCards, zero: fmt(0) })}
        checked={setup.mode === 'three' || setup.withNines}
        disabled={setup.mode === 'three'}
        onChange={(withNines) => changeSetup('nines', { ...setup, withNines })}
      />
      <Segmented<Level>
        label={tr('difficulty')}
        value={setup.level}
        options={LEVELS}
        names={(v) => tr(DIFF_LABEL[v])}
        onChange={(level) => level !== setup.level && changeSetup('difficulty', { ...setup, level })}
      />
    </>
  );

  return (
    <div ref={rootRef} className={`arc-game ${styles.game}`} style={style} data-testid="snapszer-game" data-touch={touch ? 'true' : 'false'} data-match={inMatch ? 'true' : 'false'}>
      {!embedded && (
        <header className="arc-game__head">
          <div>
            <h1 className="arc-game__title">{gameName('snapszer', lang)}</h1>
            <p className="arc-game__sub">{tr('subtitle')}</p>
          </div>
        </header>
      )}

      <StatPanel
        status={status}
        statusLabel={statusLabel}
        items={
          inMatch && match
            ? [
                { label: tr('statDeal'), value: fmt(match.dealNo) },
                {
                  label: tr('statUnits'),
                  value: tr('statUnitsValue', { you: fmt(match.units[0]), opp: fmt(match.mode === 'two' ? match.units[1] : Math.max(match.units[1], match.units[2])) }),
                },
                { label: k('score'), value: fmt(score) },
                { label: k('best'), value: fmt(Math.max(stats.best, over ? score : 0)) },
                { label: k('time'), value: formatClock(seconds) },
              ]
            : [
                { label: k('best'), value: fmt(stats.best) },
                { label: k('plays'), value: fmt(stats.plays) },
                { label: k('time'), value: formatClock(seconds) },
              ]
        }
      />

      <div className={styles.tools} ref={toolsRef}>
        <RulesButton sections={rulesSections} gameId="snapszer" onOpenChange={onRulesOpen} />
        <FinishButton score={score} visible={finishAllowed} onFinish={finish} onOpenChange={setFinishOpen} />
        {!finishAllowed &&
          inMatch &&
          !over && (
            <button type="button" className="arc-btn arc-finish__btn" disabled title={tr('finishNote')} aria-describedby="snapszer-finish-note" data-testid="snapszer-finish-disabled">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 21V4" />
                <path d="M5 4h11l-2 4 2 4H5" />
              </svg>
              {k('finishButton')}
            </button>
          )}
        <FullscreenButton immersive={immersive} />
      </div>

      <div className={styles.layout}>
        <div className={styles.main} ref={mainRef} data-phone-landscape={phoneLandscape ? 'true' : 'false'}>
          <div className={`arc-game__board arc-board-tap ${styles.board}`}>
            {deal && match ? (
              <Table
                deal={deal}
                units={match.units}
                target={TARGET_UNITS}
                name={name}
                figure={figure}
                lang={lang}
                tr={tr}
                fmt={fmt}
                dental={dental}
                fit={touch}
                turn={match.phase === 'playing' && running ? deal.turn : null}
                myPoints={myPoints}
                hand={{
                  selected: myTurn ? selected : null,
                  playable,
                  onCard: myTurn ? onCard : null,
                }}
              />
            ) : (
              <div className={styles.empty} />
            )}
            {status === 'idle' && !confirm && (
              <div className="arc-overlay" role="dialog" aria-label={gameName('snapszer', lang)}>
                <div className={`arc-overlay__card ${styles.setup}`}>
                  <h2 className="arc-overlay__title">{gameName('snapszer', lang)}</h2>
                  <p className="arc-overlay__msg">{tr('setupBody', { target: fmt(TARGET_UNITS) })}</p>
                  {setupFields}
                  <div className="arc-overlay__actions">
                    <button type="button" className="arc-btn arc-btn--primary" onClick={start}>
                      {tr('startMatch')}
                      <kbd className="arc-kbd">Enter</kbd>
                    </button>
                  </div>
                </div>
              </div>
            )}
            {overlay && <GameOverlay {...overlay} />}
          </div>
          {deal && (
            <ActionBar
              label={tr('touchBar')}
              prompt={prompt}
              mine={mine}
              notice={noticeText}
              play={playButton}
              buttons={buttons}
              bar={touch}
            />
          )}
        </div>

        <aside className={styles.side}>
          <LogPanel log={deal?.log ?? null} dealNo={match?.dealNo ?? 1} name={name} tr={tr} lang={lang} fmt={fmt} />

          <section className="arc-panel">
            <h2 className="arc-panel__title">{tr('panelMatch')}</h2>
            <div className={styles.buttons}>
              <button type="button" className="arc-btn arc-btn--primary" onClick={status === 'idle' ? start : togglePause} disabled={over}>
                {status === 'running' ? k('pause') : status === 'paused' ? k('resume') : k('start')}
              </button>
              <button type="button" className="arc-btn" onClick={requestNew} disabled={status === 'idle'}>
                {tr('newMatch')}
              </button>
            </div>
            {inMatch && match && (
              <p className={styles.note}>
                {tr('matchNote', { mode: tr(MODE_LABEL[match.mode]), difficulty: tr(DIFF_LABEL[match.level]), target: fmt(TARGET_UNITS) })}
              </p>
            )}
            {inMatch && !over && (
              <p className={styles.note} id="snapszer-finish-note">
                {tr('finishNote')}
              </p>
            )}
            <SaveBadge savedAt={inMatch ? savedAt : null} />
          </section>

          <section className="arc-panel">
            <h2 className="arc-panel__title">{tr('panelDeals')}</h2>
            {match && match.deals.length > 0 ? (
              <table className={styles.history} data-testid="snapszer-history">
                <thead>
                  <tr>
                    <th scope="col">{tr('colDeal')}</th>
                    <th scope="col">{tr('colWinner')}</th>
                    <th scope="col">{tr('colReason')}</th>
                    <th scope="col">{tr('colUnits')}</th>
                  </tr>
                </thead>
                <tbody>
                  {match.deals.map((d) => {
                    const won = ([0, 1, 2] as Seat[]).filter((s) => d.units[s] > 0);
                    return (
                      <tr key={d.dealNo}>
                        <td>{fmt(d.dealNo)}</td>
                        <td>{won.length === 2 ? tr('and', { a: name(won[0]), b: name(won[1]) }) : name(won[0])}</td>
                        <td>{tr(REASON_KEY[d.reason])}</td>
                        <td>{fmt(d.units[won[0]])}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <p className={styles.note}>{tr('noDealsYet')}</p>
            )}
          </section>

          <section className="arc-panel">
            <h2 className="arc-panel__title">{tr('panelSettings')}</h2>
            <div className={styles.settings}>
              {setupFields}
              <Segmented
                label={tr('setSpeed')}
                value={speed}
                options={SPEEDS}
                names={(v) => tr(SPEED_LABEL[v])}
                onChange={(v) => {
                  setSpeedState(v);
                  writeSpeed(v);
                }}
              />
              <Check
                label={tr('showPoints')}
                desc={tr('showPointsDesc')}
                checked={showPoints}
                onChange={(v) => {
                  setShowPointsState(v);
                  writeShowPoints(v);
                }}
              />
              <Check label={k('dental')} desc={k('dentalDesc')} checked={dental} onChange={setDental} />
            </div>
          </section>

          <section className="arc-panel">
            <h2 className="arc-panel__title">{tr('panelKeys')}</h2>
            <KeyHelp rows={keyRows} />
            <TouchHelp rows={touchRows} />
          </section>
        </aside>
      </div>
    </div>
  );
}

export default SnapszerGame;
