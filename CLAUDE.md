# Snapszer Game — CLAUDE.md

## Project Facts

* **Repository**: https://github.com/ZoliQua/Snapszer-Game (package `snapszer-game`)
* **Portal**: https://github.com/ZoliQua/Arcade-Game-Center — arcade id **`snapszer`**, colour token `--game-snapszer`,
  play URL https://dulzoltan.hu/arcade/#/play/snapszer. Once integrated, the same `src/` is mirrored into `Arcade-Game-Center/apps/snapszer/`.
* **Sister games**: Tetris, Snake (the reference implementation), 2048, Pac-Man, Gomoku, Tic-Tac-Toe, Breakout, Space Invaders,
  Connect Four, Nut Sort, Texas Hold'em, Minesweeper, Solitaire, Ulti. The closest template is Ulti (Hungarian cards,
  `src/engine/`, seeded deals, bots); Connect Four for shell wiring, persist guard and overlays.
* **Stack**: React 18.3, Vite 5.4, TypeScript 5.6, CSS Modules on the shared arcade tokens. No other runtime dependencies.
* **Package manager**: npm. **Node**: >=20.
* **Scripts**:
  * `npm run dev` — local dev server
  * `npm run build` — `tsc -b && vite build`
  * `npm run preview` — preview production build
  * `npm run typecheck` — `tsc -b`
  * `npm run lint` — ESLint (flat config, typescript-eslint)
  * `npm test` — Vitest (engine and component tests, jsdom)
  * `npm run check` — lint → typecheck → test → build (same as CI)
* **Deck**: the Hungarian (Tell) deck lives in the shared kit (`src/arcade/hungarian/`, imported from `./arcade`;
  pure modules import `arcade/hungarian/cards` directly so they stay React-free). Snapszer uses A, X, K, F, Alsó per
  suit (20 cards), plus the IX with the nines setting or in three-player mode (24). `HSuit` `piros | tok | zold | makk`,
  `HRank` `VII … X | also | felso | kiraly | asz`, `HCard`, `hCardLabel(card, lang)`.
* **Rules**: pure functions in `src/engine/` (no React), after Hungarian Wikipedia „Snapszer”. Where the wiki is silent
  the rulings are written down in `src/engine/index.ts`.
* **Communication**: respond to the user in **Hungarian** in chat, even though this file and the codebase are in English.

If any fact above disagrees with the real repository, verify first and flag the divergence to the user before editing code.

---

## Primary Goal

A correct, type-safe Snapszer (two players, and three players) against computer opponents that runs standalone and
embeds unchanged in the Arcade-Game-Center portal.

**Priority order**: correctness → truthfulness → verification → small diffs → maintainability → polish.

---

## Architecture

```
src/
  arcade/              # VENDORED shared kit from Arcade-Game-Center/packages/kit — never edit here
  engine/              # pure rules, no React: deck, deal, play, scoring, types
  bots/                # chooseAction(state, seat, level, rng): easy / medium / hard (hard samples the unseen cards)
  game/                # match.ts (rádli to 7 units), score.ts (matchScore, MAX_SCORE 5000), save.ts (schema 1 + guard)
  demo/SnapszerDemo.tsx  # bots only, writes nothing to storage
  SnapszerGame.tsx     # embeddable game, ArcadeGameProps
  App.tsx              # exactly <ArcadeShell gameId="snapszer"><SnapszerGame /></ArcadeShell>
  main.tsx             # imports arcade/arcade.css once, applyTheme(readTheme())
  index.ts             # exports SnapszerGame, SnapszerDemo, default
  test/setup.ts
```

Stats, Best, session autosave/restore, timer, theme, stat strip and overlays come from `src/arcade/`
(`useArcadeRun`, `useSessionAutosave`, `useRestoredSession`, `useRunTimer`, `StatPanel`, `GameOverlay`, `SaveBadge`, `KeyHelp`).
Change the kit only in Arcade-Game-Center and sync it.

---

## Working Rules

**Verify before and after every non-trivial change.** Read the target file and its neighbours; afterwards re-check imports, call sites and state transitions.

**No hallucination.** Never claim a build, lint or test passed without running it.

**Small, local, reversible changes.** One fix or one feature at a time.

**Preserve architecture.** Do not change Vite config, tsconfig, folder layout or styling approach without a stated reason and user approval.

**No new dependencies** without justification. No Zustand, game engines, lodash, immer, animation libraries.

**CSS**: CSS Modules + kit tokens only. No `:root`, `html`, `body`, `*` or bare element selectors in game styles. Must look right in both `[data-theme='dark']` and `[data-theme='light']`.

**Languages and dental mode**: every string en/hu/de through `useMessages`; numbers through `formatNumber`; dental mode from
`useDental()`. Switching language or dental mode never resets a run. Never colour-only meaning (the author is colour-blind).

---

## Implementation Protocol (short)

1. **Current state** — only what you verified from the repo.
2. **Goal** — the exact requested change.
3. **Plan** — the smallest safe path and which files you will touch.
4. **Edit** — only the scoped change.
5. **Verify** — `npm run check`; note any checks you skipped.
6. **Report** — see below.

---

## End-of-Task Report

* **Changed files** — each file with a one-line reason.
* **Verified** — which checks actually ran.
* **Not verified** — explicit gaps.
* **Risks / follow-ups** — only real concerns, no filler.

---

**Guiding principle**: correctness over speed, verification over confidence, truth over fluency, small safe diffs over large rewrites. When in doubt — inspect more, assume less, change less, state uncertainty clearly.

---

## Git & Commit Rules

- Commit **only** as `Zoltán Dul <zoltan.dul@gmail.com>` (the global git identity).
- **Never** add `Co-Authored-By: Claude …`, "Generated with Claude Code" or any AI attribution
  to commit messages or pull-request descriptions.
- Conventional Commits (`feat:`, `fix:`, `docs:`, `test:`, `refactor:`, `chore:`).
