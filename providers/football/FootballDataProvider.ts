import { Match } from "@/types/match";
import { TableEntry, FormMatch } from "@/types/table";
import { MatchAvailability } from "@/types/matchCenter";

export interface MatchdayResult {
  matchday: number;
  matches: Match[];
}

/**
 * Vertrag für alle Fußball-Datenquellen (Mock, OpenLigaDB, später
 * kostenpflichtige Anbieter). UI-Komponenten dürfen ausschließlich gegen
 * dieses Interface programmieren, nie gegen eine konkrete Implementierung.
 *
 * Die eigentliche Live-Tabellen-BERECHNUNG ist bewusst keine Provider-
 * Methode, sondern das reine Utility lib/tableEngine.ts — der Provider
 * liefert nur die Rohdaten (Basistabelle + Spieltag-Spiele), auf denen
 * diese Berechnung aufsetzt.
 */
export interface FootballDataProvider {
  getNextMatch(): Promise<Match | null>;
  getLastMatch(): Promise<Match | null>;
  getLiveMatch(): Promise<Match | null>;
  getMsvForm(count: number): Promise<FormMatch[]>;
  getTableExcerpt(rangeAroundMsv: number): Promise<TableEntry[]>;

  // Match Center
  getMatchById(matchId: string): Promise<Match | null>;
  getTeamForm(teamId: string, count: number): Promise<FormMatch[]>;
  getTeamTableEntry(teamId: string): Promise<TableEntry | null>;
  getMatchAvailability(matchId: string): Promise<MatchAvailability>;
  /**
   * Für den Spiele-Tab (Phase 4A): mehrere künftige/vergangene MSV-Spiele
   * als Liste, chronologisch sortiert. Rein additiv — nutzt in beiden
   * Implementierungen ausschließlich bereits vorhandene interne
   * Datenquellen (dieselbe Season-/Match-Basis wie getNextMatch()/
   * getLastMatch()), keine neue Fetch- oder Mapping-Logik.
   */
  getUpcomingMsvMatches(count: number): Promise<Match[]>;
  getRecentMsvResults(count: number): Promise<Match[]>;

  // 3. Liga / Spieltag-Multiplex
  /** Aktuelle/reguläre Tabelle (kann bereits Ergebnisse des laufenden Spieltags enthalten). */
  getTable(): Promise<TableEntry[]>;
  /**
   * Tabelle VOR dem aktuellen Spieltag — die korrekte Eingabe für
   * lib/tableEngine.ts::computeLiveTable(), damit Ergebnisse des
   * aktuellen Spieltags nicht doppelt gezählt werden. Bei Mock-Daten
   * identisch mit einer separat gepflegten Basistabelle; bei OpenLigaDB
   * aus den Einzelspielen vor dem aktuellen Spieltag rekonstruiert.
   */
  getBaselineTable(): Promise<TableEntry[]>;
  getCurrentMatchday(): Promise<MatchdayResult>;
  /**
   * Für die Spieltagsnavigation auf der 3.-Liga-Seite (Polish-Pass).
   * Rein additiv, gleiches Muster wie getCurrentMatchday(): nutzt in
   * OpenLigaDbFootballProvider ausschließlich die bereits vorhandene
   * private Season-Match-Quelle, kein neuer Fetch, kein neues Mapping.
   */
  getMatchday(matchday: number): Promise<MatchdayResult>;
  getSeasonMatchdayRange(): Promise<{ min: number; max: number }>;
  /**
   * V1.1 Stats-Tab: alle Saisonspiele (inkl. Ergebnisse bereits
   * abgeschlossener Spiele) für Heim-/Auswärts- und Liga-Check-
   * Berechnungen in lib/leagueStats.ts. Rein additiv, identisches Muster
   * wie getMatchday()/getCurrentMatchday(): nutzt in
   * OpenLigaDbFootballProvider ausschließlich die bereits vorhandene
   * private seasonMatches()-Quelle, kein neuer Fetch, kein neues Mapping.
   */
  getSeasonMatches(): Promise<Match[]>;
}
