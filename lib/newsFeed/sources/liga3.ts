import { NewsFeedItem } from "@/types/newsFeed";
import { fetchWithTimeout } from "../fetchUtils";
import { splitBlocks, extractTagText, extractAttr, isLikelyXml, decodeEntities, stripCdataAndTags } from "../xmlUtils";

// Exakt dieselben zwei Kandidaten-URLs, die im Content-Source-Probe live
// getestet wurden (einer davon lieferte HTTP 200 + 15 Items) — keine
// neuen/zusätzlichen Endpunkte werden ausprobiert.
const CANDIDATE_URLS = [
  "https://www.liga3-online.de/category/msv-duisburg/feed/",
  "https://www.liga3-online.de/category/vereine-3-liga/msv-duisburg/feed/",
];

export async function fetchLiga3News(): Promise<NewsFeedItem[]> {
  for (const url of CANDIDATE_URLS) {
    const res = await fetchWithTimeout(url);
    if (!res || !isLikelyXml(res.text)) continue;

    const rawItems = splitBlocks(res.text, "item");
    if (rawItems.length === 0) continue;

    const items: NewsFeedItem[] = [];
    for (const item of rawItems) {
      try {
        const title = decodeEntities(extractTagText(item, "title"));
        const link = extractTagText(item, "link");
        const pubDate = extractTagText(item, "pubDate");
        const description = decodeEntities(extractTagText(item, "description"));
        const category = decodeEntities(extractTagText(item, "category"));
        const mediaThumb = extractAttr(item, "media:content", "url") ?? extractAttr(item, "enclosure", "url");

        if (!title || !link) continue;

        const teaserText = stripCdataAndTags(description);

        items.push({
          id: `liga3:${link.trim()}`,
          title: title.trim(),
          url: link.trim(),
          publishedAt: pubDate ? pubDate.trim() : "",
          source: "liga3-online.de",
          sourceType: "editorial",
          category: category ? category.trim() : null,
          teaser: teaserText ? teaserText.slice(0, 300) : null,
          imageUrl: mediaThumb ?? null,
        });
      } catch {
        continue;
      }
    }

    // Erster Kandidat, der tatsächlich Items liefert, gewinnt — keine
    // weiteren Endpunkte werden zusätzlich ausprobiert.
    if (items.length > 0) return items;
  }

  return [];
}
