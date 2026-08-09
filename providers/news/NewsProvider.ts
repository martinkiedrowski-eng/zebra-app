import { NewsItem, NewsCategory } from "@/types/news";
import { RadarEvent } from "@/types/radar";
import { MatchContentItem } from "@/types/matchCenter";

export interface NewsProvider {
  getTopNews(count: number): Promise<NewsItem[]>;
  getNewsByCategory(category: NewsCategory, count: number): Promise<NewsItem[]>;
  getRadarEvents(count: number): Promise<RadarEvent[]>;

  // Match Center: Vorbericht, Pressekonferenz, Interview, Spielbericht, Highlights
  getMatchContent(matchId: string): Promise<MatchContentItem[]>;
}
