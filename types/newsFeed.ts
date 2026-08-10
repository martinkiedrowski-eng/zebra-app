/**
 * Eigenständiges Datenmodell für den echten, aggregierten News Hub —
 * bewusst getrennt von types/news.ts (das bisherige NewsItem gehört zum
 * Mock-/Radar-/Match-Content-System und bleibt für dessen Zwecke
 * unverändert bestehen, siehe providers/news/*).
 */

export type NewsSourceType = "official" | "video" | "editorial";

export interface NewsFeedItem {
  id: string;
  title: string;
  url: string;
  /** ISO-String, falls die Quelle eines liefert; sonst der roh geparste Zeit-/Datumstext. Nie erfunden. */
  publishedAt: string;
  /** Menschenlesbarer Quellenname, z.B. "MSV Duisburg", "ZebraTV", "liga3-online.de". */
  source: string;
  sourceType: NewsSourceType;
  category: string | null;
  teaser: string | null;
  imageUrl: string | null;
}
