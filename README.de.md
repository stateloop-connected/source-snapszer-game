# 🂡 Snapszer

[English](README.md) · **Deutsch** · [Magyar](README.hu.md)

**Snapszer** (Schnapsen, „Sechsundsechzig“), das ungarische Rennen auf 66, gebaut mit **React 18**, **Vite** und **TypeScript**.
Du spielst zu zweit gegen **Gazsi** oder zu dritt gegen **Gazsi** und **Rozi**, mit dem ungarischen (Tell-)Blatt. Das Spiel folgt
den vollständigen ungarischen Regeln: der aufgedeckte Trumpf unter dem Talon, Tauschen und Zudrehen, 20 / 40, „Elég!“ (Genug!),
Schnapser und Kontra. Zu dritt spielt der Ansager allein gegen die beiden anderen. Eine Partie („Rádli“) geht bis 7 Einheiten, und
ein gut lesbares Protokoll hält jede Karte und jede Ansage fest.
Es läuft eigenständig **und** als eines der fünfzehn Spiele von **[Zoltan's Arcade](https://github.com/ZoliQua/Arcade-Game-Center)**.
Spiel es unter [dulzoltan.hu/arcade/#/play/snapszer](https://dulzoltan.hu/arcade/#/play/snapszer).

[![CI](https://github.com/ZoliQua/Snapszer-Game/actions/workflows/ci.yml/badge.svg)](https://github.com/ZoliQua/Snapszer-Game/actions/workflows/ci.yml)
![license](https://img.shields.io/badge/license-MIT-green)
![node](https://img.shields.io/badge/node-%E2%89%A520-339933?logo=node.js&logoColor=white)
![react](https://img.shields.io/badge/React-18-61dafb?logo=react&logoColor=white)
![vite](https://img.shields.io/badge/Vite-5-646cff?logo=vite&logoColor=white)
![typescript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white)

---

## 📑 Inhaltsverzeichnis

- [Die Zoltan's-Arcade-Familie](#%EF%B8%8F-die-zoltans-arcade-familie)
- [Funktionen](#-funktionen)
- [Schnellstart](#-schnellstart)
- [Die Regeln in Kürze](#-die-regeln-in-kürze)
- [So spielst du](#%EF%B8%8F-so-spielst-du)
- [Punkte & Statistik](#-punkte--statistik)
- [Die Bots](#-die-bots)
- [Autospeichern & Fortsetzen](#-autospeichern--fortsetzen)
- [Einbindung in Arcade-Game-Center](#-einbindung-in-arcade-game-center)
- [Skripte](#-skripte)
- [Architektur](#%EF%B8%8F-architektur)
- [Mitwirken](#-mitwirken)
- [Lizenz](#%EF%B8%8F-lizenz)

## 🕹️ Die Zoltan's-Arcade-Familie

Jedes Spiel ist ein eigenes Repo, das sich auch ins Portal einfügt. Alle teilen ein Designsystem, ein Punktemodell und ein
Speicherformat über das eingebundene [`src/arcade/`](./src/arcade)-Kit.

| Spiel | Repo | Genre |
| --- | --- | --- |
| 🏠 **Arcade-Portal** | [Arcade-Game-Center](https://github.com/ZoliQua/Arcade-Game-Center) | Alle Spiele an einem Ort, Live-Demos, Statistik, Bestenliste |
| 🧱 Tetris | [Tetris-Game](https://github.com/ZoliQua/Tetris-Game) | Arcade |
| 🐍 Snake | [Snake-Game](https://github.com/ZoliQua/Snake-Game) | Reaktion |
| 🔢 2048 | [2048-Game](https://github.com/ZoliQua/2048-Game) | Puzzle |
| 🟡 Pac-Man | [Pac-Man-Game](https://github.com/ZoliQua/Pac-Man-Game) | Labyrinth |
| ⚫ Gomoku | [Gomoku-Game](https://github.com/ZoliQua/Gomoku-Game) | Strategie |
| 🦷 Tic-Tac-Toe | [Tic-Tac-Toe-Game](https://github.com/ZoliQua/Tic-Tac-Toe-Game) | Duell |
| 🏓 Breakout | [Breakout-Game](https://github.com/ZoliQua/Breakout-Game) | Schläger |
| 👾 Space Invaders | [Space-Invaders-Game](https://github.com/ZoliQua/Space-Invaders-Game) | Shooter |
| 🔴 Connect Four | [Connect-Four-Game](https://github.com/ZoliQua/Connect-Four-Game) | Duell |
| 🔩 Nut Sort | [Nut-Sort-Game](https://github.com/ZoliQua/Nut-Sort-Game) | Sortieren |
| 🃏 Texas Hold'em | [Texas-Holdem-Game](https://github.com/ZoliQua/Texas-Holdem-Game) | Karten |
| 💣 Minesweeper | [Minesweeper-Game](https://github.com/ZoliQua/Minesweeper-Game) | Logik |
| ♠️ Solitaire | [Solitaire-Game](https://github.com/ZoliQua/Solitaire-Game) | Karten |
| 🎴 Ulti | [Ulti-Game](https://github.com/ZoliQua/Ulti-Game) | Karten |
| 🂡 **Snapszer** (dieses Repo) | [Snapszer-Game](https://github.com/ZoliQua/Snapszer-Game) | Karten |

## ✨ Funktionen

- 🎴 **Das ungarische (Tell-)Blatt** aus dem gemeinsamen Arcade-Kit: unsere eigene SVG-Neuzeichnung nach dem Schneider-Muster
  von 1835, doppelköpfig wie das echte Blatt, mit den Tell-Figuren und den Jahreszeiten-Assen. Jede Farbe hat ihre eigene Form
  (Herz, Schelle, Blatt, Eichel), man braucht also nie die Farbe, um sie zu unterscheiden.
- 👥 **Zu zweit oder zu dritt**, eine Einstellung vor der Partie. Zu zweit spielt man mit 20 Karten (Ass, Zehn, König, Ober,
  Unter je Farbe); die Einstellung **Mit den Neunern** nimmt die vier Neunen dazu, die 0 zählen. Zu dritt sind es immer 24 Karten.
- 🃏 **Der echte Tisch**: Der aufgedeckte Trumpf liegt quer unter dem Talon, und der Talon zeigt, wie viele Karten übrig sind. Ein
  zugedrehter Talon liegt quer über dem Trumpf und sagt, wer zugedreht hat. Jeder Platz zeigt seinen Stichstapel mit Anzahl und
  seine Ansagen als kleines Paar aus König und Ober mit der 20 oder 40 daneben.
- 🗣️ **Jede Ansage als Knopf** in der Leiste unter dem Tisch: „Genug!“ (nur aktiv, wenn du wirklich 66 hast), Tauschen, Zudrehen,
  20 / 40, Schnapser und Kontra (zu dritt Rekontra und Subkontra) und Hinwerfen für den Ansager zu dritt. Ein Knopf ist
  deaktiviert (mit gestricheltem Rand), wenn der Moment ihn nicht erlaubt.
- 🚫 **Die Regeln werden durchgesetzt**: Karten, die du nicht spielen darfst, sind abgedunkelt **und schraffiert**, also durch eine
  Form erkennbar statt durch Farbe. Tippst oder klickst du trotzdem darauf, sagt das Spiel dir, welche Regel es verbietet.
- 🙈 **Punkte im Kopf zählen**, wie am echten Tisch. Die Einstellung „Punkte anzeigen“ (standardmäßig aus) zeigt deine eigenen
  gezählten Punkte (zu zweit auch eine 20 / 40, die noch auf deinen ersten Stich wartet). Die Punkte der Bots werden während
  einer Runde nie gezeigt.
- 🧑‍🎨 **Porträts** im Holzschnittstil des Blatts: du, **Gazsi**, der Kutscher (Brille, grauer Bart, Schirmmütze), und **Rozi**,
  die Wirtin (gepunktetes Kopftuch, Ohrringe). Jeder Platz zeigt Namen, Einheiten, Geber, Ansager oder Gegenspieler und ein
  umrandetes **▶ Am Zug**-Abzeichen.
- 🤖 **Bots auf Leicht, Mittel oder Schwer**. Sie sehen nur ihre eigenen Karten und den Tisch. **Langsam / Normal / Schnell** stellt
  ihr Tempo ein.
- 📖 **Regel-Dialog** (Knopf oder **R**): Ziel, Spielweise, die Regeln mit einem Diagramm der Kartenwerte, das Diagramm der
  Rundenwerte, die Wertung mit jeder Zahl aus den Konstanten des Spiels, Zahnmodus und auf dem Handy die Touch-Steuerung. Das Öffnen
  pausiert die Partie.
- 🏁 **Beenden**, zwischen zwei Runden: Nach einer Bestätigung endet die Partie, und die Punktzahl der gespielten Runden kommt ohne
  Siegbonus in die Bestenliste. Ganz am Anfang sind das 0. Einer laufenden Runde kann man so nicht entkommen.
- ⛶ **Vollbild** für den Tisch (auf dem iPhone eine Vollbildansicht ohne die Seite drumherum).
- ⏸️ **Pause** mit P oder automatisch, wenn der Tab verborgen ist. Sie hält die Bots und die Uhr an.
- 💾 **Autospeichern & Fortsetzen**: Die Partie übersteht Neuladen und geschlossene Tabs, auch mitten im Stich.
- 🌗 **Dunkles / helles Design**, gemeinsam mit allen Arcade-Spielen.
- 🌍 **Drei Sprachen**: Englisch, Ungarisch und Deutsch. Zahlen folgen der Gruppierung der Sprache.
- 🦷 **Zahnmodus** („Zahnmodus“, standardmäßig aus, oder `?dental=1`), in der ganzen Arcade geteilt. Er ändert nur die Kartenrücken
  (ein Zahn) und die Porträts, mit denselben Gesichtern: du als Zahnarzt, Gazsi als Zahntechniker (Lupenbrille und Gebiss) und Rozi
  als Kieferorthopädin (ein Zahn mit Spange). Die Kartenbilder und die Regeln bleiben gleich.
- 🤖 **Demo im Attract-Modus** (`<SnapszerDemo />`): Bots spielen echte Partien auf der Startseite des Portals, abwechselnd zu
  zweit und zu dritt.
- 📱 **Handytauglich**: Während einer Runde passen der Tisch, deine Karten, der Talon mit dem Trumpf und die Aktionsleiste ohne
  Scrollen auf einen Bildschirm, hochkant und quer.
- 🧪 **Getestet**: Blatt, Geben, Spiel und Wertung zu zweit und zu dritt, Regeltreue und Stärke der Bots, Partiewertung,
  Speicherstände, eine ganze Runde über die Oberfläche, der Regel-Dialog, Beenden, die Touch-Steuerung, Sprachen, Zahnmodus und
  die Demo.

## 🚀 Schnellstart

Benötigt **Node ≥ 20** und npm.

```bash
git clone https://github.com/ZoliQua/Snapszer-Game.git
cd Snapszer-Game
npm install
npm run dev          # http://localhost:5173
```

Für einen Produktions-Build: `npm run build && npm run preview`. Der Build nutzt relative Pfade, `dist/` lässt sich also aus jedem
Unterordner ausliefern.

## 📏 Die Regeln in Kürze

Die Quelle ist der ungarische Wikipedia-Artikel „Snapszer“. Wo er schweigt, stehen die Entscheidungen in
[`src/engine/index.ts`](./src/engine/index.ts).

**Zu zweit**

- **Geben**: je 3 Karten, eine Karte wird als Trumpf aufgedeckt, dann je 2 weitere. Die übrigen 9 Karten (13 mit den Neunern)
  liegen verdeckt als Talon auf dem Trumpf. Der Gegner des Gebers spielt aus, und der Geber wechselt.
- **Kartenwerte**: Ass 11, Zehn 10, König 4, Ober 3, Unter 2, Neun 0. Die 20 Karten ergeben zusammen 120.
- **Spiel**: Solange der Talon offen ist, darfst du jede Karte spielen, und wer den Stich macht, zieht zuerst. Ist der Talon
  zugedreht oder aufgebraucht, musst du Farbe bedienen und, wenn du kannst, stechen; ohne die Farbe musst du trumpfen.
- **Tauschen und Zudrehen**: Wenn du ausspielst und noch mindestens 3 Karten auf dem Trumpf liegen, darfst du deinen Trumpf-Unter
  gegen den aufgedeckten Trumpf tauschen oder den Talon zudrehen.
- **20 / 40**: König und Ober einer Farbe, beim eigenen Ausspielen gezeigt, zählen 20 (in Trumpf 40). Sie zählen, sobald du einen
  Stich gemacht hast, und eine der beiden Karten musst du gleich ausspielen.
- **„Genug!“**: Mit 66 Punkten beendest du die Runde und gewinnst sie. Sagt es niemand, gewinnt der letzte Stich.
- **Schnapser**: In der ersten Runde angesagt, musst du alle Stiche machen: 6 Einheiten, oder 6 für den Gegner, wenn es misslingt.
- **Kontra** verdoppelt die Runde oder den Schnapser.

**Zu dritt**: 24 Karten, je 8 in zwei Runden zu 4. Der Ansager (der Platz nach dem Geber) sagt Trumpf aus seinen ersten 4 Karten an
und spielt allein gegen die beiden anderen, die ihre Stiche zusammenzählen. Vor dem ersten Ausspielen darf der Ansager hinwerfen:
Dann bekommt jeder Gegenspieler 2 Einheiten, oder 4, wenn der Ansager ein Ass hat. Nur der Ansager darf Schnapser ansagen. Alle
müssen Farbe bedienen und stechen, sonst trumpfen und übertrumpfen. Kontra, Rekontra und Subkontra verdoppeln jeweils. Der Ansager
wechselt jede Runde.

| Der Verlierer … | Einheiten |
| --- | --- |
| hat mindestens 33 Punkte | 1 |
| hat weniger als 33 Punkte („Maccs“) | 2 |
| hat keinen Stich gemacht | 3 |
| Schnapser (geschafft oder misslungen) | 6 |

Wer zudreht und dann keine 66 erreicht, gibt dem Gegner 1 Einheit (der Wert aus dem Wiki). Eine Partie läuft, bis ein Platz
7 Einheiten hat.

## ⌨️ So spielst du

| Taste | Aktion |
| --- | --- |
| 🖱️ Klick auf eine Karte | Ausspielen oder sehen, warum es nicht erlaubt ist (zu dritt als Ansager: damit Trumpf ansagen) |
| 🖱️ Knöpfe der Leiste | Genug!, tauschen, zudrehen, 20 / 40, Schnapser, Kontra, hinwerfen |
| **Tab** / **Umschalt+Tab** | Zwischen Karten und Knöpfen wechseln (**Enter** / **Leertaste** drückt sie) |
| **Enter** | Start · nächste Runde · weiter (wenn kein Knopf den Fokus hat) |
| **P** / **Esc** | Pause / weiter |
| **R** | Die Regeln öffnen |
| **T** | Dunkles / helles Design (eigenständige Seite) |

Tastenkürzel werden ignoriert, solange du in einem Formularfeld tippst oder Cmd/Strg/Alt hältst.

**Auf dem Handy**: Tippe auf eine Karte, sie hebt sich; tippe noch einmal darauf (oder auf den Knopf **Ausspielen**), um sie zu
spielen. Die Ansagen sitzen in einer Leiste unter dem Tisch, drei daumengroße Knöpfe pro Reihe. Beginnt eine Runde, füllen Tisch und
Leiste den Bildschirm unter der Kopfzeile, sodass nichts gescrollt werden muss. Liegt das Handy quer, rückt die Leiste neben den
Tisch. **Vollbild** über dem Tisch gibt ihm den ganzen Bildschirm. Auf dem iPhone blendet *Teilen → Zum Home-Bildschirm* zusätzlich
die Browserleisten aus.

## 🎯 Punkte & Statistik

Am Ende der Partie:

```
Punktzahl = round((max(0, deine Einheiten − Einheiten des besten Bots) × 100 + (gewonnen ? 500 : 0)) × Stufe)
Stufe: Leicht 1 · Mittel 1,5 · Schwer 2          begrenzt auf 0 … 5000
```

Ein Sieg 7 zu 3 auf Mittel bringt zum Beispiel 1350 Punkte. Du gewinnst die Partie, wenn du allein vorn liegst; Gleichstand mit dem
besten Bot ist ein Unentschieden. **Beenden** schließt die Partie zwischen zwei Runden vorzeitig ab, mit derselben Formel ohne
Siegbonus (ganz am Anfang 0). Wer während einer Partie die Spielerzahl, die Neuner oder die Schwierigkeit ändert, gibt sie nach einer
Bestätigung auf der Seite ohne Wertung auf.
Das Kit zählt jede beendete Partie einmal unter `arcade.stats.snapszer`. Die Statistikleiste zeigt **Runde**, **Einheiten** (deine –
die des besten Bots), **Punkte**, **Bestwert** und die aktive **Zeit**.

## 🤖 Die Bots

- **Leicht** spielt zufällige erlaubte Karten. Es sagt trotzdem bei 66 „Genug!“, tauscht, wenn es hilft, und sagt seine 20 / 40 an.
- **Mittel** spielt nach Faustregeln: Bei offenem Talon spielt es niedrig aus, im strengen Spiel holt es seine höchsten Karten,
  sichert Punkte und nimmt den Stich, der 66 bringt.
- **Schwer** verteilt die unbekannten Karten so, wie es zu allem passt, was es gesehen hat, spielt jede mögliche Aktion mit
  mittleren Spielern durch und wählt die beste. Zudrehen, Schnapser, Kontra und Hinwerfen sind auch Kandidaten; sie müssen mit
  Abstand und über eine Mindestzahl von Stichproben gewinnen.

In Partien zu zweit mit gespiegelten Karten schlägt Schwer Leicht in 197 von 200, Mittel Leicht in 193 von 200 und Schwer Mittel
in 54 von 60. Eine Entscheidung von Schwer dauert wenige Millisekunden.

## 💾 Autospeichern & Fortsetzen

Die Partie wird als Ganzes unter `arcade.session.snapszer` gespeichert (Schema 1): Spielerzahl, Neuner, Stufe, Startwert, die
Rundenübersichten, die Einheiten und die laufende Runde. Die Prüfung spielt die gespeicherte Runde aus ihrem Startwert und ihrem
Protokoll nach und nimmt sie nur an, wenn jede Karte, Ansage und jedes Ergebnis übereinstimmt. Nach dem Neuladen erscheint
**Willkommen zurück** mit pausiertem Spiel. Die Züge der Bots hängen nur vom gespeicherten Stand ab, eine fortgesetzte Partie läuft
also genau so weiter wie zuvor.

## 🧩 Einbindung in Arcade-Game-Center

```tsx
import { SnapszerGame, SnapszerDemo } from '@arcade/snapszer';

<SnapszerGame
  embedded                                   // den Seitentitel ausblenden; das Portal zeigt ihn
  onGameOver={(score, info) => submitScore('snapszer', score)}   // beendete Partien mit Punkten > 0; Beenden: immer, info = { finished: true }
  onRunEnd={(run) => console.log(run.outcome, run.score)}  // jede beendete Partie
  onStatusChange={({ status, score, seconds }) => updateHeader(status, seconds)}
/>
<SnapszerDemo active={cardIsVisible} />      // Attract-Modus auf der Startseite
```

Beide Komponenten folgen dem gemeinsamen Vertrag `ArcadeGameProps` / `ArcadeDemoProps` aus `src/arcade/types.ts`. Auf dem Handy misst
das Spiel die Höhe unter einer klebenden Kopfzeile (`.arc-topbar` eigenständig, `.header` im Portal).
Status-Zuordnung:
- `idle`: vor einer Partie (die Einstellungskarte)
- `running`: während einer Partie
- `paused`: angehalten oder wiederhergestellt
- `gameOver`: nach der Runde, die einen Platz auf 7 Einheiten bringt, oder nach **Beenden**

## 🧪 Skripte

| Skript | Zweck |
| --- | --- |
| `npm run dev` | Vite-Entwicklungsserver |
| `npm run build` | Typprüfung (`tsc -b`) und Produktions-Build |
| `npm run preview` | Den Produktions-Build ausliefern |
| `npm run typecheck` | `tsc -b` |
| `npm run lint` | ESLint |
| `npm test` | Vitest (Engine-, Bot-, Partie- und Komponententests) |
| `npm run check` | lint → typecheck → test → build (was die CI ausführt) |

## 🏗️ Architektur

```
src/
  arcade/        eingebundenes Zoltan's-Arcade-Kit — hier nicht bearbeiten (das ungarische Blatt liegt in arcade/hungarian)
  engine/        reine Snapszer-Regeln: Blatt, Geben und Spiel zu zweit, Wertung, Spiel zu dritt (three.ts)
  bots/          chooseAction auf drei Stufen; Schwer zieht Stichproben der unbekannten Karten
  game/          Partie (Rádli bis 7), Wertung, Speichern (Schema 1 + Prüfung durch Nachspielen), Beenden, Einstellungen, Bot-Tempo
  ui/            Table, Seat, Centre (Talon, Trumpf, Stich), Hand, ActionBar, LogPanel, Beschriftungen, figures/ (die Porträts)
  demo/          SnapszerDemo (nur Bots)
  SnapszerGame.tsx  das einbettbare Spiel (ArcadeGameProps)
  rules.tsx      Abschnitte des Regel-Dialogs, die Diagramme der Karten- und Rundenwerte
  i18n.ts        Texte in en / hu / de
  App.tsx        eigenständige Seite: <ArcadeShell><SnapszerGame/></ArcadeShell>
  index.ts       Paketeinstieg für Arcade-Game-Center
```

Die Oberfläche ändert das Spiel nur über die Partie (`act`, `botStep`, `nextDeal`), und die Partie geht über die Engine, die ihre
Eingabe nie verändert und bei allem Unerlaubten eine Ausnahme wirft.

## 🤝 Mitwirken

Siehe [CONTRIBUTING.md](./CONTRIBUTING.md), den [Verhaltenskodex](./CODE_OF_CONDUCT.md) und [SECURITY.md](./SECURITY.md).
Mitwirkende stehen in [CONTRIBUTORS.md](./CONTRIBUTORS.md), Änderungen in [CHANGELOG.md](./CHANGELOG.md).

## ⚖️ Lizenz

[MIT](./LICENSE) © 2026 Zoltán Dul

---

<p align="center">Mit ❤️ gemacht von Zoltán Dul · Teil von <a href="https://github.com/ZoliQua/Arcade-Game-Center">Zoltan's Arcade</a></p>
