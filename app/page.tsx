import { AppShell } from "@/components/layout/AppShell";
import { HomeView } from "@/components/home/HomeView";
import { footballDataProvider, newsProvider, IS_DEMO_DATA, IS_MOCK_MODE } from "@/providers/registry";
import { MOCK_LIVE_MATCH } from "@/mock/matches";
import { selectHomeTableExcerpt } from "@/lib/homeTableExcerpt";
import { MSV_TEAM_ID } from "@/lib/constants";
import { getAggregatedNews } from "@/lib/newsFeed/aggregate";
import { getCupMsvMatches } from "@/lib/spiele/dfbPokal";
import { mergeUpcoming, mergeResults, competitionLabel } from "@/lib/spiele/aggregateSchedule";

// Server Component: lädt über die Provider-Architektur — Mock oder
// OpenLigaDB, je nach FOOTBALL_DATA_SOURCE (siehe providers/registry.ts).
// Diese Seite kennt den Unterschied nicht, mit einer Ausnahme: der
// Next-Up/Live-Dev-Umschalter ist ausschließlich ein Mock-Development-Tool
// (siehe HomeView) und bekommt im openligadb-Modus keine Mock-Daten mehr
// injiziert — dort bestimmt footballDataProvider.getLiveMatch() den
// tatsächlichen Zustand.
//
// Next Up (Product Polish Batch 1A): "Nächstes Spiel" ist jetzt das
// chronologisch nächste MSV-PFLICHTSPIEL aus 3. Liga + DFB-Pokal — dieselbe
// Aggregation wie /spiele (footballDataProvider.getUpcomingMsvMatches() +
// lib/spiele/dfbPokal.ts::getCupMsvMatches() + lib/spiele/
// aggregateSchedule.ts::mergeUpcoming()), keine zweite Pipeline. Live-Zustand
// bleibt unverändert liga-only (keine neue Live-/Matchday-Logik in diesem
// Batch).
//
// Tabellen-Vorschau: lädt bewusst die VOLLSTÄNDIGE Tabelle über
// getTable() (unveränderte Provider-Methode) und wählt den Home-Ausschnitt
// lokal über das reine Utility selectHomeTableExcerpt() aus — keine
// Provider-/Mapping-Änderung, keine Neuberechnung von Positionen, nur eine
// andere Auswahl aus bereits vorhandenen, fertig sortierten Einträgen.
//
// Form (Batch 1A): footballDataProvider.getMsvForm(5) ist unverändert und
// bereits Liga-only (nutzt intern dieselbe Liga-Season-Quelle wie
// getNextMatch()/getUpcomingMsvMatches() — nie den isolierten
// DFB-Pokal-Client). DFB-Pokal-Ergebnisse können die Form dadurch
// architektonisch gar nicht verfälschen.
//
// News: nutzt denselben produktiven Aggregator wie /news (siehe
// lib/newsFeed/aggregate.ts) — unabhängig vom Football-Mock/OpenLigaDB-
// Modus, echte Quellen, echte Daten.
// Polish Sprint 01, Punkt 1: "Letztes Spiel" ist das chronologisch letzte
// abgeschlossene MSV-PFLICHTSPIEL aus 3. Liga + DFB-Pokal — exakt
// dieselbe Aggregation wie "Nächstes Spiel" (getRecentMsvResults() +
// getCupMsvMatches() + mergeResults()), keine zweite Pipeline. Bleibt
// nach Abpfiff jetzt zusätzlich sichtbar, statt sofort dem NEXT-UP-Fokus
// zu weichen.
export default async function HomePage() {
  const [upcomingLeague, resultsLeague, cup, liveMatch, form, fullTable, radarEvents, newsItems] = await Promise.all(
    [
      footballDataProvider.getUpcomingMsvMatches(3),
      footballDataProvider.getRecentMsvResults(1),
      getCupMsvMatches(3, 1),
      IS_MOCK_MODE ? Promise.resolve(MOCK_LIVE_MATCH) : footballDataProvider.getLiveMatch(),
      footballDataProvider.getMsvForm(5),
      footballDataProvider.getTable(),
      newsProvider.getRadarEvents(3),
      getAggregatedNews(),
    ]
  );

  const upcomingAll = mergeUpcoming(upcomingLeague, cup.upcoming);
  const nextEntry = upcomingAll[0] ?? null;

  const resultsAll = mergeResults(resultsLeague, cup.results);
  const lastEntry = resultsAll[0] ?? null;

  const table = selectHomeTableExcerpt(fullTable, MSV_TEAM_ID, 5);
  const topNews = newsItems.slice(0, 3);

  return (
    <AppShell>
      <HomeView
        nextMatch={nextEntry ? nextEntry.match : null}
        nextMatchCompetitionLabel={nextEntry ? competitionLabel(nextEntry) : undefined}
        lastMatch={lastEntry ? lastEntry.match : null}
        lastMatchCompetitionLabel={lastEntry ? competitionLabel(lastEntry) : undefined}
        liveMatch={liveMatch}
        form={form}
        table={table}
        radarEvents={radarEvents}
        topNews={topNews}
        isDemoData={IS_DEMO_DATA}
        isMockMode={IS_MOCK_MODE}
      />
    </AppShell>
  );
}
