import { AppShell } from "@/components/layout/AppShell";
import { HomeView } from "@/components/home/HomeView";
import { footballDataProvider, newsProvider, IS_DEMO_DATA, IS_MOCK_MODE } from "@/providers/registry";
import { MOCK_LIVE_MATCH } from "@/mock/matches";
import { selectHomeTableExcerpt } from "@/lib/homeTableExcerpt";
import { MSV_TEAM_ID } from "@/lib/constants";
import { getAggregatedNews } from "@/lib/newsFeed/aggregate";

// Server Component: lädt über die Provider-Architektur — Mock oder
// OpenLigaDB, je nach FOOTBALL_DATA_SOURCE (siehe providers/registry.ts).
// Diese Seite kennt den Unterschied nicht, mit einer Ausnahme: der
// Next-Up/Live-Dev-Umschalter ist ausschließlich ein Mock-Development-Tool
// (siehe HomeView) und bekommt im openligadb-Modus keine Mock-Daten mehr
// injiziert — dort bestimmt footballDataProvider.getLiveMatch() den
// tatsächlichen Zustand.
//
// Tabellen-Vorschau: lädt bewusst die VOLLSTÄNDIGE Tabelle über
// getTable() (unveränderte Provider-Methode) und wählt den Home-Ausschnitt
// lokal über das reine Utility selectHomeTableExcerpt() aus — keine
// Provider-/Mapping-Änderung, keine Neuberechnung von Positionen, nur eine
// andere Auswahl aus bereits vorhandenen, fertig sortierten Einträgen.
//
// News: nutzt ab jetzt denselben produktiven Aggregator wie /news (siehe
// lib/newsFeed/aggregate.ts) — unabhängig vom Football-Mock/OpenLigaDB-
// Modus, echte Quellen, echte Daten. Der bisherige newsProvider.getTopNews()
// wird hier nicht mehr aufgerufen (Zebra Radar über newsProvider.getRadarEvents()
// bleibt unverändert, das ist ein eigenes Feature).
export default async function HomePage() {
  const [nextMatch, liveMatch, form, fullTable, radarEvents, newsItems] = await Promise.all([
    footballDataProvider.getNextMatch(),
    IS_MOCK_MODE ? Promise.resolve(MOCK_LIVE_MATCH) : footballDataProvider.getLiveMatch(),
    footballDataProvider.getMsvForm(5),
    footballDataProvider.getTable(),
    newsProvider.getRadarEvents(3),
    getAggregatedNews(),
  ]);

  const table = selectHomeTableExcerpt(fullTable, MSV_TEAM_ID, 5);
  const topNews = newsItems.slice(0, 3);

  return (
    <AppShell>
      <HomeView
        nextMatch={nextMatch}
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
