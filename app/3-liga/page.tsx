import { AppShell } from "@/components/layout/AppShell";
import { LigaView } from "@/components/liga/LigaView";
import { footballDataProvider, IS_MOCK_MODE } from "@/providers/registry";
import { MOCK_MATCHDAY_MATCHES } from "@/mock/league";
import { determineRelevantMatchday } from "@/lib/relevantMatchday";
import type { MatchdayResult } from "@/providers/football/FootballDataProvider";

// Server Component: Basistabelle (VOR dem aktuellen Spieltag) und der
// aktuelle Spieltag kommen über den FootballDataProvider — identisch für
// Mock und OpenLigaDB. Nur der "Multiplex Live"-Dev-Zustand bleibt ein
// Mock-only-Werkzeug (siehe LigaView): im openligadb-Modus gibt es keine
// künstliche zweite Variante, nur den tatsächlichen aktuellen Spieltag.
//
// Spieltagsnavigation: der durchblätterte Spieltag wird über den
// URL-Query-Parameter ?spieltag=N gesteuert und ist strikt von der
// Tabelle/Live-Tabelle getrennt, die weiterhin ausschließlich den
// TATSÄCHLICH aktuellen Spieltag abbildet (siehe `matchday`-Prop in
// LigaView, unverändert).
//
// Polish Sprint 01, Punkt 3+4: relevantMatchday wird jetzt IMMER berechnet
// (auch bei explizitem ?spieltag=), damit LigaView den "Aktueller
// Spieltag"-Rücksprung-Button anzeigen kann, sobald der Nutzer davon
// wegnavigiert ist. Die 48h-Regel selbst steckt unverändert-strukturell
// in lib/relevantMatchday.ts (nur um die Zeit-Komponente erweitert).
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

  const relevantMatchdayResult = await determineRelevantMatchday(
    currentMatchdayResult,
    matchdayRange,
    (n) => footballDataProvider.getMatchday(n)
  );

  const requested = searchParams.spieltag ? Number.parseInt(searchParams.spieltag, 10) : NaN;

  let browsedMatchdayResult: MatchdayResult;
  if (Number.isFinite(requested)) {
    const clamped = Math.min(Math.max(requested, matchdayRange.min), matchdayRange.max);
    browsedMatchdayResult =
      clamped === currentMatchdayResult.matchday
        ? currentMatchdayResult
        : clamped === relevantMatchdayResult.matchday
          ? relevantMatchdayResult
          : await footballDataProvider.getMatchday(clamped);
  } else {
    browsedMatchdayResult = relevantMatchdayResult;
  }

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
        relevantMatchday={relevantMatchdayResult.matchday}
      />
    </AppShell>
  );
}
