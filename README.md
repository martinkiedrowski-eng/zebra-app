# ZEBRA — Phase 3A: Polish-Schritt

Persönliches digitales MSV-Duisburg-Command-Center. Enthält die erste
vertikale Scheibe (App-Shell, Design-Tokens, Home im Next-Up-Zustand) plus
den Phase-3A-Polish: echte Fonts, echte Navigation mit Placeholder-Routen,
vollständige PWA-Icons und den umschaltbaren Next-Up-/Live-Zustand der
Home-Seite.

## Setup

```bash
npm install
npm run dev
```

Anschließend unter `http://localhost:3000` öffnen. Auf dem iPhone im Safari
"Zum Home-Bildschirm hinzufügen" testen, um Icon, Splash-Verhalten und den
PWA-Standalone-Modus zu prüfen (Manifest unter `public/manifest.json`,
Icons unter `public/icons/`).

## Fonts

- Display: **Oswald** (Bold/Semibold) statt des ursprünglich genannten
  "Archivo Expanded" — dieser Schnitt ist über Google Fonts/next-font nicht
  als feste Variante ladbar. Oswald trifft die geforderte Rolle (condensed,
  kräftig, Stadion-Charakter) mindestens ebenso gut und ist sehr robust
  verfügbar.
- Text: **Inter**
- Data/Mono: **JetBrains Mono** (tabellarische Ziffern)

Alle drei über `next/font/google` in `app/layout.tsx` geladen — keine
externe Laufzeit-Abhängigkeit, kein Flash-of-unstyled-font-Risiko.

## Navigation

Echte Next.js-Routen, aktiver Zustand ergibt sich aus der URL
(`usePathname`), nicht aus lokalem State:

- `/` — Heute (voll implementiert)
- `/news`, `/spiele`, `/3-liga`, `/mehr` — reduzierte Placeholder-Seiten im
  ZEBRA-Design (`components/layout/PlaceholderPage.tsx`)

## Next-Up- / Live-Zustand

`components/home/HomeView.tsx` ist eine Client-Komponente mit einem
sichtbaren **Dev-Zustand-Umschalter** (gestrichelter Rahmen, oberhalb der
Match Card). Über die zwei Pillen "Next Up" / "Live" lassen sich beide
Situationen aus dem Design-System direkt vergleichen:

- **Next Up:** featured MatchCard mit Countdown, Zebra Radar darunter
- **Live:** dominante MatchCard (Pulse-Stripe-Rahmen, Live-Minute),
  Spielereignisse statt Radar, Tabelle/Form/News mit gedämpften
  (kleineren, grauen) Section-Headern — treten zurück, bleiben aber
  vollständig erreichbar
- Der Wechsel spielt einmalig die orchestrierte `zebra-state-swap`-
  Animation aus `app/globals.css` ab (kein Dauerloop)

`MOCK_LIVE_MATCH` in `mock/matches.ts` wird für diesen Umschalter direkt
importiert statt über den Provider — das ist bewusst Dev-only und wird
entfernt, sobald ein echter Provider den Live-Status liefert.

## Match Center (Phase 3B)

Neue dynamische Route `/spiele/[matchId]` mit drei Zuständen — PREVIEW,
LIVE, REPORT — auf derselben Seite (`components/matchcenter/
MatchCenterView.tsx`), analog zum Next-Up-/Live-Muster von Home. Von Home
führt ein Tap auf die Next-Up- oder Live-MatchCard direkt dorthin.

**Dev-Zustand-Umschalter** (gestrichelter Rahmen unter der Zurück-
Navigation): Preview / Live / Report — kein Produktfeature, wird entfernt,
sobald `match.status` automatisch den Zustand bestimmt.

Neue Typen in `types/matchCenter.ts`: `MatchStats`, `MatchLineup`,
`MatchPlayer`, `MatchAvailability`, `MatchContext`, `MatchContentItem`.
`Match` (`types/match.ts`) wurde um optionale `halftimeScore`, `stats`,
`lineup` erweitert — fehlen diese Felder, blenden die Komponenten den
jeweiligen Bereich vollständig aus (kein leerer Platzhalter).

`FootballDataProvider` und `NewsProvider` wurden um Match-Center-Methoden
erweitert (`getMatchById`, `getTeamForm`, `getTeamTableEntry`,
`getMatchAvailability`, `getMatchContent`). Der Mock ignoriert bewusst die
konkrete `matchId` und liefert immer dieselbe Demo-Begegnung MSV–Verl —
Ziel dieser Phase ist der vollständige UX-Flow, nicht matchId-genaue
Auflösung; das übernimmt ein echter Provider später.

Die "Was bedeutet das gerade für den MSV?"/"Tabellenwirkung"-Zeile kommt aus
`lib/matchContext.ts` — regelbasiert aus dem Vergleich der Tabellenposition
vor und nach dem (Mock-)Ergebnis, kein Blackbox-Text.

- Alle angezeigten Spiele, Tabellenwerte, News und Radar-Meldungen stammen
  aus `/mock` und werden über `MockFootballProvider` /
  `MockNewsProvider` (siehe `/providers`) ausgeliefert.
- Der Banner "Demo-Daten" auf der Startseite wird explizit über
  `IS_DEMO_DATA` aus `providers/registry.ts` gesteuert, nicht implizit
  erraten.
- Ein Wechsel auf eine echte Datenquelle (z. B. OpenLigaDB) bedeutet: neue
  Klasse in `providers/football/` schreiben, die `FootballDataProvider`
  implementiert, und in `providers/registry.ts` eintragen. Keine
  UI-Komponente muss angefasst werden.

## Korrekturen (Phase 3C, vor der 3. Liga)

- **Match Center ist jetzt vollständig match-unabhängig.** `app/spiele/
  [matchId]/page.tsx` löst zuerst `getMatchById(matchId)` auf und lädt
  danach Tabellenposition/Form für beide Teams ausschließlich über
  `match.homeTeam.id` / `match.awayTeam.id` — keine hartcodierten
  Gegner-IDs mehr in der Route. Einzige verbleibende feste ID im gesamten
  Nicht-Mock-Code ist `MSV_TEAM_ID` in `lib/constants.ts` — das ist der
  App-eigene Anker (MSV), keine Gegner-Kopplung.
- **Echte Tabellenberechnungs-Engine** statt ±1-Simulation:
  `lib/tableEngine.ts` (`computeLiveTable`, `getTeamLiveContext`) ist ein
  reines, providerunabhängiges Utility. Sortierung: Punkte → Tordifferenz →
  erzielte Tore → stabile Ausgangsreihenfolge als Fallback.
  `lib/leagueContext.ts` erzeugt daraus die Kurztexte (`buildMatchLiveContext`
  für Match Center, `buildMsvLageContext` für die 3.-Liga-Seite). Beide
  Bereiche nutzen jetzt dieselbe Berechnung — eine einzige Wahrheit für die
  Live-Position.

## 3. Liga (Phase 3D)

Neue Route `/3-liga` ersetzt den Placeholder. Umschaltung **Tabelle |
Spieltag** oben, dazu ein Dev-Zustand **Normal | Multiplex Live**.

- **Tabelle:** vollständige (Demo-)Liga-Tabelle, MSV hervorgehoben,
  Auf-/Abstiegszonen als dezente Trennlinie mit Label. Auf `md`+ zusätzlich
  S/U/N/Tore-Spalten. Darüber die **MSV-Lage** (`ContextCard`, aus
  `buildMsvLageContext`).
- **Spieltag:** kompletter 5. Spieltag (`components/liga/MatchdayList.tsx`),
  jede Karte verlinkt zu `/spiele/[matchId]`. Läuft mindestens ein Spiel,
  erscheint darüber **„Live in der 3. Liga"** (`components/liga/
  LiveMultiplex.tsx`) — priorisiert nach `lib/multiplex.ts`: zuerst das
  MSV-Spiel, dann Teams in unmittelbarer Tabellennähe (markiert mit
  „betrifft MSV"), dann der Rest. Darunter „Spieltag für den MSV" mit
  derselben `buildMsvLageContext`-Logik.
- **Live-Tabelle:** Sobald der Dev-Zustand mindestens ein laufendes Spiel
  enthält, rechnet `computeLiveTable` die Tabelle live um und die Ansicht
  kennzeichnet sie explizit als „Live-Tabelle · vorläufig".

`FootballDataProvider` um `getTable()` und `getCurrentMatchday()`
erweitert. Neue Mock-Basis in `mock/league.ts`: eine auf 10 Teams
reduzierte Demo-Liga (nicht die realen 20 Vereine der 3. Liga — bewusste
Vereinfachung fürs MVP) mit vollständigem 5. Spieltag in gemischten
Zuständen (`scheduled`, `live`, `halftime`, `finished`). `mock/table.ts`
(Home-Tabellenausschnitt) leitet sich jetzt aus derselben Basistabelle ab
statt eigene, potenziell abweichende Werte zu pflegen.

`MatchStatus` um `"halftime"` erweitert (eigener Pill-Zustand).

## Erste echte Datenstufe: OpenLigaDB (Phase 3E)

`FOOTBALL_DATA_SOURCE=openligadb` in `.env.local` aktiviert die echte 3.-Liga-Saison 2026/27 (`config/football.ts`: `leagueShortcut: "bl3"`, `season: 2026`) statt der Mock-Sandbox. Umschaltung ausschließlich in `providers/registry.ts` — keine UI-Datei kennt den Unterschied.

**Neue Dateien:**
- `config/football.ts` — Liga/Saison/Polling-Konfiguration, zentral
- `types/openligadb.ts` — Rohdaten-Typen der API, bleiben strikt provider-intern
- `providers/football/openligadb/client.ts` — HTTP-Layer inkl. `getlastchangedate`-basiertem Caching (30s Polling bei laufenden Spielen, 5min sonst, beides in `POLLING_CONFIG` konfigurierbar)
- `providers/football/openligadb/{teamIdMap,mapStatus,mapMatch}.ts` — Mapping auf interne Types
- `providers/football/OpenLigaDbFootballProvider.ts` — die Implementierung selbst
- `providers/news/OpenLigaDbNewsProvider.ts` — liefert bewusst leere News/Content, Zebra Radar nur aus echten Torereignissen

**Zwei ehrlich dokumentierte Kompromisse** (kein Netzwerkzugriff in dieser Entwicklungsumgebung, daher nicht live verifizierbar):
1. Die exakte numerische OpenLigaDB-TeamId des MSV war nicht prüfbar — `teamIdMap.ts` erkennt den MSV deshalb robust über den Vereinsnamen statt über eine geratene ID.
2. Der Einzel-Match-Endpunkt (`getmatchdata/{matchId}`) folgt dem dokumentierten Namensschema, sollte aber vor dem ersten echten Deploy einmal gegen die Swagger-Doku verifiziert werden.

**Baseline-Problem korrekt gelöst:** `getBaselineTable()` rekonstruiert die Tabelle **vor** dem aktuellen Spieltag aus den Einzelspielen (`lib/tableEngine.ts::computeTableFromMatches`) — nicht aus OpenLigaDB's "aktueller" Tabelle, die den laufenden Spieltag ggf. schon enthält. Damit fließt kein Ergebnis doppelt ein, wenn anschließend `computeLiveTable()` denselben Spieltag anwendet.

**Live-Minute:** wird im echten Modus nie angezeigt (`mapMatch.ts` setzt `minute: null` immer) — `StatusPill` zeigt dadurch automatisch nur „Live" statt einer vorgetäuschten Minute.

**halftime-Status:** nur wenn OpenLigaDB tatsächlich einen Halbzeit-Ergebniseintrag (`ResultTypeID === 1`) ohne Endergebnis liefert — nicht per Uhrzeit geschätzt (`mapStatus.ts`).

**Was im echten Modus automatisch verschwindet:** Karten, Wechsel, Aufstellung, Live Match Facts, Personallage, Vorbericht/PK/Interview/Highlights-Cards — jeweils weil `match.stats`/`match.lineup` `undefined` bleiben bzw. `getMatchAvailability()`/`getMatchContent()` leere Werte liefern und die entsprechenden Sections dafür jetzt überall bedingt rendern.

**Dev-Umschalter (Next-Up/Live, Preview/Live/Report, Normal/Multiplex) existieren nur noch im Mock-Modus** (`isMockMode`-Prop durchgereicht von jeder Route) — im echten Modus bestimmt der reale `match.status` bzw. die reale aktuelle Tabelle den Zustand automatisch.

## PWA-Icons

Eigenes, minimalistisches Icon-System (kein MSV-Wappen): abstraktes "Z" aus
drei geometrischen Balken in Zebra-Blau auf Fast-Schwarz.

- `icon-192.png`, `icon-512.png` — Standard, dezent abgerundeter
  Hintergrund
- `icon-maskable-512.png` — voller Bleed-Hintergrund, größere Safe-Zone-
  Marge für adaptive Icons (Android)
- `apple-touch-icon.png` (180×180) — iOS rundet selbst, daher voller Bleed
- `favicon-32.png`

Generiert über `gen_icons.py` (Pillow) — bei Bedarf dort anpassbar, bevor
ein echtes Design-Tool übernimmt.

## Mobile Reality Check

Geprüft: Tabelle und Form standen bereits vorher korrekt gestapelt auf
schmalen Screens (`grid-cols-1` ist der Default, `sm:grid-cols-2` in
`components/home/HomeView.tsx` greift erst ab 640px — also nie auf einem
iPhone-Viewport). Kein Layoutfehler, aber jetzt bewusst gegengeprüft und im
Live-Zustand zusätzlich über die gedämpften Section-Header entschärft, statt
über ein enges Nebeneinander. Safe-Area-Insets für die Bottom Navigation
sind über `env(safe-area-inset-bottom)` gesetzt (`components/layout/
BottomNav.tsx`), `viewportFit: "cover"` ist in `app/layout.tsx` gesetzt.

## Noch nicht enthalten

Ein echtes Service-Worker-/Offline-Caching-Setup folgt bewusst erst später.
Match Center, News Hub, Team, Gegner-Watch sind weiterhin Placeholder.
