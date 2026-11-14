# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses
[Semantic Versioning](https://semver.org/).

## [Unreleased]

### Fixed
- „Elég!” is a real call: with the points hidden it is open on every turn and looks the same at 66 (a wrong call gives the
  opponent 2 units); with „Pontok mutatása” on it is enabled only at 66.
- 20 / 40 buttons share one bar cell (suit icon and value, the suit in the accessible name); the landscape bar has two columns.
- Eight cards on an upright phone lay out in two overlapping rows of four; a three-player trick lies in one row on a phone.
- Corner index: the Hungarian Alsó is „Al”, no longer the same letter as the Ász.
- German uses the Schnapsen terms: „Ich bin draußen!”, „Bummerl”, „Schneider”, „schwarz”; Schnapser is glossed as the Hungarian
  snapszer announcement.
- The table scrolls into view again when a new deal starts on a phone.

## [1.0.0] - 2026-11-14

### Added
- Pure rules engine after Hungarian Wikipedia „Snapszer”: the two-player deal (3 + turned-up trump + 2, talon on the trump,
  optional nines), exchange and closing, 20 / 40, „Elég!”, last trick, snapszer and kontra; the three-player game (caller against
  the pair, trump from the first four, fold, kontra / rekontra / subkontra). Rulings where the wiki is silent are listed in
  `src/engine/index.ts`.
- Bots at three levels; the hard bot samples the unseen cards. Bold candidates (kontra, snapszer, close) need a margin over a
  higher minimum of samples, no bot announces 20 / 40 during a snapszer, and a hard-vs-medium strength gate.
- Match („rádli”) to 7 units, leaderboard score `matchScore` (0 … 5000), autosave with a replaying save guard.
- The table for two and three players: Hungarian cards from the kit, the turned-up trump crosswise under the talon with its count,
  won-trick piles, announced marriages as small King + Over pairs with 20 / 40, portraits of you, Gazsi and Rozi, a readable log
  and a deals table.
- Action bar with „Elég!” (enabled at 66), Exchange, Close, 20 / 40, Snapszer, Kontra (Rekontra, Subkontra) and Fold; cards you
  may not play are hatched and explained when tapped.
- Settings: two or three players and the nines (an in-page confirm gives a running match up, unranked), difficulty, bot speed,
  „Pontok mutatása” (your own counted points; off by default; the bots' are never shown) and dental mode.
- Rules dialog (button or R) with a card-value diagram and a deal-points diagram; every number comes from the engine and score
  constants.
- Finish early, only between deals: the completed deals are ranked with `matchScore(match, false)`, 0 at the start.
- Touch controls: tap a card to raise it, tap again (or Play) to play it; the table and the bar fit one phone screen during a deal,
  upright and sideways, under the standalone top bar or the portal header; full screen.
- Dental mode: a tooth on the card backs and the portraits as dentist, dental technician and orthodontist.
- `SnapszerDemo` for the portal card: bots play real matches, two and three players in turn.
- English, Hungarian and German, and a README in all three languages.
