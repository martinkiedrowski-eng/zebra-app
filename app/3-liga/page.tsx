import { AppShell } from "@/components/layout/AppShell";
import { LigaView } from "@/components/liga/LigaView";
import { footballDataProvider, IS_MOCK_MODE } from "@/providers/registry";
import { MOCK_MATCHDAY_MATCHES } from "@/mock/league";

// Server Component: Basistabelle (VOR dem aktuellen Spieltag) und der
// aktuelle Spieltag kommen über den FootballDataProvider — identisch für
// Mock und OpenLigaDB. Nur der "Multiplex Live"-Dev-Zustand bleibt ein
// Mock-only-Werkzeug (siehe LigaView): im openligadb-Modus gibt es keine
// künstliche zweite Variante, nur den tatsächlichen aktuellen Spieltag.
//
// Spieltagsnavigation (Polish-Pass): der durchblätterte Spieltag wird
// über den URL-Query-Parameter ?spieltag=N gesteuert (kein Client-seitiger
// Re-Fetch nötig) und ist strikt von der Tabelle/Live-Tabelle getrennt,
// die weiterhin ausschließlich den TATSÄCHLICH aktuellen Spieltag abbildet.
export default async function DritteLigaPage({
  searchParams,
}: {
  searchParams: { spieltag?: string };
}) {
  const [baselineTable, currentMatchdayResult, matchdayRange] = await Promise.all([
    footballDataProvider.getBaselineTable(),
    footballDataProvider.getCurrentMatchday(),
    footballDataProvider.getSeasonMatchdayRange(),
  ]);

  const requested = searchParams.spieltag ? Number.parseInt(searchParams.spieltag, 10) : NaN;
  const browsedMatchday = Number.isFinite(requested)
    ? Math.min(Math.max(requested, matchdayRange.min), matchdayRange.max)
    : currentMatchdayResult.matchday;

  const browsedMatchdayResult =
    browsedMatchday === currentMatchdayResult.matchday
      ? currentMatchdayResult
      : await footballDataProvider.getMatchday(browsedMatchday);

  return (
    <AppShell>
      <LigaView
        isMockMode={IS_MOCK_MODE}
        baselineTable={baselineTable}
        matchdayNormal={currentMatchdayResult.matches}
        matchdayMultiplex={IS_MOCK_MODE ? MOCK_MATCHDAY_MATCHES : currentMatchdayResult.matches}
        matchday={currentMatchdayResult.matchday}
        browsedMatchday={browsedMatchdayResult.matchday}
        browsedMatches={browsedMatchdayResult.matches}
        matchdayRange={matchdayRange}
      />
    </AppShell>
  );
}
