import { Match } from "@/types/match";

/**
 * Zentrale Score-Darstellung, EINE Wahrheit statt mehrfacher ad-hoc
 * `match.homeScore ?? "–"`-Stellen im Code:
 *
 * - scheduled: kein Score (wird andernorts als Uhrzeit dargestellt)
 * - live/halftime ohne vorhandenes Result-Objekt (OpenLigaDB liefert das
 *   kurz nach Anpfiff manchmal verzögert): "0:0" statt der verwirrenden
 *   Darstellung ":" — das Spiel läuft nachweislich, 0:0 ist der einzige
 *   ehrliche Stand, den man ohne Gegenteil-Beweis annehmen darf.
 * - finished ohne Score (defensiver Edge Case, sollte nicht vorkommen):
 *   ebenfalls "0:0" statt ":", aus demselben Grund.
 */
export function displayScore(match: Match): { home: string; away: string } {
  if (match.status === "scheduled") return { home: "", away: "" };

  return {
    home: String(match.homeScore ?? 0),
    away: String(match.awayScore ?? 0),
  };
}

/**
 * Kompaktes "2:4 (1:0)"-Format für abgeschlossene Spiele mit bekanntem
 * Halbzeitstand — nur wenn `status === "finished"` UND ein Halbzeitstand
 * tatsächlich vorhanden ist (siehe Vorgabe: während LIVE keine
 * Halbzeitinformation erzwingen, MatchResults kann dort verzögert/
 * inkonsistent sein). Gibt sonst nur den Endstand zurück.
 */
export function formatFinishedScoreLine(match: Match): string {
  const score = displayScore(match);
  if (match.status === "finished" && match.halftimeScore) {
    return `${score.home}:${score.away} (${match.halftimeScore.home}:${match.halftimeScore.away})`;
  }
  return `${score.home}:${score.away}`;
}
