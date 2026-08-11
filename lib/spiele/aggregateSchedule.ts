import { Match } from "@/types/match";

export type CompetitionType = "liga" | "pokal";

export interface ScheduleEntry {
  match: Match;
  competitionType: CompetitionType;
}

function kickoffMs(match: Match): number {
  const ms = new Date(match.kickoff).getTime();
  return Number.isFinite(ms) ? ms : 0;
}

function tag(matches: Match[], competitionType: CompetitionType): ScheduleEntry[] {
  return matches.map((match) => ({ match, competitionType }));
}

/**
 * Reine Merge-/Sortierfunktion — keine Provider-Logik, kein Fetch. Nimmt
 * die bereits geladenen Liga- und Pokal-Arrays entgegen und liefert einen
 * einzigen chronologischen MSV-Spielplan. Die Sortierung entsteht
 * ausschließlich aus match.kickoff, nie aus der Reihenfolge der Quellen.
 */
export function mergeUpcoming(leagueMatches: Match[], cupMatches: Match[]): ScheduleEntry[] {
  return [...tag(leagueMatches, "liga"), ...tag(cupMatches, "pokal")].sort(
    (a, b) => kickoffMs(a.match) - kickoffMs(b.match)
  );
}

export function mergeResults(leagueMatches: Match[], cupMatches: Match[]): ScheduleEntry[] {
  return [...tag(leagueMatches, "liga"), ...tag(cupMatches, "pokal")].sort(
    (a, b) => kickoffMs(b.match) - kickoffMs(a.match)
  );
}

/** "DFB-POKAL · 1. RUNDE" für Pokalspiele, `undefined` für Liga-Spiele (bestehende Darstellung bleibt unverändert). */
export function competitionLabel(entry: ScheduleEntry): string | undefined {
  if (entry.competitionType === "liga") return undefined;
  const label = entry.match.roundName ? `DFB-Pokal · ${entry.match.roundName}` : "DFB-Pokal";
  return label.toUpperCase();
}
