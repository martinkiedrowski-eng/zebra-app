import { TableEntry } from "@/types/table";
import { Match } from "@/types/match";

/**
 * Reines Utility, keine Provider-Abhängigkeit. Nimmt die Tabelle VOR dem
 * aktuellen Spieltag plus die Spiele dieses Spieltags (in beliebigem
 * Zustand: scheduled/live/halftime/finished/postponed) und berechnet
 * daraus eine temporäre Live-Tabelle — scheduled und postponed fließen
 * nicht ein; live, halftime und finished zählen mit ihrem aktuellen bzw.
 * finalen Spielstand.
 *
 * Sortierung: Punkte -> Tordifferenz -> erzielte Tore -> stabile
 * Ausgangsreihenfolge (Index in der übergebenen Basistabelle) als letzter
 * Fallback bei vollständigem Gleichstand.
 *
 * Dieselbe Funktion wird von Home, Match Center und der 3.-Liga-Seite
 * verwendet — es gibt nur eine einzige Wahrheit für die Live-Position.
 */
export function computeLiveTable(baseline: TableEntry[], matchdayMatches: Match[]): TableEntry[] {
  const baseIndex = new Map(baseline.map((entry, i) => [entry.teamId, i]));
  const working = new Map<string, TableEntry>(baseline.map((entry) => [entry.teamId, { ...entry }]));

  for (const match of matchdayMatches) {
    const isCounted = match.status === "live" || match.status === "halftime" || match.status === "finished";
    if (!isCounted || match.homeScore === null || match.awayScore === null) continue;

    applyResult(working, match.homeTeam.id, match.homeScore, match.awayScore);
    applyResult(working, match.awayTeam.id, match.awayScore, match.homeScore);
  }

  const entries = Array.from(working.values());

  entries.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    const gdA = a.goalsFor - a.goalsAgainst;
    const gdB = b.goalsFor - b.goalsAgainst;
    if (gdB !== gdA) return gdB - gdA;
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
    // Stabiler Fallback: Ausgangsreihenfolge der Basistabelle
    return (baseIndex.get(a.teamId) ?? 0) - (baseIndex.get(b.teamId) ?? 0);
  });

  const promotionCount = baseline.filter((e) => e.zone === "promotion").length;
  const relegationCount = baseline.filter((e) => e.zone === "relegation").length;

  return entries.map((entry, i) => {
    const position = i + 1;
    let zone: TableEntry["zone"] = undefined;
    if (promotionCount > 0 && position <= promotionCount) zone = "promotion";
    else if (relegationCount > 0 && position > entries.length - relegationCount) zone = "relegation";
    return { ...entry, position, zone };
  });
}

function applyResult(
  working: Map<string, TableEntry>,
  teamId: string,
  goalsFor: number,
  goalsAgainst: number
) {
  const entry = working.get(teamId);
  if (!entry) return; // Team nicht Teil der (Demo-)Basistabelle

  const points = goalsFor > goalsAgainst ? 3 : goalsFor === goalsAgainst ? 1 : 0;

  working.set(teamId, {
    ...entry,
    played: entry.played + 1,
    wins: entry.wins + (goalsFor > goalsAgainst ? 1 : 0),
    draws: entry.draws + (goalsFor === goalsAgainst ? 1 : 0),
    losses: entry.losses + (goalsFor < goalsAgainst ? 1 : 0),
    goalsFor: entry.goalsFor + goalsFor,
    goalsAgainst: entry.goalsAgainst + goalsAgainst,
    points: entry.points + points,
  });
}

export interface TeamSeed {
  teamId: string;
  teamName: string;
  teamShortName: string;
  isMsv?: boolean;
}

/**
 * Rekonstruiert eine Tabelle AUSSCHLIESSLICH aus einer Liste konkreter
 * Spiele (typischerweise: alle Spiele VOR dem aktuellen Spieltag) — im
 * Gegensatz zu computeLiveTable, das von einer bereits existierenden
 * Basistabelle ausgeht. Wird gebraucht, wenn die Datenquelle selbst keine
 * "Tabelle vor Spieltag X" liefert (z.B. OpenLigaDB), sondern nur rohe
 * Spielergebnisse — damit ein Ergebnis nicht doppelt gezählt wird, wenn
 * anschließend computeLiveTable() für den aktuellen Spieltag angewendet
 * wird.
 *
 * Nur `finished`-Spiele fließen ein — ein "vor dem aktuellen Spieltag"
 * sollte es nie live/halftime geben, aber zur Sicherheit werden auch diese
 * ignoriert, falls doch (z.B. verschobene Nachholspiele).
 */
export function computeTableFromMatches(matches: Match[], teams: TeamSeed[]): TableEntry[] {
  const baseIndex = new Map(teams.map((t, i) => [t.teamId, i]));
  const working = new Map<string, TableEntry>(
    teams.map((t) => [
      t.teamId,
      {
        position: 0,
        teamId: t.teamId,
        teamName: t.teamName,
        teamShortName: t.teamShortName,
        played: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        points: 0,
        isMsv: !!t.isMsv,
      },
    ])
  );

  for (const match of matches) {
    if (match.status !== "finished") continue;
    if (match.homeScore === null || match.awayScore === null) continue;
    applyResult(working, match.homeTeam.id, match.homeScore, match.awayScore);
    applyResult(working, match.awayTeam.id, match.awayScore, match.homeScore);
  }

  const entries = Array.from(working.values());
  entries.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    const gdA = a.goalsFor - a.goalsAgainst;
    const gdB = b.goalsFor - b.goalsAgainst;
    if (gdB !== gdA) return gdB - gdA;
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
    return (baseIndex.get(a.teamId) ?? 0) - (baseIndex.get(b.teamId) ?? 0);
  });

  return entries.map((entry, i) => ({ ...entry, position: i + 1 }));
}

export interface TeamLiveContext {
  teamId: string;
  teamShortName: string;
  previousPosition: number;
  currentPosition: number;
  pointsToAbove: number | null; // Rückstand auf den Tabellennachbarn darüber
  pointsToBelow: number | null; // Vorsprung auf den Tabellennachbarn darunter
}

/**
 * Leitet aus Basistabelle + Live-Tabelle die Positionsverschiebung sowie
 * die Punktabstände zu den direkten Tabellennachbarn eines Teams ab.
 */
export function getTeamLiveContext(
  liveTable: TableEntry[],
  baselineTable: TableEntry[],
  teamId: string
): TeamLiveContext | null {
  const liveEntry = liveTable.find((e) => e.teamId === teamId);
  const baseEntry = baselineTable.find((e) => e.teamId === teamId);
  if (!liveEntry || !baseEntry) return null;

  const liveIndex = liveTable.findIndex((e) => e.teamId === teamId);
  const above = liveIndex > 0 ? liveTable[liveIndex - 1] : null;
  const below = liveIndex < liveTable.length - 1 ? liveTable[liveIndex + 1] : null;

  return {
    teamId,
    teamShortName: liveEntry.teamShortName,
    previousPosition: baseEntry.position,
    currentPosition: liveEntry.position,
    pointsToAbove: above ? above.points - liveEntry.points : null,
    pointsToBelow: below ? liveEntry.points - below.points : null,
  };
}
