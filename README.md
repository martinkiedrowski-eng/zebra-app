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

### Finaler msv-duisburg.de-Parser (Phase 3J)

Ersetzt die alte Regex-Heuristik (0 Treffer) durch einen cheerio-basierten
DOM-Parser, gebaut ausschließlich auf Basis der live auf Vercel
verifizierten Struktur:

- **Container:** `ul.news-list`, ein `<li>` pro Artikel.
- **Artikel-Filter:** nur `<a>`-Links, deren `href` `/aktuelles/artikel/`
  enthält — alles andere (Navigation, Tickets, Newsletter) wird ignoriert.
- **Titel/Kategorie-Trennung:** der sichtbare Titeltext folgt live
  bestätigt dem Muster `"<Präfix> | <Headline>"` (z.B. `ZebraTV |
  "Stimmung war unglaublich": …`). `parseMsvNewsList()` trennt das sauber:
  alles vor dem ersten `|` wird `category`, der Rest `title`. Kein `|`
  gefunden → `category: null`, kompletter Text bleibt Titel (nichts
  geraten). Ein eventuell vorangestelltes Datum (`DD.MM.YYYY`) wird vorher
  abgeschnitten.
- **ZebraTalente-Filter:** explizit, nachvollziehbar, eigener
  Regex-Vergleich (`/^zebratalente$/i`) auf das extrahierte
  `category`-Feld — diese Artikel werden gezählt (`excludedZebraTalente`),
  aber nicht in `articles` aufgenommen.
- **Datum:** bevorzugt `time[datetime]` im `<li>`, sonst sichtbarer
  Zeittext, sonst ein `DD.MM.YYYY`-Textmuster im Item — nichts davon wird
  in ein anderes Format umgerechnet, um keine Zeitzonen-Annahme zu
  erfinden.
- **Bild:** ausschließlich aus tatsächlich im DOM gefundenen Attributen
  (`img[src]`, `img[data-src]`, `img[data-lazy-src]`, `source[srcset]`,
  in dieser Reihenfolge) — `data:`-URIs (Base64-Platzhalter) werden
  explizit übersprungen, keine URL wird konstruiert.
- **Fehlertoleranz:** jedes `<li>` einzeln in try/catch — ein defekter
  Teaser wird gezählt (`skippedInvalid`) und übersprungen, der Rest des
  Feeds bleibt unberührt.
- **Source-Feld:** konstant `"MSV Duisburg (offiziell)"`.

**Neue Datei:** `_probe/parseMsvNews.ts` — bewusst als reine, von Next.js
unabhängige Funktion geschrieben, damit sie unverändert in einen
künftigen echten News-Provider übernommen werden kann, sobald der News
Hub gebaut wird. Liegt aktuell noch im Debug-Modul, weil der Hub selbst
laut Vorgabe noch nicht gebaut werden soll.

**`fetchMsv.ts` geändert:** nutzt jetzt `parseMsvNewsList()` statt der
alten Regex-Funktion; robots.txt-Check, Kategorie-ID-Check und die
Struktur-Diagnose (Phase 3I) bleiben unverändert zusätzlich erhalten, die
Debug-Seite zeigt jetzt also sowohl das Parser-Ergebnis als auch weiterhin
die Rohdiagnose.

**Ehrlicher Hinweis:** Ich konnte den neuen Parser in dieser Sandbox nicht
gegen die echte Vercel-Response laufen lassen (weiterhin kein
Netzwerkzugriff). Er ist ausschließlich aus den von dir gemeldeten,
tatsächlich beobachteten Fakten abgeleitet — bitte nach dem Deploy auf
`/debug/content-sources` prüfen, ob `containerFound`/Item-Anzahl/
ZebraTalente-Zähler den Erwartungen entsprechen.

## News Hub v1 (Phase 3K)

Die bisherige Placeholder-News-Seite und Homes "Top News"-Sektion sind
jetzt ein echter, aggregierter Feed aus drei Quellen — unabhängig vom
Football-Mock/OpenLigaDB-Modus, da News ein eigenes, immer-echtes System
ist.

**Neue Architektur** (`lib/newsFeed/`):
- `types/newsFeed.ts` — eigenständiges `NewsFeedItem`-Modell (id, title,
  url, publishedAt, source, sourceType, category, teaser, imageUrl),
  bewusst getrennt vom bisherigen `NewsItem` (das bleibt für Mock-
  Radar/Match-Content unverändert bestehen, siehe `providers/news/`).
- `lib/newsFeed/parsers/msvParser.ts` — der live validierte MSV-Parser,
  verschoben von `app/debug/.../_probe/parseMsvNews.ts` an den
  produktiven Ort. Der Debug-Probe importiert ihn jetzt von hier (eine
  Wahrheit, keine zweite Kopie).
- `lib/newsFeed/sources/{msv,youtube,liga3}.ts` — je ein Adapter pro
  Quelle, jeder mit eigenem Try/Catch, jeder gibt im Fehlerfall `[]`
  zurück statt zu werfen.
- `lib/newsFeed/aggregate.ts` — `getAggregatedNews()`: `Promise.allSettled`
  über alle drei Adapter, konservative Deduplizierung (exakte URL ODER
  exakter normalisierter Titel — ähnliche Titel bleiben bewusst beide
  erhalten), Sortierung neueste zuerst.
- `lib/newsFeed/{fetchUtils,xmlUtils,format}.ts` — eigene, kleine
  Hilfsfunktionen; bewusst NICHT aus `app/debug/.../_probe/` importiert,
  damit die Produktionsschicht nie vom (jederzeit entfernbaren)
  Debug-Modul abhängt. Nutzt Next.js' `fetch(..., { next: { revalidate: 300 } })`
  statt eines manuellen Caches — 5 Minuten Aktualität, wie im Reality-
  Check-Dokument empfohlen.

**Eingebundene Quellen:** MSV Duisburg (offiziell, HTML/`ul.news-list`),
ZebraTV/YouTube (Atom-Feed), liga3-online.de (RSS, exakt die zwei im
Probe getesteten Kandidaten-URLs). RevierSport bewusst **nicht**
eingebunden (HTTP 403 im Live-Test).

**Neue UI:** `components/news/NewsFeedCard.tsx` (zwei Layouts: `row` für
Home, `list` für die News-Seite — Quelle+Icon, optionale Kategorie,
Titel, optionaler Teaser, Zeit; kein Bild-Platzhalter, wenn keine
`imageUrl` vorhanden), `components/news/NewsFeedRow.tsx` (horizontale
Reihe für Home). `app/news/page.tsx` ist jetzt der vollständige Feed
(leerer Zustand nur, wenn wirklich alle Quellen 0 Items liefern — keine
HTTP-Codes/Parser-Details in der normalen App, die stehen ausschließlich
unter `/debug/content-sources`).

**Fehlerbehandlung:** dreifach abgesichert — jeder Source-Adapter fängt
eigene Fehler ab (`[]` statt Exception), `Promise.allSettled` fängt auch
unerwartete Rejections ab, und die UI blendet leere Sections einfach aus
(Home) bzw. zeigt einen freundlichen Text (News-Seite) statt eines
technischen Fehlers.

**Unverändert:** `types/news.ts`, `mock/news.ts`,
`components/news/{NewsCard,TopNews}.tsx`, `providers/news/*`,
alle Football-/OpenLigaDB-Dateien, Match Center, 3.-Liga-Seite, Bottom
Navigation. Die alten News-Komponenten werden aktuell von nichts mehr
aufgerufen, bleiben aber unangetastet im Projekt (kein Löschen
funktionierender Dateien ohne expliziten Auftrag).

## News-Polish-Pass (Phase 3L)

Reiner UI-Polish, keine Änderung an `lib/newsFeed/` (Adapter, Aggregator,
Parser, Dedup, Fehlerbehandlung) und keine Änderung an Football/
OpenLigaDB/Match Center/Tabelle/BottomNav/Debug-Probe.

- `components/home/HomeView.tsx`: Section-Titel "Top News" → "News".
- `components/news/NewsFeedCard.tsx`: `row`-Variante (Home) komplett neu
  layoutet — kompaktes Zeilen-Layout mit optionalem 56×56-Thumbnail
  links (nur falls `item.imageUrl` bereits vorhanden ist, nichts wird neu
  geladen/konstruiert), Kategorie-Pille entfernt (weniger textlastig),
  Headline auf `line-clamp-2` begrenzt, Card-Breite `w-56`. `list`-
  Variante (News-Seite) unverändert im Aufbau, Headline zusätzlich auf
  `line-clamp-3` begrenzt, damit ein einzelner sehr langer Titel die Karte
  nicht sprengt.
- `app/news/page.tsx`: Header-Abstand an das übrige App-Muster angeglichen
  (`mb-4` statt `mb-6`, wie Match Center/3. Liga), Card-Abstände leicht
  verdichtet (`gap-2.5` statt `gap-3`) für einen kompakteren
  Sport-Newsstream-Charakter.

Keine neuen Farben, keine neue Bild-Fetch-Logik, keine neuen UI-Elemente.
`NewsFeedRow.tsx` unverändert (setzt selbst keine feste Breite, die Card
bestimmt sie jetzt).

## Matchday Reality Check + Debug-Probe (Phase 3M)

Neue, isolierte Debug-Route `/debug/matchday` (analog zu
`/debug/content-sources`: `noindex`, `force-dynamic`, keine Verlinkung in
der Bottom Navigation). Zeigt nebeneinander:

- **rohe** OpenLigaDB-Feldnamen der ersten drei Spiele des aktuellen
  Spieltags (Top-Level-Keys, `Team1`/`team1`-Keys, `Group`/`group`-Keys,
  erstes `Goals`-Objekt-Keys, `matchIsFinished`-Rohwert) — beantwortet die
  PascalCase-vs-camelCase-Frage empirisch statt durch Vermutung
- `getlastchangedate` im Klartext
- die **normalisierten** Werte über den unveränderten
  `footballDataProvider.getCurrentMatchday()`
- die daraus berechnete **Live-Tabelle** und den **MSV-Kontextsatz** über
  die unveränderten `lib/tableEngine.ts`/`lib/leagueContext.ts`-Funktionen

Ruft ausschließlich lesend auf: ein eigener, redundanter Roh-Fetch (nicht
aus `providers/football/openligadb/client.ts` importiert, um den Provider
nicht anzufassen) plus die bestehenden, unveränderten Provider-/
Engine-Funktionen. Keine neue Produktionslogik, keine bestehende Seite
verändert. Siehe `ZEBRA-Matchday-Reality-Check.md` für den vollständigen
Befund.

## Spiele-Tab v1 (Phase 4A)

Der bisherige Placeholder-Tab „Spiele" beantwortet jetzt: *Wann spielt der
MSV als Nächstes – und wie liefen die letzten Spiele?* Drei Bereiche:
Nächstes Spiel (Hero-Card mit HEUTE/MORGEN-Label + Countdown), Kommende
Spiele (kompakte Liste), Ergebnisse (kompakte Liste mit dezentem
S/U/N-Badge). Bewusst **keine** Matchday-/Live-Logik — die kommt erst nach
dem echten 3.-Liga-Live-Test über `/debug/matchday`.

**Wichtige, transparente Abweichung:** Für „Kommende Spiele" und
„Ergebnisse" als echte Listen (Mehrzahl) gab es **keine** ausreichende
bestehende Provider-Methode — nur `getNextMatch()`/`getLastMatch()` (je
ein einzelnes Spiel). Ich habe deshalb zwei minimale, rein additive
Methoden ergänzt:

- `FootballDataProvider.ts`: `getUpcomingMsvMatches(count)` /
  `getRecentMsvResults(count)` — neue Interface-Signaturen, Dokumentation
  direkt im Interface.
- `OpenLigaDbFootballProvider.ts`: nutzt für beide **ausschließlich** die
  bereits vorhandene private `seasonMatches()` — dasselbe Filtermuster
  wie das bestehende `getNextMatch()`/`getLastMatch()`, nur als Liste
  statt Einzelspiel. Keine neue Fetch- oder Mapping-Logik, keine
  bestehende Methode verändert.
- `MockFootballProvider.ts`: liefert ehrlich nur 0–1 Einträge (basierend
  auf den vorhandenen `MOCK_NEXT_MATCH`/`MOCK_LAST_MATCH`) — der Mock hat
  keine Season-Liste, das wird nicht vorgetäuscht. Keine Mock-Datendatei
  verändert.

**Neue Dateien:** `lib/spiele/matchResult.ts` (S/U/N aus MSV-Sicht,
`null` bei unvollständigem Ergebnis), `lib/spiele/relativeDate.ts`
(HEUTE/MORGEN), `components/spiele/{NextMatchCard,UpcomingMatchRow,
ResultRow}.tsx`.

**Unverändert:** `lib/tableEngine.ts`, `lib/leagueContext.ts`,
`lib/multiplex.ts`, alle OpenLigaDB-Mapping-Dateien
(`providers/football/openligadb/*`), Match Center, Home, News Hub,
3.-Liga-Seite, Bottom Navigation, alle Debug-Probes.

## Mehr v1 (Phase 4B)

Kleiner, hochwertiger Service-Bereich statt Sammelbecken — nur Dinge, die
jetzt tatsächlich funktionieren, keine Platzhalter.

**Hauptseite `/mehr`** (`app/mehr/page.tsx`, komplett ersetzt): drei
Bereiche — ZebraTV, MSV Duisburg, ZEBRA App — als kompakte Navigationszeilen
(`components/mehr/NavRow.tsx`, intern mit Chevron, extern mit
ExternalLink-Icon, beide aus dem bereits installierten `lucide-react`).

- **ZebraTV** (`app/mehr/zebratv/page.tsx`, neu): ruft ausschließlich
  `fetchYoutubeNews()` aus dem bereits bestehenden
  `lib/newsFeed/sources/youtube.ts` auf — keine zweite YouTube-
  Implementierung, kein neuer Feed. Rendering über die bereits bestehende
  `NewsFeedCard`-Komponente (`variant="list"`, dieselbe wie auf der
  News-Seite) — kein neuer Card-Typ. Kein eigener Player, Tap öffnet die
  YouTube-URL extern. Leerer Zustand dezent, kein technischer Fehler.
- **MSV Duisburg:** nur „Offizielle Website"
  (`https://www.msv-duisburg.de/`) — das ist die einzige im Projekt
  bereits belastbar verifizierte MSV-URL (Basis der News-/Debug-Pipeline,
  wiederholt mit HTTP 200 bestätigt). **Tickets und Fanshop wurden bewusst
  nicht ergänzt** — dafür lag keine im Projekt belastbare URL vor, siehe
  Abschlussbericht im Chat.
- **Über ZEBRA** (`app/mehr/ueber/page.tsx`, neu) und **Datenquellen**
  (`app/mehr/datenquellen/page.tsx`, neu): statischer Text bzw. eine
  einfache Liste der vier tatsächlich produktiv genutzten Quellen
  (OpenLigaDB, MSV Duisburg, ZebraTV/YouTube, liga3-online.de) —
  RevierSport bewusst nicht aufgeführt (HTTP 403, nicht Teil des
  produktiven Feeds).

**Rücknavigation:** `components/mehr/BackLink.tsx`, konsistent mit dem
bestehenden Match-Center-Muster (Pfeil + „Zurück"), auf allen drei
Unterseiten.

**Bottom Navigation:** nicht verändert — der `/mehr`-Link zeigte bereits
korrekt auf die (vorher als Placeholder existierende) Route.

**Unverändert:** Home, News Hub, Spiele, 3.-Liga-Seite, Match Center,
`FootballDataProvider`/`OpenLigaDbFootballProvider`/`MockFootballProvider`,
OpenLigaDB-Mapping, `tableEngine`/`leagueContext`/`multiplex`,
News-Aggregations-/Deduplizierungslogik, alle Debug-Probes.

## ZEBRA App Polish + Data Completeness Pass (Phase 4C)

Fünf gezielte Korrekturen, keine Architekturänderung.

**1) Home-Branding:** Bottom-Nav-Label „Heute" → „Home" (Route
unverändert). Dezentes typografisches „1902" oben rechts im Home-Header
(`components/home/HomeView.tsx`) — reiner Text in Zebra-Blau, kein
Logo/Wappen, Header nicht höher geworden.

**2) Spiele-Tap-Fehler — Ursache gefunden und behoben:** `pickString()`
akzeptiert nur `typeof value === "string"`. Die reale OpenLigaDB-`MatchID`
kommt aber sehr wahrscheinlich als JSON-**Zahl**, nicht als String — sie
wurde deshalb bislang als "nicht vorhanden" behandelt, und `mapMatch.ts`
fiel auf eine **synthetische Ersatz-ID** zurück (`teamId-teamId-kickoff`
statt der echten numerischen ID). Ein Link zu dieser Ersatz-ID führt zu
keiner sinnvollen Match-Center-Seite. Root-Cause-Fix: neuer Helper
`pickIdAsString()` (`providers/football/openligadb/safe.ts`) akzeptiert
String **und** Zahl für ID-Felder, jetzt für `MatchID` und `GoalID`
verwendet (`mapMatch.ts`). Zusätzlich, wie explizit gefordert, **defensiv
auf UI-Ebene**: „Kommende Spiele" und „Ergebnisse" im Spiele-Tab sind jetzt
grundsätzlich nicht mehr antippbar (`components/spiele/{UpcomingMatchRow,
ResultRow}.tsx`, kein `<Link>` mehr). Die „Nächstes Spiel"-Hero-Card
(`NextMatchCard.tsx`) ist nur noch klickbar, wenn `match.id` wie eine
echte, rein numerische OpenLigaDB-ID aussieht (`lib/spiele/matchLink.ts`,
`hasReliableMatchId()`) — im Mock-Modus immer klickbar, da der
Mock-Provider die ID ohnehin ignoriert.

**3) Wettbewerbe im Spiele-Tab — Reality Check statt Raten:** Recherche
bestätigt real (DFB-Datencenter): MSV Duisburg – SV Elversberg, DFB-Pokal
2026/27, 1. Runde, 22.08.2026. Die **offizielle OpenLigaDB-Dokumentation**
weist aber ausdrücklich darauf hin, dass der DFB-Pokal (anders als
bl1/bl2/bl3) **kein** verlässliches Shortcut/Season-Schema hat. Deshalb
**keine Competition-ID geraten und keine Integration gebaut** — stattdessen
ein isolierter, temporärer Debug-Probe `/debug/competitions`
(`app/debug/competitions/page.tsx`), der den echten `getavailableleagues`-
Endpunkt abruft und nach "Pokal"/"DFB"/"Niederrhein" filtert. `/spiele`
zeigt weiterhin ausschließlich 3.-Liga-Spiele — unverändert, da nichts
Belastbares zum Integrieren vorlag. Niederrheinpokal: keine Anhaltspunkte
gefunden, dass OpenLigaDB diesen Wettbewerb überhaupt führt — offener
Punkt, siehe Abschlussbericht.

**4) 3.-Liga-Seite:**
- **Teamnamen:** `components/liga/MatchdayList.tsx` nutzte feste
  `w-16`-Spalten für Heim-/Auswärtsteam — jetzt `flex-1 min-w-0 truncate`
  auf beiden Seiten, Score/Uhrzeit dazwischen `flex-shrink-0`. Namen nutzen
  jetzt den tatsächlich verfügbaren Platz, `ellipsis` nur noch bei wirklich
  zu langen Namen.
- **MSV-Hervorhebung:** dieselbe visuelle Logik wie die Tabelle
  (`LeagueTable.tsx`) — linker `zebra-blue`-Akzentstrich +
  `bg-zebra-blue-dim/40`-Tönung statt nur Rahmenfarbe, Teamname zusätzlich
  in Zebra-Blau.
- **Spieltagsnavigation:** neue, minimale additive Provider-Methoden
  `getMatchday(n)` / `getSeasonMatchdayRange()` (`FootballDataProvider.ts`,
  beide Implementierungen) — nutzen in `OpenLigaDbFootballProvider.ts`
  ausschließlich die bereits vorhandene private `seasonMatchesRaw()`,
  identisches Muster wie das bestehende `getCurrentMatchday()`, kein neuer
  Fetch, kein neues Mapping. Navigation über URL-Query
  `/3-liga?spieltag=N` (`app/3-liga/page.tsx`, `‹ N. SPIELTAG ›` in
  `LigaView.tsx`), Grenzen aus echten Spieltagsnummern der Saison
  abgeleitet. Tabelle/Live-Tabelle/Kontext bleiben strikt an den
  tatsächlich aktuellen Spieltag gebunden, unabhängig vom durchblätterten
  Spieltag.

**5) liga3-online.de — Encoding-Ursache gefunden und behoben:**
`decodeEntities()` (`lib/newsFeed/xmlUtils.ts`) kannte bislang nur 5
hartcodierte Entities (`&amp;`, `&lt;`, `&gt;`, `&quot;`, `&#39;`). Alles
andere — insbesondere numerische Entities wie `&#252;` (ü), `&#228;` (ä),
`&#8222;`/`&#8220;` (typografische Anführungszeichen), `&#8211;` (Gedankenstrich)
sowie benannte Entities wie `&uuml;`/`&szlig;` — blieb als roher
Entity-Text im Titel stehen. Generisch behoben: benannte Entity-Tabelle
für deutsche/typografische Zeichen plus generische Dezimal- und
Hex-Entity-Dekodierung (`String.fromCodePoint`). Zusätzlich wird der
Titel jetzt (wie zuvor nur der Teaser) durch `stripCdataAndTags()`
geschickt — falls `<title>` CDATA-gewrappt ist, verschwinden die
`<![CDATA[`/`]]>`-Marker jetzt auch dort. Zentral in der gemeinsamen
`xmlUtils.ts` behoben (nicht liga3-spezifisch gehackt) — kommt automatisch
auch YouTube-Titeln zugute, keine andere Quelle wurde funktional verändert.
Getestet mit drei konstruierten, realistisch nachgebauten Beispiel-Titeln
(siehe Abschlussbericht im Chat) — kein Live-Fetch in dieser Sandbox
möglich.

**Unverändert:** MSV-News-Pipeline, ZebraTV-Pipeline, News-Hub-Layout,
News-Deduplizierung, MSV-Parser, Matchday-Live-Logik,
`tableEngine.ts`/`leagueContext.ts`/`multiplex.ts`, restliche
OpenLigaDB-Mappings, alle Debug-Probes außer dem neuen
`/debug/competitions`, Mehr-/ZebraTV-/Datenquellen-/Über-ZEBRA-Seite,
globale Styles.

## Kleiner gezielter Pass (Phase 4D)

**1) „1902" präsenter:** Größe `text-xs`→`text-base` (12px→16px, ca. +33 %),
Gewicht `font-semibold`→`font-bold`, `leading-none` ergänzt (Header wird
dadurch nicht höher), Tracking minimal von `0.2em` auf `0.18em`
angepasst, Position/Farbe (`text-zebra-blue`) unverändert. Bleibt klar
kleiner als „MSV DUISBURG" (`text-2xl`).

**2) DFB-Pokal — Probe erweitert, NICHT integriert:** Ich habe die
tatsächliche Ergebnisliste aus eurem Vercel-Test nicht vor mir (nur die
Bestätigung „zahlreiche Treffer"), und die Vorgabe war ausdrücklich: kein
Shortcut/keine Season raten. `/debug/competitions`
(`app/debug/competitions/page.tsx`) prüft deshalb jetzt automatisch die
wahrscheinlichsten Kandidaten (Saison-Feld enthält „2026", sonst die
ersten aus der Liste, hart auf 6 Requests gedeckelt) — jeweils mit
**deren eigenem, echtem** Shortcut/Season aus der realen
`getavailableleagues`-Response — und sucht darin gezielt nach
„MSV"/"Duisburg". Ergebnis wird pro Kandidat angezeigt: Name, Shortcut,
Season, LeagueId, Gesamtzahl Spiele, und bei Treffer: MatchID, Gegner,
Kickoff, Runde. **Keine Integration in `/spiele`, keine neuen
Provider-Methoden, keine Änderung an `tableEngine.ts`/`leagueContext.ts`/
`multiplex.ts`/`/3-liga`** — das folgt erst nach dem nächsten
Vercel-Test, wenn die Kandidaten-Liste eindeutig ist. Niederrheinpokal-
Abschnitt unverändert stehen gelassen (nur zur Referenz), keine weitere
Recherche dafür.

**Unverändert:** alles außerhalb dieser zwei Dateien — insbesondere News/
News-Parser/Encoding-Fix, ZebraTV, Mehr, BottomNav, Matchday-Debug,
Designsystem, `/spiele`-Logik, `/3-liga`.

## DFB-Pokal-Integration in /spiele (Phase 4E)

Live über `/debug/competitions` verifiziert: Shortcut `dfb`, Season `2026`
("DFB Pokal 2026/2027", 32 Spiele, MSV vs. SV 07 Elversberg gefunden,
MatchID 81851, 1. Runde, 2026-08-27T15:30:00). Diese Koordinaten (nicht
die Matchdaten selbst!) sind jetzt in `config/football.ts` als
`DFB_POKAL_CONFIG` hinterlegt — die eigentlichen Spieldaten kommen weiter
ausschließlich live von OpenLigaDB, nichts ist hardcodiert.

**Strukturelle, nicht nur konventionelle Trennung von der 3.-Liga-Pipeline:**
`providers/football/openligadb/cupClient.ts` (neu) ist ein komplett
eigenständiger Fetch-Client mit eigenem Cache — bewusst **kein** Import
von `client.ts` (das strukturell an `FOOTBALL_CONFIG`/3. Liga gebunden ist
und von `tableEngine`-relevanten Methoden verwendet wird). `lib/spiele/
dfbPokal.ts` (neu) nutzt diesen Client plus den bereits bestehenden,
kompetitionsunabhängigen `mapOldbMatch()` — kein neues Mapping, nur ein
neuer Aufrufer. Diese Datei wird ausschließlich von `app/spiele/page.tsx`
importiert, sonst nirgendwo — `tableEngine.ts`, `leagueContext.ts`,
`multiplex.ts` und `/3-liga` kennen den Pokal nicht einmal.

**Aggregation:** `lib/spiele/aggregateSchedule.ts` (neu) — eine reine
Merge-/Sortierfunktion ohne Fetch-Logik. Führt die bereits geladenen
Liga- und Pokal-Match-Arrays zu einem chronologischen Spielplan zusammen,
sortiert ausschließlich nach `match.kickoff`. `app/spiele/page.tsx` ruft
jetzt `getUpcomingMsvMatches()`/`getRecentMsvResults()` (Liga,
unverändert) und `getCupMsvMatches()` (Pokal, neu) parallel ab und
mergt sie — „Nächstes Spiel" ist dadurch automatisch das chronologisch
erste Element des gemergten Pools, unabhängig vom Wettbewerb.

**Kennzeichnung:** `competitionLabel()` liefert `"DFB-POKAL · 1. RUNDE"`
(aus dem echten `roundName`-Feld, siehe unten) für Pokalspiele,
`undefined` für Liga-Spiele — die drei Spiele-Komponenten
(`NextMatchCard`/`UpcomingMatchRow`/`ResultRow`) rendern dieses Label nur,
wenn es gesetzt ist; die bestehende Liga-Darstellung ist dadurch optisch
unverändert.

**Neues Datenfeld `roundName`:** `types/match.ts` um `roundName?: string |
null` erweitert, `mapMatch.ts` extrahiert es zusätzlich zu `groupOrderId`
aus `Group.GroupName`/`groupName` (rein additiv, ändert keine bestehende
Extraktion). Wird von der Live-Tabellen-/Multiplex-Logik nirgendwo
gelesen, ist für sie also folgenlos vorhanden.

**Klickbarkeit:** keine Sonderbehandlung nötig — `hasReliableMatchId()`
(`lib/spiele/matchLink.ts`, unverändert) ist bereits wettbewerbs-
unabhängig (reiner Zahlen-Check auf `match.id`). MatchID `81851` ist ein
sauberer numerischer String und wird deshalb nach derselben Regel wie
jedes Liga-Spiel behandelt — keine neue Logik, kein Sonderfall für den
Pokal.

**Mock-Modus:** `getCupMsvMatches()` liefert im Mock-Modus sofort leere
Arrays (kein Live-Fetch aus der Demo-Sandbox heraus, keine erfundenen
Pokal-Mock-Daten) — `/spiele` zeigt dort weiterhin nur die bestehenden
Liga-Mock-Spiele.

**Unverändert:** `/3-liga`, 3.-Liga-Tabelle, Spieltagsnavigation,
`tableEngine.ts`, `leagueContext.ts`, `multiplex.ts`, `client.ts`
(3.-Liga-Fetch-Pipeline), Home, „1902", BottomNav, News/liga3-Encoding-Fix,
ZebraTV, Mehr, `/debug/matchday`, `/debug/competitions` (bleibt bestehen).
Niederrheinpokal weiterhin nicht verfolgt.

## MSV Statistics Reality Check (Phase 4F)

Reine Analyse, keine produktive Implementierung — vollständiger Befund in
`ZEBRA-Stats-Reality-Check.md`. Kurzfassung: `MatchStats`/`MatchLineup`-
Typen existieren bereits (aus der Match-Center-Phase), werden im echten
Modus aber nie befüllt, da OpenLigaDB weder Aufstellungen noch Ballbesitz/
Schüsse/xG/Karten liefert (konsistent über die gesamte bisherige
Projekt-Recherche bestätigt). Zwei konkrete offene Fragen — `getgoalgetters`
(Torschützen) und ein mögliches Zuschauerfeld (`NumberOfViewers`) — klärt
der neue, isolierte Debug-Probe `/debug/stats-sources`
(`app/debug/stats-sources/page.tsx`, `noindex`, `force-dynamic`, keine
Secrets). Externe APIs geprüft: football-data.org deckt die 3. Liga auf
dem kostenlosen Tier nicht ab, Sportmonks ebenso wenig, API-Football hat
unbestätigte 3.-Liga-Tiefe bei nur 100 Requests/Tag im Gratis-Tier,
TheSportsDB gilt laut Fremdquelle als nicht genau genug. Empfehlung:
schlanke „MSV Stats v1" (Saisonbilanz, Top-Torschützen, ggf. Zuschauer)
statt „Match Center+" — Aufstellungen/xG bleiben ohne kostenpflichtigen
Anbieter nicht umsetzbar. Keine neue produktive UI, kein neuer Provider,
keine bestehende Logik verändert.

## MSV-Kader + Zuschauer Reality Check (Phase 4G)

Reine Analyse, keine produktive Implementierung — vollständiger Befund in
`ZEBRA-Squad-Attendance-Reality-Check.md`. Kurzfassung: **football-data.org
und Sportmonks scheiden für die 3. Liga auf dem Gratis-Tier aus.**
API-Football hat dokumentierte Kader-/Lineup-Endpunkte, aber **kein**
Zuschauerfeld in der dokumentierten Fixture-Struktur gefunden, und die
3.-Liga-Coverage für 2026/27 war ohne echten Account-Key nicht live
bestätigbar. **TheSportsDB ist die einzige Zusatzquelle, die ohne
persönlichen API-Key live testbar war** — dafür der neue, isolierte
Debug-Probe `/debug/squad-attendance-sources`
(`app/debug/squad-attendance-sources/page.tsx`, `noindex`,
`force-dynamic`, keine Secrets), der live gegen „MSV Duisburg" sucht und
den Kader inkl. Rückennummer/Position/Geburtsdatum/Nationalität abruft.
Torschützen-Zuordnung zu OpenLigaDB (`goalGetterId`/`goalGetterName`,
kein Team-Feld) nur über fehleranfälliges Namensmatching möglich — Risiken
(Umlaute, Abkürzungen, Doppelnamen) im Bericht benannt, **kein
automatisches Matching ohne manuelle Kontrolle empfohlen**. Keine gemeinsame
Quelle für Kader + Zuschauer gefunden. Keine neue produktive UI, kein
neuer Provider, keine bestehende Logik verändert.

## Product Polish Batch 1A — Home: Pflichtspiel + Form (Phase 4H)

Zwei gezielte Home-Verbesserungen, keine Architekturänderung.

**1) Nächstes Pflichtspiel (3. Liga + DFB-Pokal):** `app/page.tsx` ruft
jetzt `footballDataProvider.getUpcomingMsvMatches(3)` +
`getCupMsvMatches(3, 0)` parallel ab und führt sie über die **bereits
bestehende** `mergeUpcoming()` aus `lib/spiele/aggregateSchedule.ts`
zusammen — exakt dieselbe Aggregation wie `/spiele`, keine zweite
Pipeline. `footballDataProvider.getNextMatch()` wird von Home nicht mehr
aufgerufen (die Provider-Methode selbst bleibt unverändert im Interface
bestehen, ungenutzt-aber-nicht-entfernt, um keine unrelated
Refaktorierung vorzunehmen). Wettbewerbslabel („DFB-POKAL · 1. RUNDE")
über die bereits bestehende `competitionLabel()`-Funktion, als neuer
optionaler Prop `competitionLabel` an `components/match/MatchCard.tsx`
durchgereicht (additiv — `MatchCard` wird ausschließlich von Home
verwendet, Match Center hat eine eigene `MatchHero.tsx`, keine Berührung).
Klickbarkeits-Check auf die Hero-Card angewendet
(`hasReliableMatchId()`, bereits bestehendes Utility aus
`lib/spiele/matchLink.ts`) — vorher war die Home-Hero-Card
unconditional verlinkt, das war eine Lücke gegenüber `/spiele`s
bestehender Regel, jetzt konsistent.

**2) Form der letzten 5 Ligaspiele:** `footballDataProvider.getMsvForm(5)`
ist unverändert und bereits Liga-only (nutzt intern dieselbe
Liga-Season-Quelle wie `getNextMatch()`, nie den isolierten
DFB-Pokal-Client) — DFB-Pokal-Ergebnisse können die Form architektonisch
gar nicht verfälschen, ganz ohne neue Filterung. Neue reine
Darstellungsfunktion `buildFormSlots()` in `HomeView.tsx` dreht das
(bereits neuestes-zuerst sortierte) Ergebnis lokal um und füllt auf 5
Slots auf — **chronologisch ältestes→neuestes, aktuellstes rechts**;
fehlende frühe Saisonspiele werden als neutrale Slots **rechts**
aufgefüllt (z. B. nach einem Spiel: `S – – – –`), keine erfundenen
Ergebnisse. `components/form/FormCurve.tsx` additiv erweitert: akzeptiert
jetzt `(FormMatch | null)[]` statt nur `FormMatch[]` und rendert für
`null` einen neutralen Kreis — Match Center (`TeamFormCompare.tsx`)
übergibt weiterhin nie `null` und ist optisch komplett unverändert
(TypeScript bestätigt `FormMatch[]` bleibt kompatibel zuweisbar).

**Unverändert:** `tableEngine.ts`, `leagueContext.ts`, `multiplex.ts`,
alle OpenLigaDB-Mapping-Dateien, `/spiele`, `/3-liga`, Match Center, News,
Mehr, ZebraTV, Bottom Navigation, alle Debug-Probes, Live-/Matchday-Logik.

## Product Polish Batch 1B — 3. Liga UX + News-Zeitformat (Phase 4I, Verifikation)

Beim Bestands-Check zu Beginn dieses Batches (wie vorgegeben) zeigte sich:
**alle Punkte dieses Batches waren bereits vollständig im Code umgesetzt**
— `lib/relevantMatchday.ts` (automatische Spieltags-Relevanz),
`formatMatchdayDateRange()`/`formatDayGroupKey()`/`formatDayGroupLabel()`
in `lib/format.ts`, die Tagesgruppierung + entfernte
„Bevorstehend"-Pille in `MatchdayList.tsx`, die bereits umbenannte
„MSV-Status"-Sektion in `LigaView.tsx` sowie die zentrale
`formatNewsTime()` in `lib/newsFeed/format.ts` (inkl. eines defensiven
Fallback-Parsers für das deutsche `DD.MM.YYYY`-Format ohne Uhrzeit —
genau die Ursache der zuvor beobachteten Inkonsistenz „vor 22 Std" neben
rohem „11.08.2026"). Ich habe deshalb **keinen Code verändert**, sondern
den vorhandenen Stand gegen alle Anforderungen und Edge Cases dieses
Batches geprüft (siehe Abschlussbericht im Chat) und einen erneuten
TypeScript-Strict-Check über den gesamten betroffenen Bestand
durchgeführt.

## News-Timestamp-Bug: Reality Check statt Blindfix (Phase 4J)

Vollständigen Codepfad gelesen (`msvParser.ts` → `msv.ts` → `aggregate.ts`
→ `format.ts` → `NewsFeedCard.tsx`): **keine** `Date.now()`/`new Date()`-
Fallback-Stelle gefunden — die ursprünglich naheliegende Hypothese
("leeres/ungültiges Datum wird stillschweigend zu 'jetzt'") lässt sich im
Code nicht bestätigen. Starkes Gegenindiz zusätzlich: `aggregate.ts::
toTimestamp("")` liefert `0` (Epoch) — ein leeres `publishedAt` würde die
Meldung ans Ende der Sortierung schieben, nicht an den Anfang. Da die
betroffenen `#fcwmsv`/`#msvvereint`-Meldungen laut Beobachtung ganz oben
stehen, muss ein echter, nah-aktueller Zeitwert ankommen — vermutlich,
weil die Quelle (msv-duisburg.de) für diese offenbar hashtag-/
Social-Embed-artigen Teaser bei jedem Seitenaufruf ein aktuelles
`<time datetime>` rendert, keinen festen Artikel-Zeitpunkt. Das ist eine
begründete Hypothese, **keine bestätigte Ursache** — deshalb kein
Blindfix.

**Neuer, isolierter Debug-Probe:** `/debug/news-dates`
(`app/debug/news-dates/page.tsx`, `noindex`, `force-dynamic`). Zeigt pro
MSV-Artikel getrennt: rohes `<time datetime>`-Attribut, roher sichtbarer
`<time>`-Text, roher `DD.MM.YYYY`-Texttreffer, daraus berechnetes
`publishedAt` sowie das tatsächliche `formatNewsTime()`-Ergebnis —
insbesondere für Items mit „#"-Kategorie-Präfix (also `#fcwmsv`,
`#msvvereint`) im Vergleich zu normalen Artikeln. Nutzt bewusst eine
**eigene, rein diagnostische** DOM-Auswertung statt den produktiven
`msvParser.ts` zu erweitern — der bleibt dadurch exakt unverändert und
bleibt die einzige Wahrheit für die echte Extraktion.

**Kein Fix implementiert** — wie vorgegeben erst nach Bestätigung der
tatsächlichen Ursache über den Probe. `format.ts`, `msvParser.ts`,
`msv.ts`, `aggregate.ts` sowie liga3-online/ZebraTV/Dedup/Encoding-Fix
komplett unverändert.

## News-Timestamp-Bug: Root Cause gefunden und behoben (Phase 4K)

Über `/debug/news-dates` live bestätigt: `computed publishedAt` für die
betroffenen Meldungen war korrekt `"11.08.2026"`/`"10.08.2026"` — das
Problem lag ausschließlich in `formatNewsTime()` (und identisch in
`aggregate.ts::toTimestamp()` für die Sortierung).

**Root Cause:** `Date.parse("11.08.2026")` liefert in der echten
Laufzeitumgebung **kein** `NaN` (anders als ursprünglich angenommen,
siehe letzte Phase). Der bisherige Code rief `Date.parse(publishedAt)`
zuerst unconditional auf und prüfte erst danach `Number.isNaN(parsed)`,
um zu entscheiden, ob der eigene, sichere `parseGermanDateOnly()`-
Fallback greifen sollte. Weil `Date.parse()` für dieses Format
"erfolgreich" — nur eben falsch, mit einem Ergebnis nahe der aktuellen
Zeit — zurückkehrte, wurde der `NaN`-Zweig nie erreicht. Der Fallback war
faktisch toter Code.

**Fix in `lib/newsFeed/format.ts`:** Das `DD.MM.YYYY`-Muster wird jetzt
**zuerst und ausschließlich** über den eigenen, deterministischen Parser
erkannt — der generische `Date.parse()`-Pfad kommt für dieses Format gar
nicht mehr zum Zug. `parseGermanDateOnly()` validiert zusätzlich das
Kalenderdatum selbst (lehnt z. B. „31.02." jetzt ab, statt es
stillschweigend in den März rollen zu lassen) und ist jetzt exportiert.
Die relative Anzeige für reine Datums-Werte rechnet neu in **ganzen
Kalendertagen** (`Europe/Berlin`, über `Intl.DateTimeFormat`, unabhängig
von der tatsächlichen Server-Zeitzone) statt in
Millisekunden-Differenz zur aktuellen Uhrzeit — sonst hätte die
Rundung je nach Tageszeit zu falschen Werten geführt (z. B. „vor 3 Tg"
statt korrekt „vor 2 Tg" für ein Datum von vorgestern, geprüft am
Nachmittag). Ein Artikel von heute zeigt neu `"heute"` (kein bestehender
Tier passte, „gerade eben" wäre falsch gewesen, da für ein reines Datum
keine Uhrzeit bekannt ist).

**Fix in `lib/newsFeed/aggregate.ts::toTimestamp()`:** identischer
Root-Cause-Bug war dort ebenfalls vorhanden (`Date.parse()` zuerst,
DD.MM.YYYY-Fallback faktisch unerreichbar) — jetzt behoben durch
Wiederverwendung desselben, jetzt exportierten `parseGermanDateOnly()`
aus `format.ts` (eine Wahrheit, keine zweite Kopie der Parsing-Logik).
Ein `DD.MM.YYYY`-Artikel kann dadurch nicht mehr fälschlich wie gerade
veröffentlicht einsortiert werden.

**Getestet** (Node-Simulation mit fixiertem „jetzt" = 13.08.2026): alle
in der Aufgabenstellung geforderten Fälle bestehen exakt —
`11.08.2026`→„vor 2 Tg", `10.08.2026`→„vor 3 Tg", `08.08.2026`→„vor 5 Tg",
`13.08.2026`→„heute", `12.08.2026`→„vor 1 Tg", valide ISO-Werte
unverändert korrekt, `undefined`/`""`/ungültiger String/ungültiges
Kalenderdatum (`31.02.2026`) → kein Zeitstempel.

**Unverändert:** die bestehende Min/Std/Tg/Datum-Logik für vollständige
ISO-Zeitwerte, alle anderen News-Quellen (liga3-online, ZebraTV/YouTube),
Deduplizierung, Bilder, Teaser, `/debug/news-dates` (bleibt bestehen),
Home-Layout außerhalb der gemeinsamen `NewsFeedCard`, `/spiele`,
`/3-liga`, Football Provider, DFB-Pokal, Match Center, BottomNav, `/mehr`,
Designsystem.

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
