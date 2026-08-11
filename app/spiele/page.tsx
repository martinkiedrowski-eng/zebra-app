import { AppShell } from "@/components/layout/AppShell";
import { NextMatchCard } from "@/components/spiele/NextMatchCard";
import { UpcomingMatchRow } from "@/components/spiele/UpcomingMatchRow";
import { ResultRow } from "@/components/spiele/ResultRow";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { footballDataProvider, IS_MOCK_MODE } from "@/providers/registry";

// Server Component. Beantwortet eine Frage: "Wann spielt der MSV als
// Nächstes – und wie liefen die letzten Spiele?" Bewusst KEINE
// Matchday-/Live-Logik (kommt erst nach dem echten 3.-Liga-Live-Test über
// /debug/matchday) — nur Next Up, kommende Spiele, Ergebnisse.
//
// Nutzt ausschließlich die FootballDataProvider-Architektur, keine
// direkte OpenLigaDB-Abfrage in der UI. getUpcomingMsvMatches()/
// getRecentMsvResults() sind neu (siehe FootballDataProvider.ts), liefern
// aber nur eine andere Sicht auf dieselbe Datenbasis wie die bereits
// bestehenden getNextMatch()/getLastMatch().
export default async function SpielePage() {
  const [nextMatch, upcoming, results] = await Promise.all([
    footballDataProvider.getNextMatch(),
    footballDataProvider.getUpcomingMsvMatches(6),
    footballDataProvider.getRecentMsvResults(6),
  ]);

  // "Kommende Spiele" zeigt bewusst nicht nochmal das Spiel aus der
  // Next-Match-Hero-Card.
  const upcomingRest = nextMatch ? upcoming.filter((m) => m.id !== nextMatch.id) : upcoming;

  return (
    <AppShell>
      <header className="mb-4">
        <p className="font-text text-xs uppercase tracking-wide text-zebra-mute">ZEBRA</p>
        <h1 className="font-display text-2xl font-bold uppercase tracking-wide text-zebra-ice">Spiele</h1>
      </header>

      <section className="mb-6">
        <SectionHeader title="Nächstes Spiel" />
        {nextMatch ? (
          <NextMatchCard match={nextMatch} isMockMode={IS_MOCK_MODE} />
        ) : (
          <div className="rounded-card border border-zebra-border bg-zebra-surface p-4 text-center">
            <p className="font-text text-sm text-zebra-mute">Aktuell ist kein nächstes Spiel bekannt.</p>
          </div>
        )}
      </section>

      {upcomingRest.length > 0 && (
        <section className="mb-6">
          <SectionHeader title="Kommende Spiele" />
          <div className="flex flex-col gap-2">
            {upcomingRest.map((m) => (
              <UpcomingMatchRow key={m.id} match={m} />
            ))}
          </div>
        </section>
      )}

      <section className="mb-6">
        <SectionHeader title="Ergebnisse" />
        {results.length > 0 ? (
          <div className="flex flex-col gap-2">
            {results.map((m) => (
              <ResultRow key={m.id} match={m} />
            ))}
          </div>
        ) : (
          <div className="rounded-card border border-zebra-border bg-zebra-surface p-4 text-center">
            <p className="font-text text-sm text-zebra-mute">Noch keine Ergebnisse verfügbar.</p>
          </div>
        )}
      </section>
    </AppShell>
  );
}
