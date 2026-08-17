import { NewsFeedItem } from "@/types/newsFeed";
import { fetchWithTimeout } from "../fetchUtils";
import { splitBlocks, extractTagText, extractAttr, isLikelyXml, decodeEntities, stripCdataAndTags } from "../xmlUtils";

/**
 * ROOT CAUSE von "Alle enthält kein ligaweites Material" (Polish Fix
 * Pass): Die einzige liga3-online.de-Quelle in dieser Pipeline
 * (sources/liga3.ts) fragt AUSSCHLIESSLICH die MSV-Kategorie-Feeds ab
 * (`/category/msv-duisburg/feed/` bzw. `/category/vereine-3-liga/
 * msv-duisburg/feed/`) — es gab architektonisch nie eine ligaweite
 * Quelle in der Pipeline. "Alle" zeigte deshalb praktisch nur MSV-News,
 * weil es schlicht keine anderen Rohdaten gab, die es hätte zeigen
 * können — kein Filterfehler, sondern eine fehlende Quelle.
 *
 * Fix: dieser neue Adapter bindet den offiziellen, öffentlich
 * dokumentierten Sportschau.de-RSS-Feed zur gesamten 3. Liga an — live
 * verifiziert (siehe Abschlussbericht): echte, aktuelle Artikel zu vielen
 * verschiedenen Drittligisten (u.a. Viktoria Köln, Hansa Rostock,
 * Regensburg, Aachen, Mannheim, Ingolstadt, Düsseldorf, Essen, Köln,
 * Meppen, Würzburg, Saarbrücken, Wiesbaden, Münster), nicht nur MSV.
 * ARD/Sportschau ist ein öffentlich-rechtlicher, seriöser Anbieter mit
 * einem offiziell für Drittnutzung vorgesehenen RSS-Feed — kein
 * Scraping, keine Umgehung von Schutzmaßnahmen.
 */
const FEED_URL = "https://www.sportschau.de/fussball/bundesliga3/index~rss2.xml";

export async function fetchSportschauNews(): Promise<NewsFeedItem[]> {
  const res = await fetchWithTimeout(FEED_URL);
  if (!res || !isLikelyXml(res.text)) return [];

  const rawItems = splitBlocks(res.text, "item");
  const items: NewsFeedItem[] = [];

  for (const item of rawItems) {
    try {
      const title = decodeEntities(stripCdataAndTags(extractTagText(item, "title")));
      const link = extractTagText(item, "link");
      const pubDate = extractTagText(item, "pubDate");
      const description = decodeEntities(stripCdataAndTags(extractTagText(item, "description")));
      const category = decodeEntities(stripCdataAndTags(extractTagText(item, "category")));
      const mediaThumb = extractAttr(item, "media:content", "url") ?? extractAttr(item, "enclosure", "url");

      if (!title || !link) continue;

      items.push({
        id: `sportschau:${link.trim()}`,
        title: title.trim(),
        url: link.trim(),
        publishedAt: pubDate ? pubDate.trim() : "",
        source: "Sportschau",
        sourceType: "editorial",
        category: category ? category.trim() : null,
        teaser: description ? description.slice(0, 300) : null,
        imageUrl: mediaThumb ?? null,
      });
    } catch {
      continue; // ein defekter Eintrag darf den restlichen Feed nicht stoppen
    }
  }

  return items;
}
