import { NewsProvider } from "./NewsProvider";
import { NewsItem, NewsCategory } from "@/types/news";
import { RadarEvent } from "@/types/radar";
import { MatchContentItem } from "@/types/matchCenter";
import { MOCK_NEWS } from "@/mock/news";
import { MOCK_RADAR_EVENTS } from "@/mock/radar";
import { MOCK_MATCH_CONTENT } from "@/mock/matchCenter";

export class MockNewsProvider implements NewsProvider {
  private async delay<T>(value: T, ms = 250): Promise<T> {
    await new Promise((resolve) => setTimeout(resolve, ms));
    return value;
  }

  async getTopNews(count: number): Promise<NewsItem[]> {
    return this.delay(MOCK_NEWS.slice(0, count));
  }

  async getNewsByCategory(category: NewsCategory, count: number): Promise<NewsItem[]> {
    return this.delay(MOCK_NEWS.filter((n) => n.category === category).slice(0, count));
  }

  async getRadarEvents(count: number): Promise<RadarEvent[]> {
    return this.delay(MOCK_RADAR_EVENTS.slice(0, count));
  }

  async getMatchContent(matchId: string): Promise<MatchContentItem[]> {
    void matchId; // Mock liefert unabhängig von der matchId dieselbe Demo-Auswahl
    return this.delay(MOCK_MATCH_CONTENT);
  }
}
