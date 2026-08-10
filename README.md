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

## Production-Debug (Phase 3F): defensives Mapping

Der erste echte Vercel-Deploy zeigte leere Teamnamen und `NaN` in der
Tabelle. Ursache (mit Vorbehalt — siehe unten): Die Mapping-Schicht hat
bis dahin blind einer einzigen, nie live verifizierten Feldbenennung
vertraut (`t.TeamName`, `t.Goals`, `t.OpponentGoals`, …). Sobald ein
einziges dieser Felder in der echten Response anders benannt war, wurde
`undefined` durchgereicht — Namen blieben leer, `goalsFor - goalsAgainst`
ergab `NaN`.

**Fix-Strategie:** Die gesamte OpenLigaDB-Mapping-Schicht arbeitet jetzt
auf `unknown` statt auf den (unverifizierten) `Oldb*`-Typen:

- `providers/football/openligadb/safe.ts` — `pickString`/`pickNumber`/
  `pickBoolean`/`pickArray` probieren mehrere plausible Feldnamen-
  Kandidaten (PascalCase, camelCase, ein paar plausible Alternativnamen)
  und fallen kontrolliert auf einen sicheren Default zurück (0, "", []) —
  nie auf `NaN` oder leere Strings ohne Fallback-Text.
- `warnUnexpectedShape()` loggt einmalig pro Kontext die tatsächlichen
  Objekt-Keys nach `console.error`, wenn kein Kandidat passt — die
  Vercel-Function-Logs zeigen damit beim nächsten echten Aufruf die realen
  Feldnamen, ohne weiter raten zu müssen.
- `providers/football/openligadb/mapTable.ts` (neu) und `mapMatch.ts`
  (überarbeitet) nutzen ausschließlich diese defensiven Helfer.
- `client.ts` liefert jetzt `unknown[]`/`unknown` statt typisierter
  Antworten — die Typsicherheit wird bewusst an der Mapping-Grenze
  hergestellt, nicht durch Vertrauen in die Response.
- `types/openligadb.ts` bleibt als Dokumentation der ursprünglichen
  Annahme stehen, wird aber von keinem Mapper mehr importiert.

**Ehrlicher Vorbehalt:** Ich hatte in dieser Umgebung weiterhin **keinen
Netzwerkzugriff** auf OpenLigaDB (`curl` wird von der Sandbox-Firewall
geblockt, `web_fetch` liefert für die JSON-Endpunkte keine Rohdaten). Ich
konnte die defensive Mapping-Schicht daher nicht gegen eine echte Response
verifizieren — nur robuster gegen mehrere plausible Varianten machen. Die
eigentliche Ursache (welches Feld genau anders hieß) bleibt unbestätigt,
bis die Vercel-Logs nach dem nächsten Deploy die tatsächlichen Keys
zeigen. Bitte nach dem Deploy einmal in die Function-Logs schauen — jede
dort auftauchende `[ZEBRA/OpenLigaDB] Unerwartete Datenstruktur…`-Zeile
verrät die echten Feldnamen und macht eine gezielte Nachschärfung möglich.

**Erhaltene Pflicht-Fixes:**
- `components/liga/LeagueTable.tsx`: `entries[i - 1]?.zone`
- `providers/football/openligadb/mapMatch.ts`, Funktion `currentScore()`:
  `if (last) return { home: last.scoreTeam1, away: last.scoreTeam2 };`

**Build-Check:** `npm run build` konnte in dieser Sandbox nicht ausgeführt
werden (kein Netzwerkzugriff für `npm install`, `next`/`react`-Pakete
liegen nicht lokal vor — dieselbe Einschränkung wie zuvor). Ersatzweise
lief ein `tsc --noEmit`-Check mit `strict` + `noUncheckedIndexedAccess`
gegen alle geänderten `provider`/`lib`/`types`/`config`-Dateien sowie
grob gegen alle Komponenten — keine echten Fehler außerhalb der erwarteten
"Modul nicht gefunden"-Meldungen (fehlende `node_modules` hier). Ein
echter `npm run build` vor dem nächsten Vercel-Push wird trotzdem
empfohlen.

## Home-Tabellenausschnitt korrigiert (Phase 3G)

Bug: Bei MSV auf Platz 4 zeigte die Home-Tabelle Plätze 2–6 (starres
±2-Fenster um den MSV) — die Tabellenspitze fehlte.

**Geändert, ausschließlich UI-seitig — keine Provider-/Mapping-Änderung:**
- `lib/homeTableExcerpt.ts` (neu) — reines Auswahl-Utility, verändert nie
  `position`-Werte, nur ein Slice der bereits fertig sortierten Tabelle.
- `app/page.tsx` — lädt jetzt die volle Tabelle über das unveränderte
  `getTable()` und wendet `selectHomeTableExcerpt()` lokal an, statt
  `getTableExcerpt(2)` zu rufen.
- `components/ui/SectionHeader.tsx` — optionaler `actionHref`-Prop, damit
  "Alle" bei der Tabelle tatsächlich zu `/3-liga` verlinkt (vorher ein
  wirkungsloser Button ohne `onAction`).
- `components/home/HomeView.tsx` — übergibt `actionHref="/3-liga"`.

**Logik:** Steht das Zielteam innerhalb der ersten 5 Plätze, zeigt die
Vorschau Platz 1–5. Sonst ein auf das Team zentriertes 5er-Fenster, das am
Tabellenende so weit nach oben verschoben wird, dass trotzdem 5 Einträge
sichtbar sind. Fehlt das Team in der Tabelle, wird die Spitze gezeigt. Hat
die Tabelle insgesamt weniger als 5 Einträge, wird sie komplett gezeigt.

**Nicht betroffen:** `FootballDataProvider`, `MockFootballProvider`,
`OpenLigaDbFootballProvider`, alle OpenLigaDB-Mapper, alle Mock-Daten. Die
Interface-Methode `getTableExcerpt()` bleibt unverändert bestehen (wird
von Home nicht mehr aufgerufen, aber nicht entfernt — kein Provider-Umbau).
3.-Liga-Seite und Match Center sind unverändert, da sie bereits die volle
Tabelle bzw. `getTeamTableEntry()` nutzen.

## Temporärer Content Source Probe (Phase 3H, vor News Hub v1)

Route `/debug/content-sources` (nicht in der Bottom Navigation verlinkt,
`noindex`) testet serverseitig, ob die vier im Content-Reality-Check
identifizierten Quellen tatsächlich erreichbar sind und was sie real
liefern — **keine erfundenen Feed-Felder**, nur was ankommt.

- **YouTube/ZebraTV:** ruft den offiziellen Atom-Feed für Channel-ID
  `UCY18b48CEK53zTARqNiN0ig` ab.
- **liga3-online.de:** testet beide plausiblen WordPress-Kategorie-Feed-
  URLs, setzt keine als sicher voraus.
- **RevierSport:** sucht zuerst den echten Feed-Link auf der MSV-
  Teamseite (`<link rel=alternate>` oder sichtbarer RSS-Anchor) und testet
  erst danach den gefundenen Feed — keine geratene URL.
- **msv-duisburg.de:** ruft `robots.txt` ab (gefiltert auf
  User-agent/Disallow/Allow/Sitemap-Zeilen), prüft die drei bekannten
  Kategorie-IDs (15/11/5) gegen die aktuelle Seite und extrahiert
  heuristisch bis zu drei Artikel-Teaser samt `ZebraTalente`-Präfix-Check.

Alles unter `app/debug/content-sources/` (inkl. privatem `_probe/`-
Unterordner, der von Next.js nicht geroutet wird) — **vollständig isoliert**,
keine bestehende Datei wurde dafür verändert. Löschen des gesamten Ordners
`app/debug/` entfernt den Probe rückstandsfrei.

Kein neues npm-Paket: bewusst ein minimaler, regelbasierter
XML/HTML-Ausschnitt-Parser statt eines echten Parsers, weil dieser Code
komplett wieder entfernt wird. Alle Netz-Zugriffe mit 8s-Timeout,
`cache: "no-store"`, keine Secrets/Env-Variablen in der Ausgabe, keine
vollständigen HTML/XML-Dokumente geloggt (nur einzelne Feldwerte,
Teaser auf 300 Zeichen gekürzt).

### Struktur-Diagnose für msv-duisburg.de (Phase 3I)

Der bisherige Regex-Parser für msv-duisburg.de lieferte auf Vercel 0 Items
(bestätigt real: HTTP 200, aber Struktur passt nicht zur Annahme). Statt
weiter zu raten, zeigt der Probe für diese Quelle jetzt zusätzlich eine
**Struktur-Diagnose** — reine Beobachtung, noch kein Parser:

- **A) Page Info:** finale URL nach Redirects, HTTP-Status, Content-Type,
  HTML-Länge.
- **B) Link Diagnostics:** Gesamtzahl Links, interne Links, News-artige
  Links, bis zu 20 Content-Link-Samples (href, bereinigter Linktext,
  `class` von Link/Parent/nächstem klassifizierten Vorfahren) —
  Nav/Header/Footer-Links werden ausgeschlossen.
- **C) Structure Diagnostics:** häufigste Klassennamen, wiederkehrende
  Container (Tag+Klasse), vorkommende Tags (`article`, `time`, `picture`,
  `img`, `h2`–`h4`), `datetime`-Werte, Bild-Attribute (`src`/`data-src`/
  `srcset`) für bis zu 5 Teaser.
- **D) Text Samples:** bis zu 5 vollständige Container-Strukturen
  (Tag/Klasse, Headline, Link, Datum, Bild-Attribute, Kategorie,
  Text-Ausschnitt max. 250 Zeichen).
- **F) Robots:** zusätzlich zum bisherigen robots.txt-Auszug jetzt eine
  klare Aussage, ob eine `Disallow`-Regel für `User-agent: *` den
  genutzten Pfad betrifft — ausschließlich basierend auf dem, was in der
  robots.txt tatsächlich steht.

**Neue Dateien:** `_probe/diagnoseMsv.ts`, ergänzte Typen in `_probe/types.ts`
(`MsvDiagnostics` u.a.), erweiterte `_probe/util.ts`
(`fetchTextWithMeta` — additiv, `fetchText` bleibt für die anderen drei
Quellen unverändert), erweiterte `_probe/fetchMsv.ts` (bisherige
Regex-Heuristik unverändert erhalten, Diagnose kommt zusätzlich hinzu),
erweiterte `page.tsx` (neuer `MsvDiagnosticsBlock`, rein additiv).

**Neue Abhängigkeit:** `cheerio` (`package.json`) — ein reines,
weit verbreitetes JS-HTML-Parsing-Paket ohne native Bindings. Für die
verlangte Parent-/Container-Ermittlung ist ein echter DOM-Parser
notwendig; das per Regex zuverlässig nachzubauen wäre fehleranfällig und
hätte die Diagnose selbst unglaubwürdig gemacht. Ausschließlich in diesem
Debug-Modul verwendet — verschwindet mit `app/debug/`, falls das Paket
dann nicht mehr gebraucht wird, kann es aus `package.json` wieder entfernt
werden.

YouTube-, liga3- und RevierSport-Probes sowie deren Anzeige sind
unverändert.

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
