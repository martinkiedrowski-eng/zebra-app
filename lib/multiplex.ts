import { Match } from "@/types/match";
import { TableEntry } from "@/types/table";
import { MSV_TEAM_ID } from "./constants";

/**
 * Warum ein Spiel im Multiplex als für den MSV relevant markiert ist.
 * Aktuell nur ein grober Grund (Tabellennachbarschaft); die Union ist
 * bewusst so angelegt, dass spätere, konkretere Gründe (z.B. "1 Punkt vor
 * MSV", "direkter Konkurrent um Platz X", "Ergebnis hilft Duisburg") ohne
 * Strukturänderung ergänzt werden können — nur RELEVANCE_LABEL und die
 * Zuordnung in prioritizeMultiplex müssten wachsen.
 */
export type MultiplexRelevanceReason = "tabellennachbar";

const RELEVANCE_LABEL: Record<MultiplexRelevanceReason, string> = {
  tabellennachbar: "Tabellennachbar",
};

export function getRelevanceLabel(reason: MultiplexRelevanceReason | null): string | null {
  return reason ? RELEVANCE_LABEL[reason] : null;
}

export interface MultiplexEntry {
  match: Match;
  relevanceReason: MultiplexRelevanceReason | null;
}

const NEIGHBOR_RANGE = 2;

/**
 * Sortiert laufende Spiele aus Fan-Sicht statt neutral: zuerst das eigene
 * Spiel, danach Teams in unmittelbarer Tabellennähe des MSV, danach der
 * Rest (stabil nach Ausgangsreihenfolge).
 */
export function prioritizeMultiplex(matches: Match[], baselineTable: TableEntry[]): MultiplexEntry[] {
  const msvIndex = baselineTable.findIndex((e) => e.teamId === MSV_TEAM_ID);
  const neighborIds = new Set(
    baselineTable
      .slice(Math.max(0, msvIndex - NEIGHBOR_RANGE), msvIndex + NEIGHBOR_RANGE + 1)
      .map((e) => e.teamId)
  );

  function score(match: Match): number {
    if (match.isMsvMatch) return 0;
    const touchesNeighbor = neighborIds.has(match.homeTeam.id) || neighborIds.has(match.awayTeam.id);
    return touchesNeighbor ? 1 : 2;
  }

  return matches
    // Bugfix: halftime gehört ebenso zu "läuft gerade" wie live.
    .filter((m) => m.status === "live" || m.status === "halftime")
    .map((match) => {
      const isNeighbor =
        !match.isMsvMatch && (neighborIds.has(match.homeTeam.id) || neighborIds.has(match.awayTeam.id));
      return {
        match,
        relevanceReason: isNeighbor ? ("tabellennachbar" as const) : null,
      };
    })
    .sort((a, b) => score(a.match) - score(b.match));
}
