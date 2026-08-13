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
 * "MSV"-Filter (Product Polish 2B.1): "lesenswerte News unmittelbar über
 * den MSV, ohne den separaten Video-Feed". Offizielle MSV-News
 * (sourceType "official") gehören immer dazu — die Quelle selbst ist
 * bereits MSV-spezifisch, kein Titel-Matching nötig dafür. liga3-online-
 * Items (sourceType "editorial") nur, wenn Titel/Teaser eindeutig
 * "MSV"/"Duisburg" enthalten. ZebraTV (sourceType "video") gehört jetzt
 * bewusst NICHT mehr dazu — hat mit "Videos" bereits einen eigenen,
 * klar getrennten Filter (vorher überschnitten sich "Alle" und "MSV"
 * dadurch fast vollständig, sobald ZebraTV/offizielle News den Großteil
 * des Feeds ausmachten).
 */
export function isMsvRelevant(item: NewsFeedItem): boolean {
  if (item.sourceType === "official") return true;
  if (item.sourceType === "video") return false;
  return textMentionsMsv(item);
}

export function filterNewsFeed(items: NewsFeedItem[], filter: NewsFilterId): NewsFeedItem[] {
  if (filter === "alle") return items;
  if (filter === "videos") return items.filter((i) => i.sourceType === "video");
  return items.filter(isMsvRelevant);
}
