import { FootballDataProvider, MatchdayResult } from "./FootballDataProvider";
import { Match } from "@/types/match";
import { TableEntry, FormMatch } from "@/types/table";
import { MatchAvailability } from "@/types/matchCenter";
import { MSV_TEAM_ID } from "@/lib/constants";
import { MOCK_NEXT_MATCH, MOCK_LAST_MATCH } from "@/mock/matches";
import { MOCK_TABLE_EXCERPT, MOCK_MSV_FORM } from "@/mock/table";
import { MOCK_MATCH_PREVIEW, MOCK_AVAILABILITY, MOCK_OPPONENT_FORM } from "@/mock/matchCenter";
import { MOCK_BASELINE_TABLE, MOCK_MATCHDAY_SCHEDULED, MOCK_MATCHDAY_MATCHES, CURRENT_MATCHDAY } from "@/mock/league";

/**
 * Demo-Implementierung des FootballDataProvider.
 * Simuliert Netzwerklatenz, damit Loading-/Skeleton-States sich in der
 * Entwicklung realistisch verhalten. Wird 1:1 gegen einen echten Provider
 * (z.B. OpenLigaDbProvider) ausgetauscht — Komponenten merken davon nichts.
 */
export class MockFootballProvider implements FootballDataProvider {
  private async delay<T>(value: T, ms = 250): Promise<T> {
    await new Promise((resolve) => setTimeout(resolve, ms));
    return value;
  }

  async getNextMatch(): Promise<Match | null> {
    return this.delay(MOCK_NEXT_MATCH);
  }

  async getLastMatch(): Promise<Match | null> {
    return this.delay(MOCK_LAST_MATCH);
  }

  /** Mock kennt keine Season-Liste — liefert ehrlich nur das eine vorhandene Next-Match (0-1 Einträge). */
  async getUpcomingMsvMatches(count: number): Promise<Match[]> {
    return this.delay([MOCK_NEXT_MATCH].slice(0, count));
  }

  /** Mock kennt keine Season-Liste — liefert ehrlich nur das eine vorhandene Last-Match (0-1 Einträge). */
  async getRecentMsvResults(count: number): Promise<Match[]> {
    return this.delay([MOCK_LAST_MATCH].slice(0, count));
  }

  async getLiveMatch(): Promise<Match | null> {
    // In der ersten vertikalen Scheibe bewusst kein Live-Spiel im Mock,
    // damit Home im geforderten "Next Up"-Zustand gezeigt wird.
    return this.delay(null);
  }

  async getMsvForm(count: number): Promise<FormMatch[]> {
    return this.delay(MOCK_MSV_FORM.slice(0, count));
  }

  async getTableExcerpt(rangeAroundMsv: number): Promise<TableEntry[]> {
    void rangeAroundMsv; // Mock liefert bereits einen passenden Ausschnitt
    return this.delay(MOCK_TABLE_EXCERPT);
  }

  // --- Match Center -------------------------------------------------
  // Hinweis: Der Mock ignoriert bewusst die übergebene matchId und liefert
  // immer dieselbe Demo-Begegnung (MSV vs. Verl) zurück — Ziel dieser
  // Phase ist der vollständige UX-Flow, nicht matchId-genaue Auflösung.
  // Ein echter Provider löst hier tatsächlich nach matchId auf. Wichtig:
  // Die aufrufende Route selbst kennt keine feste Team-ID mehr — sie
  // verwendet ausschließlich match.homeTeam.id / match.awayTeam.id aus
  // dem Ergebnis dieses Aufrufs.

  async getMatchById(matchId: string): Promise<Match | null> {
    void matchId;
    return this.delay(MOCK_MATCH_PREVIEW);
  }

  async getTeamForm(teamId: string, count: number): Promise<FormMatch[]> {
    const source = teamId === MSV_TEAM_ID ? MOCK_MSV_FORM : MOCK_OPPONENT_FORM;
    return this.delay(source.slice(0, count));
  }

  async getTeamTableEntry(teamId: string): Promise<TableEntry | null> {
    // Sucht in der VOLLEN Basistabelle, nicht nur im Home-Ausschnitt —
    // damit funktioniert das auch für Gegner, die weiter von MSV entfernt
    // stehen.
    const entry = MOCK_BASELINE_TABLE.find((e) => e.teamId === teamId) ?? null;
    return this.delay(entry);
  }

  async getMatchAvailability(matchId: string): Promise<MatchAvailability> {
    void matchId;
    return this.delay(MOCK_AVAILABILITY);
  }

  // --- 3. Liga / Spieltag-Multiplex ---------------------------------

  async getTable(): Promise<TableEntry[]> {
    return this.delay(MOCK_BASELINE_TABLE);
  }

  async getBaselineTable(): Promise<TableEntry[]> {
    // Mock-Daten sind bereits als "vor dem aktuellen Spieltag" gepflegt —
    // identisch mit getTable(). Bei OpenLigaDB unterscheiden sich beide.
    return this.delay(MOCK_BASELINE_TABLE);
  }

  async getCurrentMatchday(): Promise<MatchdayResult> {
    // Kanonischer Provider-Stand: Spieltag noch nicht angepfiffen. Die
    // "Multiplex Live"-Variante mit laufenden Spielen wird von der
    // 3.-Liga-Seite als Dev-Zustand direkt aus mock/league.ts importiert
    // (gleiches Muster wie MOCK_LIVE_MATCH auf Home).
    return this.delay({ matchday: CURRENT_MATCHDAY, matches: MOCK_MATCHDAY_SCHEDULED });
  }

  /** Mock kennt nur einen Spieltag — liefert ihn bei passender Nummer, sonst ehrlich leer statt erfunden. */
  async getMatchday(matchday: number): Promise<MatchdayResult> {
    if (matchday === CURRENT_MATCHDAY) {
      return this.delay({ matchday, matches: MOCK_MATCHDAY_SCHEDULED });
    }
    return this.delay({ matchday, matches: [] });
  }

  /** Mock kennt nur einen Spieltag — Range kollabiert auf diesen einen Wert. */
  async getSeasonMatchdayRange(): Promise<{ min: number; max: number }> {
    return this.delay({ min: CURRENT_MATCHDAY, max: CURRENT_MATCHDAY });
  }

  /** V1.1 Stats-Tab: im Mock-Modus die einzige vorhandene Mock-Matchliste. */
  async getSeasonMatches(): Promise<Match[]> {
    return this.delay(MOCK_MATCHDAY_MATCHES);
  }
}
