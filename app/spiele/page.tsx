import { AppShell } from "@/components/layout/AppShell";
import { NextMatchCard } from "@/components/spiele/NextMatchCard";
import { UpcomingMatchRow } from "@/components/spiele/UpcomingMatchRow";
import { ResultRow } from "@/components/spiele/ResultRow";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { footballDataProvider, IS_MOCK_MODE } from "@/providers/registry";
import { getCupMsvMatches } from "@/lib/spiele/dfbPokal";
import { mergeUpcoming, mergeResults, competitionLabel } from "@/lib/spiele/aggregateSchedule";

// Server Component. Beantwortet eine Frage: "Wann spielt der MSV als
// Nächstes – und wie liefen die letzten Spiele?" Bewusst KEINE
// Matchday-/Live-Logik — nur Next Up, kommende Spiele, Ergebnisse.
//
// Seit Phase 4E: MSV-Pflichtspiele aus 3. Liga (footballDataProvider,
// unverändert) UND DFB-Pokal (lib/spiele/dfbPokal.ts, komplett isolierte
// Pipeline) werden hier zu EINEM chronologischen Spielplan zusammengeführt
// (lib/spiele/aggregateSchedule.ts, reine Merge-/Sortierfunktion). Die
// 3.-Liga-Pipeline selbst — inkl. tableEngine/leagueContext/multiplex und
// /3-liga — bleibt davon vollständig unberührt: der Pokal-Adapter nutzt
// einen eigenen Fetch-Client (cupClient.ts) und wird ausschließlich hier
// aufgerufen, nirgendwo sonst.
export default async function SpielePage() {
  const [upcomingLeague, resultsLeague, cup] = await Promise.all([
    footballDataProvider.getUpcomingMsvMatches(6),
    footballDataProvider.getRecentMsvResults(6),
    getCupMsvMatches(6, 6),
  ]);

  const allUpcoming = mergeUpcoming(upcomingLeague, cup.upcoming);
  const allResults = mergeResults(resultsLeague, cup.results);

  const nextEntry = allUpcoming[0] ?? null;
  // "Kommende Spiele" zeigt bewusst nicht nochmal das Spiel aus der
  // Next-Match-Hero-Card.
  const upcomingRest = nextEntry ? allUpcoming.filter((e) => e.match.id !== nextEntry.match.id) : allUpcoming;

  return (
    <AppShell>
      <header className="mb-4">
        <p className="font-text text-xs uppercase tracking-wide text-zebra-mute">ZEBRA</p>
        <h1 className="font-display text-2xl font-bold uppercase tracking-wide text-zebra-ice">Spiele</h1>
      </header>

      <section className="mb-6">
        <SectionHeader title="Nächstes Spiel" />
        {nextEntry ? (
          <NextMatchCard
            match={nextEntry.match}
            isMockMode={IS_MOCK_MODE}
            competitionLabel={competitionLabel(nextEntry)}
          />
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
            {upcomingRest.map((entry) => (
              <UpcomingMatchRow key={entry.match.id} match={entry.match} competitionLabel={competitionLabel(entry)} />
            ))}
          </div>
        </section>
      )}

      <section className="mb-6">
        <SectionHeader title="Ergebnisse" />
        {allResults.length > 0 ? (
          <div className="flex flex-col gap-2">
            {allResults.map((entry) => (
              <ResultRow key={entry.match.id} match={entry.match} competitionLabel={competitionLabel(entry)} />
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
