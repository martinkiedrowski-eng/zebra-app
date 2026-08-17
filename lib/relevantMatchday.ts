import { Match } from "@/types/match";
import { MatchdayResult } from "@/providers/football/FootballDataProvider";

const FORTYEIGHT_HOURS_MS = 48 * 60 * 60 * 1000;

function isFullyFinished(matches: Match[]): boolean {
  return matches.length > 0 && matches.every((m) => m.status === "finished");
}

function isNotYetStarted(matches: Match[]): boolean {
  return matches.length > 0 && matches.every((m) => m.status === "scheduled");
}

/** Frühester echter Kickoff-Zeitpunkt eines Spieltags, `null` wenn kein valider Termin vorhanden. */
function firstKickoffMs(matches: Match[]): number | null {
  const times = matches
    .map((m) => new Date(m.kickoff).getTime())
    .filter((t) => Number.isFinite(t));
  return times.length > 0 ? Math.min(...times) : null;
}

/**
 * Ist ein noch nicht gestarteter Spieltag mehr als 48h entfernt? `false`
 * (= "nicht zu weit weg, zeig ihn") wenn kein valider Kickoff bekannt ist
 * — dann lieber nicht künstlich zurückhalten, es gibt schlicht nichts,
 * wovon man "zu weit weg" behaupten könnte.
 */
function isMoreThan48hAway(matches: Match[], now: Date): boolean {
  const kickoff = firstKickoffMs(matches);
  if (kickoff === null) return false;
  return kickoff - now.getTime() > FORTYEIGHT_HOURS_MS;
}

/**
 * Regeln (Product Audit Batch 1B + Polish Sprint 01, Punkt 3):
 *
 * 1. Ist der von OpenLigaDB gemeldete "aktuelle" Spieltag noch nicht
 *    vollständig abgeschlossen:
 *    a) Hat er noch gar nicht begonnen (alle Spiele "scheduled") UND
 *       liegt der erste Kickoff mehr als 48h in der Zukunft -> lieber
 *       den zuletzt abgeschlossenen Spieltag zeigen (nicht zu früh
 *       springen). Gibt es keinen vorherigen abgeschlossenen Spieltag
 *       (Saisonbeginn), bleibt es beim aktuellen.
 *    b) Sonst (läuft bereits / beginnt in <48h) -> diesen zeigen.
 * 2. Ist er vollständig abgeschlossen: schrittweise (max. 3 zusätzliche
 *    Abrufe) den nächsten noch nicht abgeschlossenen Spieltag suchen —
 *    aber auch dabei erst zeigen, wenn dessen erster Kickoff < 48h
 *    entfernt ist, sonst beim zuletzt abgeschlossenen bleiben.
 * 3. Ist die Saisongrenze erreicht -> den letzten verfügbaren Spieltag
 *    zeigen.
 *
 * Bewusst defensiv-einfach: kein expliziter "ist gerade live"-Status pro
 * Spieltag in den vorhandenen Daten, nur pro Match — Fully-
 * Finished/Not-Yet-Started-Prüfung plus echter Kickoff-Zeitpunkt sind die
 * robusteste Ableitung daraus, ohne etwas zu erfinden. Nutzt
 * ausschließlich die bereits bestehende getMatchday()-Methode (als
 * Callback injiziert) — keine neue Fetch-Architektur. `now` als Parameter
 * für Testbarkeit, Standard: echte aktuelle Zeit.
 */
export async function determineRelevantMatchday(
  current: MatchdayResult,
  range: { min: number; max: number },
  fetchMatchday: (matchday: number) => Promise<MatchdayResult>,
  now: Date = new Date()
): Promise<MatchdayResult> {
  if (!isFullyFinished(current.matches)) {
    if (isNotYetStarted(current.matches) && isMoreThan48hAway(current.matches, now)) {
      const prev = current.matchday - 1;
      if (prev >= range.min) {
        const prevResult = await fetchMatchday(prev);
        if (isFullyFinished(prevResult.matches)) return prevResult;
      }
    }
    return current;
  }

  let candidate = current;
  const MAX_LOOKAHEAD = 3;

  for (let i = 0; i < MAX_LOOKAHEAD; i++) {
    const next = candidate.matchday + 1;
    if (next > range.max) break;

    const nextResult = await fetchMatchday(next);
    if (!isFullyFinished(nextResult.matches)) {
      if (isNotYetStarted(nextResult.matches) && isMoreThan48hAway(nextResult.matches, now)) {
        return candidate; // noch zu weit weg — beim zuletzt abgeschlossenen bleiben
      }
      return nextResult;
    }
    candidate = nextResult;
  }

  return candidate;
}
