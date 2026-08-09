import { MatchStatus } from "@/types/match";
import { OldbMatch, RESULT_TYPE_HALFTIME } from "@/types/openligadb";

/**
 * OpenLigaDB liefert keinen expliziten scheduled/live/halftime/finished-
 * Status — nur `MatchIsFinished` (bool) plus `MatchResults`. Diese Funktion
 * ist die EINZIGE Stelle, die daraus unseren internen MatchStatus ableitet.
 *
 * Regeln (bewusst konservativ, siehe Aufgabenstellung Punkt 8):
 * - Anstoß liegt in der Zukunft, nicht beendet -> "scheduled"
 * - beendet (MatchIsFinished) -> "finished"
 * - Anstoß liegt in der Vergangenheit, nicht beendet, UND es existiert ein
 *   belastbarer Halbzeit-Ergebniseintrag (ResultTypeID === 1) OHNE
 *   Endergebnis -> "halftime". Das ist ein echter Datenpunkt, keine
 *   Schätzung nach der Uhr.
 * - Anstoß liegt in der Vergangenheit, nicht beendet, kein Halbzeit-Beleg
 *   -> "live" (generischer Live-Zustand, keine Minute vorgetäuscht)
 */
export function deriveMatchStatus(match: OldbMatch, now: Date = new Date()): MatchStatus {
  if (match.MatchIsFinished) return "finished";

  const kickoff = new Date(match.MatchDateTimeUTC || match.MatchDateTime);
  if (kickoff.getTime() > now.getTime()) return "scheduled";

  const hasHalftimeResult = match.MatchResults.some((r) => r.ResultTypeID === RESULT_TYPE_HALFTIME);
  const hasFinalResult = match.MatchResults.some((r) => r.ResultTypeID === 2);

  if (hasHalftimeResult && !hasFinalResult) return "halftime";

  return "live";
}
