import { NewsFeedItem } from "@/types/newsFeed";

export type NewsFilterId = "alle" | "msv" | "videos";

/**
 * Case-insensitive Wortgrenzen-Suche nach "MSV" oder "Duisburg" — kein
 * zufälliges Teilstring-Matching (z.B. würde "xMSVy" nicht matchen).
 * Reine Textprüfung, keine KI-Klassifikation, keine neue API.
 */
const MSV_KEYWORD_PATTERN = /\b(msv|duisburg)\b/i;

function textMentionsMsv(item: NewsFeedItem): boolean {
  const haystack = `${item.title} ${item.teaser ?? ""}`;
  return MSV_KEYWORD_PATTERN.test(haystack);
}

/**
 * "MSV"-Filter: offizielle MSV-News (sourceType "official") und
 * ZebraTV/YouTube (sourceType "video") gehören immer dazu — die Quelle
 * selbst ist bereits MSV-spezifisch, kein Titel-Matching nötig dafür.
 * liga3-online-Items (sourceType "editorial") nur, wenn Titel/Teaser
 * eindeutig "MSV"/"Duisburg" enthalten.
 */
export function isMsvRelevant(item: NewsFeedItem): boolean {
  if (item.sourceType === "official" || item.sourceType === "video") return true;
  return textMentionsMsv(item);
}

export function filterNewsFeed(items: NewsFeedItem[], filter: NewsFilterId): NewsFeedItem[] {
  if (filter === "alle") return items;
  if (filter === "videos") return items.filter((i) => i.sourceType === "video");
  return items.filter(isMsvRelevant);
}
