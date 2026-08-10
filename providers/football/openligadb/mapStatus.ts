import { MatchStatus } from "@/types/match";
import { RawMatchFields, RawResult } from "./mapMatch";

/**
 * OpenLigaDB liefert keinen expliziten scheduled/live/halftime/finished-
 * Status — nur ein "ist beendet"-Flag plus Ergebniseinträge. Diese
 * Funktion ist die EINZIGE Stelle, die daraus unseren internen
 * MatchStatus ableitet, und arbeitet auf den bereits defensiv
 * extrahierten RawMatchFields (siehe mapMatch.ts), nicht auf rohem JSON.
 *
 * Regeln (bewusst konservativ):
 * - Anstoß liegt in der Zukunft, nicht beendet -> "scheduled"
 * - beendet -> "finished"
 * - Anstoß liegt in der Vergangenheit, nicht beendet, UND es existiert ein
 *   belastbarer Halbzeit-Ergebniseintrag OHNE Endergebnis -> "halftime".
 *   Das ist ein echter Datenpunkt, keine Schätzung nach der Uhr.
 * - sonst -> "live" (generischer Live-Zustand, keine Minute vorgetäuscht)
 */
export function deriveMatchStatus(
  fields: RawMatchFields,
  results: RawResult[],
  now: Date = new Date()
): MatchStatus {
  if (fields.isFinished) return "finished";

  const kickoff = new Date(fields.kickoffUtc || fields.kickoff);
  if (Number.isFinite(kickoff.getTime()) && kickoff.getTime() > now.getTime()) return "scheduled";

  const hasHalftimeResult = results.some((r) => r.resultTypeId === 1);
  const hasFinalResult = results.some((r) => r.resultTypeId === 2);

  if (hasHalftimeResult && !hasFinalResult) return "halftime";

  return "live";
}
