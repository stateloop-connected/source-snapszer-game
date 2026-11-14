# 🂡 Snapszer

**English** · [Deutsch](README.de.md) · [Magyar](README.hu.md)

**Snapszer** (Schnapsen, "sixty-six"), the Hungarian race to 66, built with **React 18**, **Vite** and **TypeScript**. Play with
two players against **Gazsi**, or with three players against **Gazsi** and **Rozi**, using the Hungarian (Tell) deck. The game follows
the full Hungarian rules: the turned-up trump under the talon, exchange and closing, 20 / 40 marriages, „Elég!”, snapszer and
kontra. In the three-player game the caller plays alone against the other two. A match („rádli”) runs to 7 units, and a readable
log records every card and announcement.
It runs on its own **and** as one of the fifteen games of **[Zoltan's Arcade](https://github.com/ZoliQua/Arcade-Game-Center)**.
Play it at [dulzoltan.hu/arcade/#/play/snapszer](https://dulzoltan.hu/arcade/#/play/snapszer).

[![CI](https://github.com/ZoliQua/Snapszer-Game/actions/workflows/ci.yml/badge.svg)](https://github.com/ZoliQua/Snapszer-Game/actions/workflows/ci.yml)
![license](https://img.shields.io/badge/license-MIT-green)
![node](https://img.shields.io/badge/node-%E2%89%A520-339933?logo=node.js&logoColor=white)
![react](https://img.shields.io/badge/React-18-61dafb?logo=react&logoColor=white)
![vite](https://img.shields.io/badge/Vite-5-646cff?logo=vite&logoColor=white)
![typescript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white)

---

## 📑 Table of contents

- [The Zoltan's Arcade family](#%EF%B8%8F-the-zoltans-arcade-family)
- [Features](#-features)
- [Quick start](#-quick-start)
- [Rules in short](#-rules-in-short)
- [How to play](#%EF%B8%8F-how-to-play)
- [Scoring & stats](#-scoring--stats)
- [The bots](#-the-bots)
- [Autosave & resume](#-autosave--resume)
- [Embedding in Arcade-Game-Center](#-embedding-in-arcade-game-center)
- [Scripts](#-scripts)
- [Architecture](#%EF%B8%8F-architecture)
- [Contributing](#-contributing)
- [License](#%EF%B8%8F-license)

## 🕹️ The Zoltan's Arcade family

Every game is a standalone repo that also plugs into the portal. All of them share one design system, one scoring model and one save
format through the vendored [`src/arcade/`](./src/arcade) kit.

| Game | Repo | Genre |
| --- | --- | --- |
| 🏠 **Arcade portal** | [Arcade-Game-Center](https://github.com/ZoliQua/Arcade-Game-Center) | All games in one place, live demos, stats, leaderboard |
| 🧱 Tetris | [Tetris-Game](https://github.com/ZoliQua/Tetris-Game) | Arcade |
| 🐍 Snake | [Snake-Game](https://github.com/ZoliQua/Snake-Game) | Reflex |
| 🔢 2048 | [2048-Game](https://github.com/ZoliQua/2048-Game) | Puzzle |
| 🟡 Pac-Man | [Pac-Man-Game](https://github.com/ZoliQua/Pac-Man-Game) | Maze |
| ⚫ Gomoku | [Gomoku-Game](https://github.com/ZoliQua/Gomoku-Game) | Strategy |
| 🦷 Tic-Tac-Toe | [Tic-Tac-Toe-Game](https://github.com/ZoliQua/Tic-Tac-Toe-Game) | Duel |
| 🏓 Breakout | [Breakout-Game](https://github.com/ZoliQua/Breakout-Game) | Paddle |
| 👾 Space Invaders | [Space-Invaders-Game](https://github.com/ZoliQua/Space-Invaders-Game) | Shooter |
| 🔴 Connect Four | [Connect-Four-Game](https://github.com/ZoliQua/Connect-Four-Game) | Duel |
| 🔩 Nut Sort | [Nut-Sort-Game](https://github.com/ZoliQua/Nut-Sort-Game) | Sorting |
| 🃏 Texas Hold'em | [Texas-Holdem-Game](https://github.com/ZoliQua/Texas-Holdem-Game) | Cards |
| 💣 Minesweeper | [Minesweeper-Game](https://github.com/ZoliQua/Minesweeper-Game) | Logic |
| ♠️ Solitaire | [Solitaire-Game](https://github.com/ZoliQua/Solitaire-Game) | Cards |
| 🎴 Ulti | [Ulti-Game](https://github.com/ZoliQua/Ulti-Game) | Cards |
| 🂡 **Snapszer** (this repo) | [Snapszer-Game](https://github.com/ZoliQua/Snapszer-Game) | Cards |

## ✨ Features

- 🎴 **The Hungarian (Tell) deck** from the shared arcade kit: our own SVG redraw after the 1835 Schneider design, double-headed
  like the real deck, with the Tell figures and the season aces. Each suit has its own shape (heart, bell, leaf, acorn), so colour
  is never needed to tell the suits apart.
- 👥 **Two or three players**, a setting before the match. Two players use 20 cards (A, X, K, F, Alsó per suit); the
  **nines** setting adds the four nines, worth 0. Three players always use 24 cards.
- 🃏 **The real table**: the turned-up trump lies crosswise under the talon, and the talon shows how many cards are left. A closed
  talon is turned across the trump and says who closed it. Each seat shows its won-trick pile with a count and its announced
  marriages as a small King + Over pair with the 20 or 40 next to it.
- 🗣️ **Every announcement as a button** in the bar under the table: „Elég!” (enabled only once you really have 66), Exchange
  (Csere), Close (Betakarás), 20 / 40, Snapszer and Kontra (Rekontra and Subkontra in the three-player game), and Fold (Bedobás)
  for the three-player caller. A button is disabled (with a dashed outline) when the moment does not allow it.
- 🚫 **Rules enforced**: cards you may not play are dimmed **and hatched**, a shape cue rather than colour. Tap or click one
  anyway and the game tells you which rule stops it.
- 🙈 **Points counted in your head**, as at a real table. The „Pontok mutatása” / "Show points" setting (off by default) shows your
  own counted points (with two players also a 20 / 40 still waiting for your first trick). The bots' points are never shown during
  a deal.
- 🧑‍🎨 **Portraits** in the deck's woodcut style: you, **Gazsi** the coachman (spectacles, grey beard, cap) and **Rozi** the
  innkeeper (polka-dot headscarf, earrings). Each seat shows the name, the units, dealer, caller or defender, and a framed
  **▶ On turn** badge.
- 🤖 **Easy, Medium or Hard bots**. They only ever look at their own cards and the table. **Slow / Normal / Fast** sets their pace.
- 📖 **Rules dialog** (button or **R**): goal, how to play, the rules with a card-value diagram, the deal-points diagram, the
  scoring with every number taken from the game's own constants, dental mode and, on a phone, the touch controls. Opening it
  pauses the match.
- 🏁 **Finish**, between deals: it ends the match after a confirm and puts the score of the completed deals on the leaderboard,
  without the win bonus. Right at the start that is 0. A deal in progress cannot be escaped this way.
- ⛶ **Full screen** for the table (on iPhone a full-screen view without the page around it).
- ⏸️ **Pause** with P, or automatically when the tab is hidden. It freezes the bots and the timer.
- 💾 **Autosave & resume**: the match survives reloads and tab closes, even mid-trick.
- 🌗 **Dark / light theme** shared with every arcade game.
- 🌍 **Three languages**: English, Hungarian and German. Numbers follow the locale's grouping.
- 🦷 **Dental mode** („Fogas mód”, off by default, or `?dental=1`), shared across the arcade. It changes only the card backs (a
  tooth) and the portraits, with the same faces: you as the dentist, Gazsi as the dental technician (loupes and a denture) and Rozi
  as the orthodontist (a tooth in braces). The card faces and the rules stay the same.
- 🤖 **Attract-mode demo** (`<SnapszerDemo />`): bots play real matches on the portal's landing page, two and three players in turn.
- 📱 **Phone-friendly**: during a deal the table, your hand, the talon with the trump and the action bar fit on one screen
  without scrolling, upright and sideways.
- 🧪 **Tested**: deck, deal, play and scoring for two and three players, bot legality and strength, match scoring, saves, a whole
  deal played through the UI, the rules dialog, Finish, the touch controls, languages, dental mode and the demo.

## 🚀 Quick start

Requires **Node ≥ 20** and npm.

```bash
git clone https://github.com/ZoliQua/Snapszer-Game.git
cd Snapszer-Game
npm install
npm run dev          # http://localhost:5173
```

For a production build, run `npm run build && npm run preview`. The build uses relative asset paths, so `dist/` can be served from any sub-folder.

## 📏 Rules in short

The source is the Hungarian Wikipedia article „Snapszer”. Where it is silent, the decisions are written down in
[`src/engine/index.ts`](./src/engine/index.ts).

**Two players**

- **Deal**: 3 cards each, one card turned up for trump, then 2 more each. The other 9 cards (13 with the nines) lie face down on the
  trump as the talon. The dealer's opponent leads, and the dealer alternates.
- **Card values**: Ace 11, X 10, King 4, Over 3, Under (Alsó) 2, nine 0. The 20 cards add up to 120.
- **Play**: while the talon is open you may play any card, and the winner of the trick draws first. Once the talon is closed or
  used up you must follow suit and beat if you can; without the suit you must trump.
- **Exchange and close**: on your lead, while at least 3 cards lie above the trump, you may swap your trump Alsó for the turned-up
  trump, or close the talon.
- **20 / 40**: King and Over of one suit, shown on your lead, are worth 20 (40 in trump). They count once you have won a trick, and
  one of the two must be led next.
- **„Elég!”**: with 66 points you end the deal and win it. If nobody says it, the last trick wins.
- **Snapszer**: announced during the first round, you must take every trick: 6 units, or 6 to the opponent if it fails.
- **Kontra** doubles the deal, or the snapszer.

**Three players**: 24 cards, 8 each in two rounds of 4. The caller (the seat after the dealer) names the trump from its first 4
cards and plays alone against the other two, who count their tricks together. Before the first lead the caller may fold: each
defender then gets 2 units, or 4 if the caller holds an ace. Only the caller may announce snapszer. Everyone must follow suit and
beat, else trump and overtrump. Kontra, rekontra and subkontra each double. The caller moves on every deal.

| The loser … | Units |
| --- | --- |
| has at least 33 points | 1 |
| has fewer than 33 points („maccs”) | 2 |
| took no trick | 3 |
| Snapszer (made or failed) | 6 |

A player who closes and then misses 66 gives the opponent 1 unit (the wiki's value). A match runs until a seat has 7 units.

## ⌨️ How to play

| Key | Action |
| --- | --- |
| 🖱️ Click a card | Play it, or see why it is not allowed (three players, as the caller: name the trump with it) |
| 🖱️ Bar buttons | Elég!, exchange, close, 20 / 40, snapszer, kontra, fold |
| **Tab** / **Shift+Tab** | Move between the cards and the buttons (**Enter** / **Space** presses them) |
| **Enter** | Start · next deal · continue (when no button has focus) |
| **P** / **Esc** | Pause / resume |
| **R** | Open the rules |
| **T** | Toggle dark / light theme (standalone page) |

Hotkeys are ignored while you type in a form field or hold Cmd/Ctrl/Alt.

**On a phone**: tap a card to raise it and tap it again (or the **Play** button) to play it. The announcements sit in a bar under
the table, three thumb-sized buttons per row. When a deal starts, the table and the bar fill the screen under the page header, so
nothing needs scrolling. With the phone sideways the bar moves beside the table. **Full screen** above the table gives it the whole
screen. On an iPhone, *Share → Add to Home Screen* also hides the browser bars.

## 🎯 Scoring & stats

At the end of the match:

```
score = round((max(0, your units − best bot's units) × 100 + (won ? 500 : 0)) × level)
level: Easy 1 · Medium 1.5 · Hard 2          clamped to 0 … 5000
```

For example, winning 7 to 3 on Medium gives 1350 points. You win the match by finishing strictly on top; level with the best bot is
a draw. **Finish** ends the match early, between deals, with the same formula and no win bonus (0 right at the start). Changing the
mode, the nines or the difficulty during a match gives it up after an in-page confirm, without a score.
The kit records every finished match once under `arcade.stats.snapszer`. The stat strip shows the **Deal**, the **Units** (yours –
the best bot's), the **Score**, **Best** and the active **Time**.

## 🤖 The bots

- **Easy** plays random legal cards. It still says „Elég!” at 66, exchanges when it helps and announces its 20 / 40.
- **Medium** plays by rules of thumb: it leads low on an open talon, cashes master cards once play is strict, banks points and
  takes the trick that reaches 66.
- **Hard** deals the unseen cards in ways that fit everything it has seen, plays every candidate out with medium players and picks
  the best. Closing, snapszer, kontra and the fold are candidates too; they must win by a margin over a minimum number of samples.

In duplicate-seeded two-player matches, hard beats easy in 197 of 200, medium beats easy in 193 of 200, and hard beats medium in
54 of 60. A hard decision takes a few milliseconds.

## 💾 Autosave & resume

The match is saved as a whole under `arcade.session.snapszer` (schema 1): mode, nines, level, seed, the deal summaries, the units
and the current deal. The guard replays the saved deal from its seed and its log and accepts it only if every card, announcement
and result matches. Reloading shows **Welcome back** with the game paused. The bots' moves come from the saved state only, so a
resumed match plays on exactly as before.

## 🧩 Embedding in Arcade-Game-Center

```tsx
import { SnapszerGame, SnapszerDemo } from '@arcade/snapszer';

<SnapszerGame
  embedded                                   // hide the page title; the portal shows it
  onGameOver={(score, info) => submitScore('snapszer', score)}   // finished matches with points > 0; Finish: always, info = { finished: true }
  onRunEnd={(run) => console.log(run.outcome, run.score)}  // every finished match
  onStatusChange={({ status, score, seconds }) => updateHeader(status, seconds)}
/>
<SnapszerDemo active={cardIsVisible} />      // landing-page attract mode
```

Both components follow the shared `ArcadeGameProps` / `ArcadeDemoProps` contract from `src/arcade/types.ts`. On a phone the game
measures the height under a sticky page header (`.arc-topbar` standalone, `.header` in the portal).
Status mapping:
- `idle`: before a match (the setup card)
- `running`: during a match
- `paused`: while suspended or restored
- `gameOver`: after the deal that takes a seat to 7 units, or after **Finish**

## 🧪 Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Vite dev server |
| `npm run build` | Type-check (`tsc -b`) and production build |
| `npm run preview` | Serve the production build |
| `npm run typecheck` | `tsc -b` |
| `npm run lint` | ESLint |
| `npm test` | Vitest (engine, bots, match and component tests) |
| `npm run check` | lint → typecheck → test → build (what CI runs) |

## 🏗️ Architecture

```
src/
  arcade/        vendored Zoltan's Arcade kit — do not edit here (the Hungarian deck lives in arcade/hungarian)
  engine/        pure Snapszer rules: deck, two-player deal and play, scoring, three-player mode (three.ts)
  bots/          chooseAction at three levels; hard samples the unseen cards
  game/          match (rádli to 7), score, save (schema 1 + replay guard), finish, setup prefs, bot pace
  ui/            Table, Seat, Centre (talon, trump, trick), Hand, ActionBar, LogPanel, labels, figures/ (the portraits)
  demo/          SnapszerDemo (bots only)
  SnapszerGame.tsx  the embeddable game (ArcadeGameProps)
  rules.tsx      Rules dialog sections, the card-value and deal-points diagrams
  i18n.ts        en / hu / de strings
  App.tsx        standalone page: <ArcadeShell><SnapszerGame/></ArcadeShell>
  index.ts       package entry used by Arcade-Game-Center
```

The UI changes the game only through the match (`act`, `botStep`, `nextDeal`), and the match goes through the engine, which never
mutates its input and throws on anything illegal.

## 🤝 Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md), the [Code of Conduct](./CODE_OF_CONDUCT.md) and [SECURITY.md](./SECURITY.md).
Contributors are listed in [CONTRIBUTORS.md](./CONTRIBUTORS.md), and changes in [CHANGELOG.md](./CHANGELOG.md).

## ⚖️ License

[MIT](./LICENSE) © 2026 Zoltán Dul

---

<p align="center">Made with ❤️ by Zoltán Dul · part of <a href="https://github.com/ZoliQua/Arcade-Game-Center">Zoltan's Arcade</a></p>
