export type NewsCategory =
  | "top"
  | "msv"
  | "transfers"
  | "verletzungen"
  | "spieltag"
  | "interviews"
  | "dritteliga";

export interface NewsItem {
  id: string;
  headline: string;
  teaser: string;
  source: string;
  sourceUrl: string;
  publishedAt: string; // ISO
  imageUrl?: string;
  category: NewsCategory;
  relatedPlayerIds?: string[];
}
