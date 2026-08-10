import { FootballDataProvider, MatchdayResult } from "./FootballDataProvider";
import { Match, TeamRef } from "@/types/match";
import { TableEntry, FormMatch } from "@/types/table";
import { MatchAvailability } from "@/types/matchCenter";
import { FOOTBALL_CONFIG } from "@/config/football";
import { fetchMatchday, fetchTable, fetchCurrentGroupOrderId, fetchMatchById } from "./openligadb/client";
import { mapOldbMatch, extractTeam } from "./openligadb/mapMatch";
import { mapOldbTableEntry } from "./openligadb/mapTable";
import { computeTableFromMatches, TeamSeed } from "@/lib/tableEngine";
import { MSV_TEAM_ID } from "@/lib/constants";
import { isRawObject } from "./openligadb/safe";

/**
 * Echte Datenstufe. Implementiert exakt dasselbe Interface wie
 * MockFootballProvider — kein UI-Code unterscheidet, welcher Provider
 * gerade aktiv ist (siehe providers/registry.ts).
 *
 * Arbeitet durchgängig defensiv: fetchMatchday()/fetchTable() liefern
 * `unknown[]`, jedes einzelne Element geht durch mapOldbMatch()/
 * mapOldbTableEntry() (siehe providers/football/openligadb/{mapMatch,
 * mapTable}.ts), die mehrere plausible Feldnamen probieren und nie NaN
 * oder leere Pflichtfelder ohne Fallback durchlassen — siehe
 * providers/football/openligadb/safe.ts.
 *
 * Methoden, die OpenLigaDB fachlich nicht sinnvoll füllen kann (z.B.
 * Personallage), geben bewusst leere/neutrale Werte zurück statt
 * erfundener Inhalte — siehe getMatchAvailability().
 */
export class OpenLigaDbFootballProvider implements FootballDataProvider {
  private async seasonMatchesRaw(): Promise<unknown[]> {
    return fetchMatchday(); // kein group-Parameter -> ganze Saison
  }

  private async seasonMatches(): Promise<Match[]> {
    const raw = await this.seasonMatchesRaw();
    return raw.map(mapOldbMatch);
  }

  private teamRefsFromRawMatches(rawMatches: unknown[]): Map<string, TeamRef> {
    const teams = new Map<string, TeamRef>();
    for (const raw of rawMatches) {
      if (!isRawObject(raw)) continue;
      for (const key of ["Team1", "team1", "Team2", "team2"]) {
        if (!(key in raw)) continue;
        const ref = extractTeam(raw[key], key.toLowerCase().includes("1") ? "Heim" : "Auswärts");
        if (!teams.has(ref.id)) teams.set(ref.id, ref);
      }
    }
    return teams;
  }

  async getNextMatch(): Promise<Match | null> {
    const matches = await this.seasonMatches();
    const now = Date.now();
    const upcoming = matches
      .filter((m) => m.status === "scheduled" && new Date(m.kickoff).getTime() > now)
      .filter((m) => m.isMsvMatch)
      .sort((a, b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime());
    return upcoming[0] ?? null;
  }

  async getLastMatch(): Promise<Match | null> {
    const matches = await this.seasonMatches();
    const finished = matches
      .filter((m) => m.status === "finished" && m.isMsvMatch)
      .sort((a, b) => new Date(b.kickoff).getTime() - new Date(a.kickoff).getTime());
    return finished[0] ?? null;
  }

  /** Phase 4A / Spiele-Tab: identisches Filtermuster wie getNextMatch(), nur als Liste statt Einzelspiel. */
  async getUpcomingMsvMatches(count: number): Promise<Match[]> {
    const matches = await this.seasonMatches();
    const now = Date.now();
    return matches
      .filter((m) => m.status === "scheduled" && m.isMsvMatch && new Date(m.kickoff).getTime() > now)
      .sort((a, b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime())
      .slice(0, count);
  }

  /** Phase 4A / Spiele-Tab: identisches Filtermuster wie getLastMatch(), nur als Liste statt Einzelspiel. */
  async getRecentMsvResults(count: number): Promise<Match[]> {
    const matches = await this.seasonMatches();
    return matches
      .filter((m) => m.status === "finished" && m.isMsvMatch)
      .sort((a, b) => new Date(b.kickoff).getTime() - new Date(a.kickoff).getTime())
      .slice(0, count);
  }

  async getLiveMatch(): Promise<Match | null> {
    const matches = await this.seasonMatches();
    const live = matches.filter((m) => (m.status === "live" || m.status === "halftime") && m.isMsvMatch);
    return live[0] ?? null;
  }

  async getMsvForm(count: number): Promise<FormMatch[]> {
    return this.getTeamForm(MSV_TEAM_ID, count);
  }

  async getTeamForm(teamId: string, count: number): Promise<FormMatch[]> {
    const matches = await this.seasonMatches();
    const finished = matches
      .filter((m) => m.status === "finished")
      .filter((m) => m.homeTeam.id === teamId || m.awayTeam.id === teamId)
      .sort((a, b) => new Date(b.kickoff).getTime() - new Date(a.kickoff).getTime())
      .slice(0, count);

    return finished
      .filter((m) => m.homeScore !== null && m.awayScore !== null)
      .map((match) => {
        const isHome = match.homeTeam.id === teamId;
        const own = (isHome ? match.homeScore : match.awayScore) ?? 0;
        const opp = (isHome ? match.awayScore : match.homeScore) ?? 0;
        const result = own > opp ? "win" : own < opp ? "loss" : "draw";
        const opponent = isHome ? match.awayTeam : match.homeTeam;
        return {
          matchId: match.id,
          opponentShortName: opponent.shortName,
          result,
          scoreLabel: `${own}:${opp}`,
          home: isHome,
        } satisfies FormMatch;
      });
  }

  async getTableExcerpt(rangeAroundMsv: number): Promise<TableEntry[]> {
    const table = await this.getTable();
    const msvIndex = table.findIndex((e) => e.teamId === MSV_TEAM_ID);
    if (msvIndex === -1) return table.slice(0, rangeAroundMsv * 2 + 1);
    return table.slice(Math.max(0, msvIndex - rangeAroundMsv), msvIndex + rangeAroundMsv + 1);
  }

  async getMatchById(matchId: string): Promise<Match | null> {
    try {
      const raw = await fetchMatchById(matchId);
      const match = mapOldbMatch(raw);
      return match.id === "unknown" ? null : match;
    } catch {
      return null;
    }
  }

  async getTeamTableEntry(teamId: string): Promise<TableEntry | null> {
    const table = await this.getTable();
    return table.find((e) => e.teamId === teamId) ?? null;
  }

  async getMatchAvailability(matchId: string): Promise<MatchAvailability> {
    void matchId;
    // OpenLigaDB liefert keine Kader-/Personallage-Daten. Bewusst leer
    // statt erfunden — die UI blendet den Bereich dadurch aus.
    return { out: [], doubtful: [], returning: [] };
  }

  async getTable(): Promise<TableEntry[]> {
    const raw = await fetchTable();
    return raw.map((entry, i) => mapOldbTableEntry(entry, i + 1));
  }

  async getCurrentMatchday(): Promise<MatchdayResult> {
    const [currentGroup, seasonRaw] = await Promise.all([fetchCurrentGroupOrderId(), this.seasonMatchesRaw()]);
    const matches = seasonRaw.map(mapOldbMatch).filter((m) => m.matchday === currentGroup);
    return { matchday: currentGroup, matches };
  }

  /**
   * WICHTIG: Diese Tabelle ist die Basis für computeLiveTable() und darf
   * die Ergebnisse des aktuellen Spieltags NICHT bereits enthalten — sonst
   * würden sie doppelt gezählt. OpenLigaDB liefert nur "die aktuelle
   * Tabelle" (inkl. laufendem Spieltag) oder rohe Spieldaten — deshalb
   * wird die Baseline hier bewusst NICHT aus getTable() abgeleitet,
   * sondern aus allen Spielen VOR dem aktuellen Spieltag mit
   * computeTableFromMatches() rekonstruiert.
   */
  async getBaselineTable(): Promise<TableEntry[]> {
    const [currentGroup, seasonRaw] = await Promise.all([fetchCurrentGroupOrderId(), this.seasonMatchesRaw()]);

    const priorMatches = seasonRaw.map(mapOldbMatch).filter((m) => m.matchday < currentGroup);
    const teamRefs = Array.from(this.teamRefsFromRawMatches(seasonRaw).values());

    const seeds: TeamSeed[] = teamRefs.map((t) => ({
      teamId: t.id,
      teamName: t.name,
      teamShortName: t.shortName,
      isMsv: t.id === MSV_TEAM_ID,
    }));

    return computeTableFromMatches(priorMatches, seeds).map((entry) => {
      let zone: TableEntry["zone"] = undefined;
      if (entry.position <= FOOTBALL_CONFIG.promotionSpots) zone = "promotion";
      else if (entry.position > seeds.length - FOOTBALL_CONFIG.relegationSpots) zone = "relegation";
      return { ...entry, zone };
    });
  }
}
