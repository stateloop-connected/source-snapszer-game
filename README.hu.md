# 🂡 Snapszer

[English](README.md) · [Deutsch](README.de.md) · **Magyar**

A **Snapszer** (hatvanhat, snapszli), a magyar verseny a 66 pontért, **React 18**, **Vite** és **TypeScript** alapon. Ketten
játszhatsz **Gazsi** ellen, vagy hárman **Gazsi** és **Rozi** ellen, magyar (Tell-) kártyával. A játék a teljes magyar szabályt
követi: felfordított adu a talon alatt, csere és betakarás, 20 / 40, „Elég!”, snapszer és kontra. Hármasban a hívó egyedül játszik
a másik kettő ellen. Egy rádli 7 egységig tart, és egy jól olvasható napló rögzít minden lapot és bemondást.
Önállóan **és** a **[Zoltan's Arcade](https://github.com/ZoliQua/Arcade-Game-Center)** tizenöt játékának egyikeként is fut.
Itt játszhatsz vele: [dulzoltan.hu/arcade/#/play/snapszer](https://dulzoltan.hu/arcade/#/play/snapszer).

[![CI](https://github.com/ZoliQua/Snapszer-Game/actions/workflows/ci.yml/badge.svg)](https://github.com/ZoliQua/Snapszer-Game/actions/workflows/ci.yml)
![license](https://img.shields.io/badge/license-MIT-green)
![node](https://img.shields.io/badge/node-%E2%89%A520-339933?logo=node.js&logoColor=white)
![react](https://img.shields.io/badge/React-18-61dafb?logo=react&logoColor=white)
![vite](https://img.shields.io/badge/Vite-5-646cff?logo=vite&logoColor=white)
![typescript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white)

---

## 📑 Tartalom

- [A Zoltan's Arcade család](#%EF%B8%8F-a-zoltans-arcade-család)
- [Funkciók](#-funkciók)
- [Gyors kezdés](#-gyors-kezdés)
- [A szabályok röviden](#-a-szabályok-röviden)
- [Így játssz](#%EF%B8%8F-így-játssz)
- [Pontozás és statisztika](#-pontozás-és-statisztika)
- [A gépi játékosok](#-a-gépi-játékosok)
- [Automatikus mentés és folytatás](#-automatikus-mentés-és-folytatás)
- [Beágyazás az Arcade-Game-Centerbe](#-beágyazás-az-arcade-game-centerbe)
- [Szkriptek](#-szkriptek)
- [Felépítés](#%EF%B8%8F-felépítés)
- [Közreműködés](#-közreműködés)
- [Licenc](#%EF%B8%8F-licenc)

## 🕹️ A Zoltan's Arcade család

Minden játék önálló repó, amely a portálba is beépül. Mindegyik ugyanazt a dizájnrendszert, pontozási modellt és mentési formátumot
használja a beemelt [`src/arcade/`](./src/arcade) készleten keresztül.

| Játék | Repó | Műfaj |
| --- | --- | --- |
| 🏠 **Arcade portál** | [Arcade-Game-Center](https://github.com/ZoliQua/Arcade-Game-Center) | Minden játék egy helyen, élő demók, statisztika, ranglista |
| 🧱 Tetris | [Tetris-Game](https://github.com/ZoliQua/Tetris-Game) | Arcade |
| 🐍 Snake | [Snake-Game](https://github.com/ZoliQua/Snake-Game) | Reflex |
| 🔢 2048 | [2048-Game](https://github.com/ZoliQua/2048-Game) | Fejtörő |
| 🟡 Pac-Man | [Pac-Man-Game](https://github.com/ZoliQua/Pac-Man-Game) | Labirintus |
| ⚫ Gomoku | [Gomoku-Game](https://github.com/ZoliQua/Gomoku-Game) | Stratégia |
| 🦷 Tic-Tac-Toe | [Tic-Tac-Toe-Game](https://github.com/ZoliQua/Tic-Tac-Toe-Game) | Párbaj |
| 🏓 Breakout | [Breakout-Game](https://github.com/ZoliQua/Breakout-Game) | Ütő |
| 👾 Space Invaders | [Space-Invaders-Game](https://github.com/ZoliQua/Space-Invaders-Game) | Lövöldözős |
| 🔴 Connect Four | [Connect-Four-Game](https://github.com/ZoliQua/Connect-Four-Game) | Párbaj |
| 🔩 Nut Sort | [Nut-Sort-Game](https://github.com/ZoliQua/Nut-Sort-Game) | Rendezős |
| 🃏 Texas Hold'em | [Texas-Holdem-Game](https://github.com/ZoliQua/Texas-Holdem-Game) | Kártya |
| 💣 Minesweeper | [Minesweeper-Game](https://github.com/ZoliQua/Minesweeper-Game) | Logika |
| ♠️ Solitaire | [Solitaire-Game](https://github.com/ZoliQua/Solitaire-Game) | Kártya |
| 🎴 Ulti | [Ulti-Game](https://github.com/ZoliQua/Ulti-Game) | Kártya |
| 🂡 **Snapszer** (ez a repó) | [Snapszer-Game](https://github.com/ZoliQua/Snapszer-Game) | Kártya |

## ✨ Funkciók

- 🎴 **A magyar (Tell-) kártya** a közös arcade-készletből: az 1835-ös Schneider-minta saját SVG-újrarajzolása, kétfejű, mint az
  igazi pakli, a Tell-figurákkal és az évszakos ászokkal. Minden színnek saját formája van (szív, tök, levél, makk), így a színek
  megkülönböztetéséhez soha nincs szükség a színlátásra.
- 👥 **Ketten vagy hárman**, a rádli előtti beállítással. Ketten 20 lappal játszotok (színenként ász, tízes, király, felső, alsó); a
  **Kilencesekkel** beállítás hozzáveszi a négy kilencest, amelyek 0 pontot érnek. Hárman mindig 24 lap van játékban.
- 🃏 **Az igazi asztal**: a felfordított adu keresztben fekszik a talon alatt, a talon mutatja, hány lap maradt. A betakart talon
  keresztben fekszik az adun, és kiírja, ki takart be. Minden helyen ott az elvitt ütések kupaca a számukkal, és a bemondott
  20 / 40 kis király–felső párként, mellette a 20 vagy a 40.
- 🗣️ **Minden bemondás gomb** az asztal alatti sávban: „Elég!” (csak akkor aktív, ha tényleg megvan a 66), Csere, Betakarás,
  20 / 40, Snapszer és Kontra (hármasban Rekontra és Szubkontra), valamint a hármas hívónak Bedobom. Ha a pillanat nem engedi, a gomb
  tiltott (szaggatott kerettel).
- 🚫 **A szabályokat betartatja**: a most nem játszható lapok halványak **és vonalkázottak**, tehát formából látszik, nem színből.
  Ha mégis rájuk koppintasz vagy kattintasz, a játék megmondja, melyik szabály tiltja.
- 🙈 **Fejben számolsz**, mint az igazi asztalnál. A „Pontok mutatása” beállítás (alapból kikapcsolva) a saját beszámított pontjaidat
  mutatja (kettesben azt a 20 / 40-et is, amely még az első ütésedre vár). A gépek pontjai osztás közben sosem látszanak.
- 🧑‍🎨 **Portrék** a kártya fametszetes stílusában: te, **Gazsi**, a kocsis (szemüveg, ősz szakáll, sapka) és **Rozi**, a kocsmárosné
  (pöttyös kendő, fülbevaló). Minden helyen ott a név, az egységek, az osztó, a hívó vagy ellenjátékos, és egy keretes **▶ Soron**
  jelvény.
- 🤖 **Könnyű, Közepes vagy Nehéz gépek**. Csak a saját lapjaikat és az asztalt látják. A **Lassú / Normál / Gyors** beállítás a
  tempójukat adja meg.
- 📖 **Szabályok ablak** (gomb vagy **R**): cél, játékmenet, a szabályok a lapértékek ábrájával, az osztás értékének ábrája, a
  pontozás a játék saját állandóiból vett minden számmal, a fogas mód és telefonon az érintéses irányítás. Megnyitva szünetelteti a
  rádlit.
- 🏁 **Befejezés** két osztás között: megerősítés után véget ér a rádli, és a lejátszott osztások pontszáma győzelmi bónusz nélkül
  felkerül a ranglistára. A legelején ez 0. Egy folyamatban lévő osztásból így nem lehet kiszállni.
- ⛶ **Teljes képernyő** az asztalnak (iPhone-on teljes képernyős nézet a körülötte lévő oldal nélkül).
- ⏸️ **Szünet** a P billentyűvel, vagy magától, ha a fül háttérbe kerül. Megállítja a gépeket és az órát.
- 💾 **Automatikus mentés és folytatás**: a rádli túléli az újratöltést és a fül bezárását, akár ütés közben is.
- 🌗 **Sötét / világos téma**, közösen minden arcade-játékkal.
- 🌍 **Három nyelv**: angol, magyar és német. A számok a nyelv szerinti tagolással jelennek meg.
- 🦷 **Fogas mód** (alapból kikapcsolva, vagy `?dental=1`), az egész arcade-ban közös. Csak a lapok hátát (egy fog) és a portrékat
  változtatja meg, ugyanazokkal az arcokkal: te leszel a fogorvos, Gazsi a fogtechnikus (nagyítós szemüveg és fogsor), Rozi a
  fogszabályozó szakorvos (egy fogszabályzós fog). A lapok képe és a szabályok ugyanazok maradnak.
- 🤖 **Bemutató mód** (`<SnapszerDemo />`): a portál kezdőlapján gépek játszanak valódi rádlikat, felváltva ketten és hárman.
- 📱 **Telefonra szabva**: osztás közben az asztal, a lapjaid, a talon az aduval és a lépéssáv görgetés nélkül elfér egy képernyőn,
  álló és fekvő telefonon is.
- 🧪 **Tesztelve**: pakli, osztás, játék és pontozás ketten és hárman, a gépek szabálykövetése és ereje, a rádli pontozása, a
  mentések, egy teljes osztás a felületen át, a szabályok ablak, a befejezés, az érintéses irányítás, a nyelvek, a fogas mód és a
  bemutató.

## 🚀 Gyors kezdés

**Node ≥ 20** és npm kell hozzá.

```bash
git clone https://github.com/ZoliQua/Snapszer-Game.git
cd Snapszer-Game
npm install
npm run dev          # http://localhost:5173
```

Éles buildhez: `npm run build && npm run preview`. A build relatív útvonalakat használ, így a `dist/` bármelyik almappából kiszolgálható.

## 📏 A szabályok röviden

A forrás a magyar Wikipédia „Snapszer” szócikke. Ahol hallgat, ott a döntések a
[`src/engine/index.ts`](./src/engine/index.ts) fájlban olvashatók.

**Ketten**

- **Osztás**: mindenki 3 lapot kap, egy lapot felfordítanak adunak, majd még 2-2 lapot. A maradék 9 lap (a kilencesekkel 13)
  képpel lefelé fekszik az adun, ez a talon. Az osztó ellenfele hív, és az osztó váltakozik.
- **Lapértékek**: ász 11, tízes 10, király 4, felső 3, alsó 2, kilences 0. A 20 lap együtt 120 pont.
- **Játék**: amíg a talon nyitott, bármelyik lapot kijátszhatod, és az ütés nyertese húz először. Ha a talon le van takarva vagy
  elfogyott, színre kell adnod, és ha tudsz, felül kell ütnöd; ha nincs olyan színed, aduval kell ütnöd.
- **Csere és betakarás**: a saját hívásodnál, amíg legalább 3 lap van az adu fölött, kicserélheted az adu alsódat a felfordított
  adura, vagy betakarhatod a talont.
- **20 / 40**: egy szín királya és felsője, a saját hívásodnál felmutatva, 20 pontot ér (aduban 40). Akkor számít, ha már vittél
  ütést, és a kettő közül az egyiket rögtön ki kell hívni.
- **„Elég!”**: 66 ponttal véget vetsz az osztásnak, és megnyered. Ha senki sem mondja, az utolsó ütés nyer.
- **Snapszer**: az első körben bemondva minden ütést neked kell vinned: 6 egység, vagy 6 az ellenfélnek, ha nem sikerül.
- A **kontra** megduplázza az osztást vagy a snapszert.

**Hárman**: 24 lap, mindenkinek 8, két 4 lapos körben. A hívó (az osztó utáni hely) az első 4 lapjából mond adut, és egyedül játszik a
másik kettő ellen, akik együtt számolják az ütéseiket. Az első hívás előtt a hívó bedobhatja a lapjait: ekkor mindkét ellenjátékos
2 egységet kap, vagy 4-et, ha a hívónál ász van. Snapszert csak a hívó mondhat. Mindenkinek színre kell adnia és felül kell ütnie,
különben aduznia és felül aduznia. A kontra, a rekontra és a szubkontra egyaránt dupláz. A hívó minden osztásnál továbblép.

| A vesztes … | Egység |
| --- | --- |
| legalább 33 pontot ért el | 1 |
| 33 pontnál kevesebbet ért el („maccs”) | 2 |
| egy ütést sem vitt | 3 |
| Snapszer (sikeres vagy bukott) | 6 |

Aki betakar, és aztán nem éri el a 66-ot, 1 egységet ad az ellenfelének (a Wikipédia szerinti érték). A rádli addig tart, amíg
valakinek meg nem lesz a 7 egysége.

## ⌨️ Így játssz

| Billentyű | Művelet |
| --- | --- |
| 🖱️ Kattintás egy lapra | Kijátszod, vagy megtudod, miért nem szabad (hármasban hívóként: ezzel mondasz adut) |
| 🖱️ A sáv gombjai | Elég!, csere, betakarás, 20 / 40, snapszer, kontra, bedobás |
| **Tab** / **Shift+Tab** | Lépkedés a lapok és a gombok között (az **Enter** / **Szóköz** megnyomja őket) |
| **Enter** | Indítás · következő osztás · folytatás (ha egyik gomb sincs kijelölve) |
| **P** / **Esc** | Szünet / folytatás |
| **R** | A szabályok megnyitása |
| **T** | Sötét / világos téma (önálló oldalon) |

A gyorsbillentyűk nem működnek, amíg egy űrlapmezőbe gépelsz, vagy a Cmd/Ctrl/Alt le van nyomva.

**Telefonon**: koppints egy lapra, és kiemelkedik; koppints rá újra (vagy a **Kijátszom** gombra), és kijátszod. A bemondások az
asztal alatti sávban vannak, soronként három, hüvelykujjnyi gombbal. Amikor elindul egy osztás, az asztal és a sáv kitölti a
képernyőt a fejléc alatt, így semmit sem kell görgetni. Fekvő telefonon a sáv az asztal mellé kerül. Az asztal fölötti **Teljes
képernyő** gomb az egész képernyőt az asztalnak adja. iPhone-on a *Megosztás → Főképernyőhöz adás* a böngésző sávjait is elrejti.

## 🎯 Pontozás és statisztika

A rádli végén:

```
pontszám = round((max(0, a te egységeid − a legjobb gép egységei) × 100 + (nyertél ? 500 : 0)) × szint)
szint: Könnyű 1 · Közepes 1,5 · Nehéz 2          0 és 5000 közé szorítva
```

Ha például Közepes szinten 7–3-ra nyersz, az 1350 pont. Akkor nyered a rádlit, ha egyedül végzel az élen; ha a legjobb géppel
egyenlő vagy, az döntetlen. A **Befejezés** két osztás között idő előtt lezárja a rádlit, ugyanazzal a képlettel, győzelmi bónusz
nélkül (a legelején 0). Ha rádli közben megváltoztatod a játékosok számát, a kilenceseket vagy a nehézséget, egy oldalon belüli
megerősítés után a rádli pontszám nélkül véget ér.
A készlet minden befejezett rádlit egyszer rögzít az `arcade.stats.snapszer` kulcs alatt. A statisztikasáv az **Osztás**, az
**Egység** (a tiéd – a legjobb gépé), a **Pont**, a **Rekord** és az aktív **Idő** értékét mutatja.

## 🤖 A gépi játékosok

- A **Könnyű** véletlenszerű, szabályos lapokat játszik. Azért 66-nál mondja, hogy „Elég!”, cserél, ha az segít, és bemondja a
  20 / 40-ét.
- A **Közepes** ökölszabályok szerint játszik: nyitott talonnál alacsony lapot hív, kötelező színre adásnál a legerősebb lapjait viszi
  haza, pontot gyűjt, és elviszi az ütést, amellyel meglesz a 66.
- A **Nehéz** úgy osztja ki a nem látott lapokat, hogy illeszkedjenek mindahhoz, amit látott, minden lehetséges lépést végigjátszik
  közepes játékosokkal, és a legjobbat választja. A betakarás, a snapszer, a kontra és a bedobás is jelölt; ezeknek egy minimális
  mintaszám fölött, biztos különbséggel kell nyerniük.

Kettesben, tükrözött lapokkal játszott rádlikban a Nehéz 200-ból 197-szer veri a Könnyűt, a Közepes 200-ból 193-szor a Könnyűt, a
Nehéz pedig 60-ból 54-szer a Közepest. A Nehéz egy döntése néhány ezredmásodperc.

## 💾 Automatikus mentés és folytatás

A rádli egészében mentődik az `arcade.session.snapszer` kulcs alatt (1-es séma): játékosszám, kilencesek, szint, kezdőérték, az
osztások összesítése, az egységek és a folyamatban lévő osztás. Az ellenőrzés a mentett osztást a kezdőértékéből és a naplójából
újrajátssza, és csak akkor fogadja el, ha minden lap, bemondás és eredmény egyezik. Újratöltés után az **Üdv újra!** üzenet jelenik meg,
szüneteltetett játékkal. A gépek lépései csak a mentett állapottól függenek, így a folytatott rádli pontosan úgy megy tovább, mint
korábban.

## 🧩 Beágyazás az Arcade-Game-Centerbe

```tsx
import { SnapszerGame, SnapszerDemo } from '@arcade/snapszer';

<SnapszerGame
  embedded                                   // elrejti az oldal címét; a portál mutatja
  onGameOver={(score, info) => submitScore('snapszer', score)}   // befejezett rádlik 0-nál több ponttal; Befejezés: mindig, info = { finished: true }
  onRunEnd={(run) => console.log(run.outcome, run.score)}  // minden befejezett rádli
  onStatusChange={({ status, score, seconds }) => updateHeader(status, seconds)}
/>
<SnapszerDemo active={cardIsVisible} />      // bemutató mód a kezdőlapon
```

Mindkét komponens a közös `ArcadeGameProps` / `ArcadeDemoProps` szerződést követi (`src/arcade/types.ts`). Telefonon a játék lemeri a
helyet egy rögzített fejléc alatt (önállóan `.arc-topbar`, a portálban `.header`).
Állapotok:
- `idle`: rádli előtt (a beállító kártya)
- `running`: rádli közben
- `paused`: szüneteltetve vagy visszatöltve
- `gameOver`: az osztás után, amellyel valaki eléri a 7 egységet, vagy a **Befejezés** után

## 🧪 Szkriptek

| Szkript | Feladat |
| --- | --- |
| `npm run dev` | Vite fejlesztői szerver |
| `npm run build` | Típusellenőrzés (`tsc -b`) és éles build |
| `npm run preview` | Az éles build kiszolgálása |
| `npm run typecheck` | `tsc -b` |
| `npm run lint` | ESLint |
| `npm test` | Vitest (motor-, gép-, rádli- és komponenstesztek) |
| `npm run check` | lint → typecheck → test → build (ezt futtatja a CI) |

## 🏗️ Felépítés

```
src/
  arcade/        beemelt Zoltan's Arcade készlet — itt ne szerkeszd (a magyar kártya az arcade/hungarian mappában van)
  engine/        tiszta snapszerszabályok: pakli, kettes osztás és játék, pontozás, hármas játék (three.ts)
  bots/          chooseAction három szinten; a Nehéz mintát vesz a nem látott lapokból
  game/          rádli (7-ig), pontszám, mentés (1-es séma + újrajátszó ellenőrzés), befejezés, beállítások, a gépek tempója
  ui/            Table, Seat, Centre (talon, adu, ütés), Hand, ActionBar, LogPanel, feliratok, figures/ (a portrék)
  demo/          SnapszerDemo (csak gépek)
  SnapszerGame.tsx  a beágyazható játék (ArcadeGameProps)
  rules.tsx      a szabályok ablak részei, a lapértékek és az osztásérték ábrája
  i18n.ts        en / hu / de szövegek
  App.tsx        önálló oldal: <ArcadeShell><SnapszerGame/></ArcadeShell>
  index.ts       csomagbelépő az Arcade-Game-Center számára
```

A felület csak a rádlin keresztül változtat a játékon (`act`, `botStep`, `nextDeal`), a rádli pedig a motoron keresztül, amely sosem
módosítja a bemenetét, és minden szabálytalan lépésre hibát dob.

## 🤝 Közreműködés

Lásd a [CONTRIBUTING.md](./CONTRIBUTING.md), a [magatartási kódex](./CODE_OF_CONDUCT.md) és a [SECURITY.md](./SECURITY.md) fájlt.
A közreműködők a [CONTRIBUTORS.md](./CONTRIBUTORS.md), a változások a [CHANGELOG.md](./CHANGELOG.md) fájlban szerepelnek.

## ⚖️ Licenc

[MIT](./LICENSE) © 2026 Zoltán Dul

---

<p align="center">Szeretettel készítette Zoltán Dul · a <a href="https://github.com/ZoliQua/Arcade-Game-Center">Zoltan's Arcade</a> része</p>
