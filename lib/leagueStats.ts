import { Match } from "@/types/match";
import { TableEntry } from "@/types/table";

/**
 * V1.1 Stats-Tab. Bewusst als reine, isolierte Utilities getrennt von
 * tableEngine.ts — konsumieren dessen fertige TableEntry-Ergebnisse bzw.
 * bereits vorhandene Match-Listen, berechnen aber selbst KEINE
 * Live-Tabelle neu. Keine Ableitung aus Kickoff-Zeit, keine Prognosen.
 */

export interface MsvSeasonCheck {
  position: number;
  points: number;
  goalDiff: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  /** null bei 0 Spielen — bewusst keine erfundene 0,0-Angabe. */
  goalsPerGame: number | null;
  concededPerGame: number | null;
  pointsQuotaPercent: number | null;
}

export function computeMsvSeasonCheck(entry: TableEntry): MsvSeasonCheck {
  const played = entry.played;
  const maxPoints = played * 3;
  return {
    position: entry.position,
    points: entry.points,
    goalDiff: entry.goalsFor - entry.goalsAgainst,
    wins: entry.wins,
    draws: entry.draws,
    losses: entry.losses,
    goalsFor: entry.goalsFor,
    goalsAgainst: entry.goalsAgainst,
    goalsPerGame: played > 0 ? entry.goalsFor / played : null,
    concededPerGame: played > 0 ? entry.goalsAgainst / played : null,
    pointsQuotaPercent: maxPoints > 0 ? Math.round((entry.points / maxPoints) * 100) : null,
  };
}

export interface VenueSplit {
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
}

function emptySplit(): VenueSplit {
  return { played: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, points: 0 };
}

function applyResult(split: VenueSplit, gf: number, ga: number): void {
  split.played += 1;
  split.goalsFor += gf;
  split.goalsAgainst += ga;
  if (gf > ga) {
    split.wins += 1;
    split.points += 3;
  } else if (gf === ga) {
    split.draws += 1;
    split.points += 1;
  } else {
    split.losses += 1;
  }
}

/**
 * Heim-/Auswärtsbilanz EINES Teams — Zuordnung ausschließlich anhand der
 * tatsächlichen home/away-Position im jeweiligen Match, keine Annahme aus
 * Reihenfolge o.ä. Nur abgeschlossene Spiele mit vorhandenem Ergebnis.
 */
export function computeHomeAwaySplit(matches: Match[], teamId: string): { home: VenueSplit; away: VenueSplit } {
  const home = emptySplit();
  const away = emptySplit();

  for (const m of matches) {
    if (m.status !== "finished" || m.homeScore === null || m.awayScore === null) continue;
    if (m.homeTeam.id === teamId) {
      applyResult(home, m.homeScore, m.awayScore);
    } else if (m.awayTeam.id === teamId) {
      applyResult(away, m.awayScore, m.homeScore);
    }
  }

  return { home, away };
}

export interface VenueTableEntry extends VenueSplit {
  teamId: string;
}

function buildVenueTable(matches: Match[], venue: "home" | "away"): VenueTableEntry[] {
  const map = new Map<string, VenueTableEntry>();
  for (const m of matches) {
    if (m.status !== "finished" || m.homeScore === null || m.awayScore === null) continue;
    const team = venue === "home" ? m.homeTeam : m.awayTeam;
    const gf = venue === "home" ? m.homeScore : m.awayScore;
    const ga = venue === "home" ? m.awayScore : m.homeScore;
    const existing = map.get(team.id) ?? { teamId: team.id, ...emptySplit() };
    applyResult(existing, gf, ga);
    map.set(team.id, existing);
  }
  return Array.from(map.values());
}

/**
 * Heim-/Auswärtstabelle für ALLE Teams — nur wenn wirklich jedes
 * (bekannte) Team mindestens ein Spiel in dieser Spielortkategorie
 * absolviert hat. Sonst `null`: ein Ranking auf Basis sehr
 * unterschiedlicher Stichprobengrößen (z.B. Team A schon 2 Heimspiele,
 * Team B noch 0) wäre irreführend — lieber kein Ranking als ein
 * unvollständiges. Selbstheilend: aktiviert sich automatisch, sobald der
 * Spieltagsverlauf das hergibt, ohne künftige Codeänderung.
 */
export function computeHomeAwayTable(
  matches: Match[],
  venue: "home" | "away",
  allTeamIds: string[]
): VenueTableEntry[] | null {
  const entries = buildVenueTable(matches, venue);
  const hasGapForAnyTeam = allTeamIds.some((id) => !entries.some((e) => e.teamId === id));
  if (hasGapForAnyTeam) return null;

  return [...entries].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    const diffA = a.goalsFor - a.goalsAgainst;
    const diffB = b.goalsFor - b.goalsAgainst;
    if (diffB !== diffA) return diffB - diffA;
    return b.goalsFor - a.goalsFor;
  });
}

export interface LeagueCheckResult {
  goalsForRank: number;
  goalsAgainstRank: number;
  goalDiffRank: number;
  /** null, wenn computeHomeAwayTable() für diese Kategorie null lieferte. */
  homeRank: number | null;
  awayRank: number | null;
}

/** Bei Gegentoren gilt: weniger = besseres Ranking (aufsteigend sortiert). */
export function computeLeagueCheck(
  table: TableEntry[],
  msvTeamId: string,
  homeTable: VenueTableEntry[] | null,
  awayTable: VenueTableEntry[] | null
): LeagueCheckResult | null {
  const msv = table.find((e) => e.teamId === msvTeamId);
  if (!msv) return null;

  const byGoalsFor = [...table].sort((a, b) => b.goalsFor - a.goalsFor);
  const byGoalsAgainst = [...table].sort((a, b) => a.goalsAgainst - b.goalsAgainst);
  const byGoalDiff = [...table].sort(
    (a, b) => b.goalsFor - b.goalsAgainst - (a.goalsFor - a.goalsAgainst)
  );

  const rankOf = (arr: TableEntry[]) => arr.findIndex((e) => e.teamId === msvTeamId) + 1;
  const venueRankOf = (arr: VenueTableEntry[] | null) => {
    if (!arr) return null;
    const idx = arr.findIndex((e) => e.teamId === msvTeamId);
    return idx >= 0 ? idx + 1 : null;
  };

  return {
    goalsForRank: rankOf(byGoalsFor),
    goalsAgainstRank: rankOf(byGoalsAgainst),
    goalDiffRank: rankOf(byGoalDiff),
    homeRank: venueRankOf(homeTable),
    awayRank: venueRankOf(awayTable),
  };
}

/** "3,5" statt "3.5" — deutsche Dezimaldarstellung, eine Nachkommastelle. */
export function formatDe1(value: number): string {
  return value.toFixed(1).replace(".", ",");
}
