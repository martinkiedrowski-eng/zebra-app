import { AppShell } from "@/components/layout/AppShell";
import { LigaView } from "@/components/liga/LigaView";
import { footballDataProvider, IS_MOCK_MODE } from "@/providers/registry";
import { MOCK_MATCHDAY_MATCHES } from "@/mock/league";

// Server Component: Basistabelle (VOR dem aktuellen Spieltag) und der
// aktuelle Spieltag kommen über den FootballDataProvider — identisch für
// Mock und OpenLigaDB. Nur der "Multiplex Live"-Dev-Zustand bleibt ein
// Mock-only-Werkzeug (siehe LigaView): im openligadb-Modus gibt es keine
// künstliche zweite Variante, nur den tatsächlichen aktuellen Spieltag.
export default async function DritteLigaPage() {
  const [baselineTable, { matchday, matches: matchdayNormal }] = await Promise.all([
    footballDataProvider.getBaselineTable(),
    footballDataProvider.getCurrentMatchday(),
  ]);

  return (
    <AppShell>
      <LigaView
        isMockMode={IS_MOCK_MODE}
        baselineTable={baselineTable}
        matchdayNormal={matchdayNormal}
        matchdayMultiplex={IS_MOCK_MODE ? MOCK_MATCHDAY_MATCHES : matchdayNormal}
        matchday={matchday}
      />
    </AppShell>
  );
}
