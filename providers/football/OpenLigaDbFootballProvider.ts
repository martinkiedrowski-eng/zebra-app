import { FootballDataProvider, MatchdayResult } from "./FootballDataProvider";
import { Match, TeamRef } from "@/types/match";
import { TableEntry, FormMatch } from "@/types/table";
import { MatchAvailability } from "@/types/matchCenter";
import { FOOTBALL_CONFIG } from "@/config/football";
import { fetchMatchday, fetchTable, fetchCurrentGroupOrderId, fetchMatchById } from "./openligadb/client";
import { mapOldbMatch } from "./openligadb/mapMatch";
import { normalizeTeamId } from "./openligadb/teamIdMap";
import { computeTableFromMatches, TeamSeed } from "@/lib/tableEngine";
import { MSV_TEAM_ID } from "@/lib/constants";
import { OldbMatch } from "@/types/openligadb";

/**
 * Echte Datenstufe. Implementiert exakt dasselbe Interface wie
 * MockFootballProvider — kein UI-Code unterscheidet, welcher Provider
 * gerade aktiv ist (siehe providers/registry.ts).
 *
 * Methoden, die OpenLigaDB fachlich nicht sinnvoll füllen kann (z.B.
 * Personallage), geben bewusst leere/neutrale Werte zurück statt
 * erfundener Inhalte — siehe getMatchAvailability().
 */
export class OpenLigaDbFootballProvider implements FootballDataProvider {
  private async seasonMatches(): Promise<OldbMatch[]> {
    return fetchMatchday(); // kein group-Parameter -> ganze Saison
  }

  private teamRefsFromMatches(rawMatches: OldbMatch[]): Map<string, TeamRef> {
    const teams = new Map<string, TeamRef>();
    for (const m of rawMatches) {
      for (const t of [m.Team1, m.Team2]) {
        const id = normalizeTeamId(t);
        if (!teams.has(id)) {
          teams.set(id, {
            id,
            name: t.TeamName,
            shortName: t.ShortName || t.TeamName,
            crestUrl: t.TeamIconUrl ?? undefined,
          });
        }
      }
    }
    return teams;
  }

  async getNextMatch(): Promise<Match | null> {
    const raw = await this.seasonMatches();
    const now = Date.now();
    const upcoming = raw
      .filter((m) => !m.MatchIsFinished && new Date(m.MatchDateTimeUTC).getTime() > now)
      .filter((m) => normalizeTeamId(m.Team1) === MSV_TEAM_ID || normalizeTeamId(m.Team2) === MSV_TEAM_ID)
      .sort((a, b) => new Date(a.MatchDateTimeUTC).getTime() - new Date(b.MatchDateTimeUTC).getTime());
    return upcoming[0] ? mapOldbMatch(upcoming[0]) : null;
  }

  async getLastMatch(): Promise<Match | null> {
    const raw = await this.seasonMatches();
    const finished = raw
      .filter((m) => m.MatchIsFinished)
      .filter((m) => normalizeTeamId(m.Team1) === MSV_TEAM_ID || normalizeTeamId(m.Team2) === MSV_TEAM_ID)
      .sort((a, b) => new Date(b.MatchDateTimeUTC).getTime() - new Date(a.MatchDateTimeUTC).getTime());
    return finished[0] ? mapOldbMatch(finished[0]) : null;
  }

  async getLiveMatch(): Promise<Match | null> {
    const raw = await this.seasonMatches();
    const now = Date.now();
    const live = raw
      .filter((m) => !m.MatchIsFinished && new Date(m.MatchDateTimeUTC).getTime() <= now)
      .filter((m) => normalizeTeamId(m.Team1) === MSV_TEAM_ID || normalizeTeamId(m.Team2) === MSV_TEAM_ID);
    return live[0] ? mapOldbMatch(live[0]) : null;
  }

  async getMsvForm(count: number): Promise<FormMatch[]> {
    return this.getTeamForm(MSV_TEAM_ID, count);
  }

  async getTeamForm(teamId: string, count: number): Promise<FormMatch[]> {
    const raw = await this.seasonMatches();
    const finished = raw
      .filter((m) => m.MatchIsFinished)
      .filter((m) => normalizeTeamId(m.Team1) === teamId || normalizeTeamId(m.Team2) === teamId)
      .sort((a, b) => new Date(b.MatchDateTimeUTC).getTime() - new Date(a.MatchDateTimeUTC).getTime())
      .slice(0, count);

    return finished.map((m) => {
      const match = mapOldbMatch(m);
      const isHome = match.homeTeam.id === teamId;
      const own = isHome ? match.homeScore ?? 0 : match.awayScore ?? 0;
      const opp = isHome ? match.awayScore ?? 0 : match.homeScore ?? 0;
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
      return mapOldbMatch(raw);
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
    return raw.map((t, i) => ({
      position: i + 1,
      teamId: normalizeTeamId({ TeamId: t.TeamInfoId, TeamName: t.TeamName, ShortName: t.ShortName }),
      teamName: t.TeamName,
      teamShortName: t.ShortName || t.TeamName,
      played: t.Matches,
      wins: t.Won,
      draws: t.Draw,
      losses: t.Lost,
      goalsFor: t.Goals,
      goalsAgainst: t.OpponentGoals,
      points: t.Points,
      isMsv: normalizeTeamId({ TeamId: t.TeamInfoId, TeamName: t.TeamName, ShortName: t.ShortName }) === MSV_TEAM_ID,
    }));
  }

  async getCurrentMatchday(): Promise<MatchdayResult> {
    const [currentGroup, seasonRaw] = await Promise.all([fetchCurrentGroupOrderId(), this.seasonMatches()]);

    const currentMatchesRaw = seasonRaw.filter((m) => m.Group.GroupOrderID === currentGroup);
    const matches = currentMatchesRaw.map(mapOldbMatch);

    return { matchday: currentGroup, matches };
  }

  /**
   * WICHTIG: Diese Tabelle ist die Basis für computeLiveTable() und darf
   * die Ergebnisse des aktuellen Spieltags NICHT bereits enthalten — sonst
   * würden sie doppelt gezählt (siehe Aufgabenstellung Punkt 3). OpenLigaDB
   * liefert nur "die aktuelle Tabelle" (inkl. laufendem Spieltag) oder rohe
   * Spieldaten — deshalb wird die Baseline hier bewusst NICHT aus
   * getTable() abgeleitet, sondern aus allen Spielen VOR dem aktuellen
   * Spieltag mit computeTableFromMatches() rekonstruiert.
   */
  async getBaselineTable(): Promise<TableEntry[]> {
    const [currentGroup, seasonRaw] = await Promise.all([fetchCurrentGroupOrderId(), this.seasonMatches()]);

    const priorMatchesRaw = seasonRaw.filter((m) => m.Group.GroupOrderID < currentGroup);
    const priorMatches = priorMatchesRaw.map(mapOldbMatch);
    const teamRefs = Array.from(this.teamRefsFromMatches(seasonRaw).values());

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
