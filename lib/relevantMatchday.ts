import { Match } from "@/types/match";
import { MatchdayResult } from "@/providers/football/FootballDataProvider";

function isFullyFinished(matches: Match[]): boolean {
  return matches.length > 0 && matches.every((m) => m.status === "finished");
}

/**
 * Regeln (Product Audit Batch 1B, Punkt 6):
 * 1. Ist der von OpenLigaDB gemeldete "aktuelle" Spieltag noch nicht
 *    vollständig abgeschlossen (mind. ein Spiel nicht "finished") -> diesen zeigen.
 * 2. Sonst schrittweise (max. 3 zusätzliche Abrufe) die folgenden
 *    Spieltage prüfen und den ersten noch nicht vollständig
 *    abgeschlossenen nehmen.
 * 3. Sind auch die geprüften Spieltage bereits abgeschlossen oder ist die
 *    Saisongrenze erreicht -> den zuletzt geprüften (= letzten
 *    verfügbaren) Spieltag zeigen.
 *
 * Bewusst defensiv-einfach: Es gibt keinen expliziten "ist gerade live"-
 * Status pro Spieltag in den vorhandenen Daten, nur pro Match — die
 * Fully-Finished-Prüfung ist die robusteste Ableitung daraus, ohne etwas
 * zu erfinden. Nutzt ausschließlich die bereits bestehende getMatchday()-
 * Methode (als Callback injiziert, damit diese Funktion eine reine,
 * providerunabhängige Utility bleibt) — keine neue Fetch-Architektur.
 */
export async function determineRelevantMatchday(
  current: MatchdayResult,
  range: { min: number; max: number },
  fetchMatchday: (matchday: number) => Promise<MatchdayResult>
): Promise<MatchdayResult> {
  if (!isFullyFinished(current.matches)) return current;

  let candidate = current;
  const MAX_LOOKAHEAD = 3;

  for (let i = 0; i < MAX_LOOKAHEAD; i++) {
    const next = candidate.matchday + 1;
    if (next > range.max) break;

    const nextResult = await fetchMatchday(next);
    if (!isFullyFinished(nextResult.matches)) return nextResult;
    candidate = nextResult;
  }

  return candidate;
}
