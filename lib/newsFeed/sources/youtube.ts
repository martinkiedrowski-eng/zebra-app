import { NewsFeedItem } from "@/types/newsFeed";
import { fetchWithTimeout } from "../fetchUtils";
import { splitBlocks, extractTagText, extractAttr, extractLinkHref, isLikelyXml, decodeEntities } from "../xmlUtils";

// @MSVZebraChannel — live im Reality Check ermittelt und im Debug-Probe
// erfolgreich getestet (HTTP 200, 15 Items).
const CHANNEL_ID = "UCY18b48CEK53zTARqNiN0ig";
const FEED_URL = `https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`;

export async function fetchYoutubeNews(): Promise<NewsFeedItem[]> {
  const res = await fetchWithTimeout(FEED_URL);
  if (!res || !isLikelyXml(res.text)) return [];

  const entries = splitBlocks(res.text, "entry");

  const items: NewsFeedItem[] = [];
  for (const entry of entries) {
    try {
      const videoId = extractTagText(entry, "yt:videoId");
      const title = decodeEntities(extractTagText(entry, "title"));
      const published = extractTagText(entry, "published");
      const link = extractLinkHref(entry);
      const thumbnail = extractAttr(entry, "media:thumbnail", "url");
      const description = decodeEntities(extractTagText(entry, "media:description"));

      if (!title || !link) continue; // ohne Titel/Link kein verwertbarer Eintrag

      items.push({
        id: `youtube:${videoId ?? link}`,
        title: title.trim(),
        url: link,
        publishedAt: published ? published.trim() : "",
        source: "ZebraTV",
        sourceType: "video",
        category: "Video",
        teaser: description ? description.trim() : null,
        // Nur übernehmen, wenn der Feed tatsächlich ein Thumbnail liefert.
        imageUrl: thumbnail ?? null,
      });
    } catch {
      continue; // ein defekter Eintrag darf den restlichen Feed nicht stoppen
    }
  }
  return items;
}
