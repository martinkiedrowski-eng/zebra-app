import { NewsProvider } from "./NewsProvider";
import { NewsItem, NewsCategory } from "@/types/news";
import { RadarEvent } from "@/types/radar";
import { MatchContentItem } from "@/types/matchCenter";
import { footballDataProviderReal } from "../football/openligadbInstance";
import { MSV_TEAM_ID } from "@/lib/constants";

/**
 * Es gibt noch keinen echten News-/Content-Provider (RSS, YouTube API
 * etc.) — deshalb liefert dieser Provider im openligadb-Modus bewusst
 * KEINE Meldungen, statt die bisherigen Mock-News weiterzuverwenden. Das
 * würde erfundene "Trainer äußert sich…"-Texte als real ausgeben.
 *
 * Einzige Ausnahme: Zebra Radar zeigt echte Torereignisse des aktuellen
 * MSV-Spiels, sofern eines läuft — das sind echte Daten aus dem Football-
 * Provider, keine erfundenen News.
 */
export class OpenLigaDbNewsProvider implements NewsProvider {
  async getTopNews(count: number): Promise<NewsItem[]> {
    void count;
    return [];
  }

  async getNewsByCategory(category: NewsCategory, count: number): Promise<NewsItem[]> {
    void category;
    void count;
    return [];
  }

  async getRadarEvents(count: number): Promise<RadarEvent[]> {
    const liveMatch = await footballDataProviderReal.getLiveMatch();
    if (!liveMatch || !liveMatch.isMsvMatch) return [];

    return liveMatch.events
      .filter((e) => e.type === "goal")
      .slice(-count)
      .reverse()
      .map((goal) => {
        const scorerTeam = goal.team === "home" ? liveMatch.homeTeam : liveMatch.awayTeam;
        const isMsvGoal = scorerTeam.id === MSV_TEAM_ID;
        return {
          id: `radar-${goal.id}`,
          type: "goal",
          headline: isMsvGoal
            ? `Tor für den MSV: ${goal.player} (${goal.minute}')`
            : `Tor für ${scorerTeam.shortName}: ${goal.player} (${goal.minute}')`,
          timestamp: new Date().toISOString(),
          relevance: isMsvGoal ? "high" : "medium",
        } satisfies RadarEvent;
      });
  }

  async getMatchContent(matchId: string): Promise<MatchContentItem[]> {
    void matchId;
    // Kein echter Content-Provider (Vorbericht/PK/Interview/Highlights)
    // vorhanden — bewusst leer statt Mock-Inhalte im Real-Modus zu zeigen.
    return [];
  }
}
