import { ProbeResult, ProbeItem, emptyResult } from "./types";
import { fetchText, decodeEntities, truncate } from "./util";
import { splitBlocks, extractTagText, extractAttr, isLikelyXml } from "./xmlUtils";

const TEAM_PAGE_URL = "https://www.reviersport.de/fussball/3liga-2627-mannschaften-220090041-msv-duisburg.html";

function findFeedLinkInHtml(html: string, baseUrl: string): string | null {
  // Strategie 1: offizieller <link rel="alternate" type="application/rss+xml" href="...">
  const alternateMatch = html.match(
    /<link[^>]+type=["']application\/(?:rss|atom)\+xml["'][^>]+href=["']([^"']+)["']/i
  );
  const alternateHref = alternateMatch ? alternateMatch[1] : undefined;
  if (alternateHref) return resolveUrl(alternateHref, baseUrl);

  // Strategie 2: sichtbarer Anchor mit "RSS" in Textnähe.
  const anchorMatch = html.match(/<a[^>]+href=["']([^"']+)["'][^>]*>[^<]*(?:RSS|Rss)[^<]*<\/a>/i);
  const anchorHref = anchorMatch ? anchorMatch[1] : undefined;
  if (anchorHref) return resolveUrl(anchorHref, baseUrl);

  return null;
}

function resolveUrl(href: string, baseUrl: string): string {
  try {
    return new URL(href, baseUrl).toString();
  } catch {
    return href;
  }
}

export async function probeReviersport(): Promise<ProbeResult> {
  const result = emptyResult("RevierSport");

  const pageRes = await fetchText(TEAM_PAGE_URL);
  if ("error" in pageRes) {
    result.status = "Teamseite nicht erreichbar";
    result.errorMessage = pageRes.error;
    return result;
  }

  result.notes.push(`Teamseite ${TEAM_PAGE_URL} → HTTP ${pageRes.status}`);

  if (pageRes.status < 200 || pageRes.status >= 300) {
    result.status = `Teamseite antwortet mit HTTP ${pageRes.status}`;
    return result;
  }

  const feedUrl = findFeedLinkInHtml(pageRes.text, TEAM_PAGE_URL);
  if (!feedUrl) {
    result.status = "Kein Feed-Link auf der Teamseite gefunden";
    result.errorMessage = "Weder <link rel=alternate> noch ein sichtbarer RSS-Anchor gefunden.";
    return result;
  }

  result.notes.push(`Gefundene Feed-URL: ${feedUrl}`);

  const feedRes = await fetchText(feedUrl);
  if ("error" in feedRes) {
    result.status = "Feed-URL gefunden, aber Fetch fehlgeschlagen";
    result.errorMessage = feedRes.error;
    return result;
  }

  result.fetchSuccess = true;
  result.httpStatus = feedRes.status;
  result.contentType = feedRes.contentType;

  if (feedRes.status < 200 || feedRes.status >= 300) {
    result.status = `Feed antwortet mit HTTP ${feedRes.status}`;
    return result;
  }

  if (!isLikelyXml(feedRes.text)) {
    result.status = "Feed-Response ist kein erkennbares XML/RSS";
    return result;
  }

  const items = splitBlocks(feedRes.text, "item");
  result.itemCount = items.length;
  result.parseSuccess = items.length > 0;
  result.status = result.parseSuccess ? "OK" : "Valides XML, aber keine <item>-Elemente gefunden";

  result.items = items.slice(0, 3).map((item): ProbeItem => {
    const title = decodeEntities(extractTagText(item, "title"));
    const link = extractTagText(item, "link");
    const pubDate = extractTagText(item, "pubDate");
    const description = decodeEntities(extractTagText(item, "description"));
    const fullContent = extractTagText(item, "content:encoded");
    const mediaThumb = extractAttr(item, "media:content", "url") ?? extractAttr(item, "enclosure", "url");

    // Grober Hinweis Volltext vs. Teaser: Beschreibung deutlich länger als
    // ein typischer Teaser -> vermutlich Volltext im Feed.
    const descLength = description ? description.replace(/<[^>]+>/g, "").trim().length : 0;

    return {
      title: title ? title.trim() : null,
      date: pubDate ? pubDate.trim() : null,
      url: link ? link.trim() : null,
      teaser: description ? truncate(description.trim(), 300) : null,
      image: mediaThumb,
      extra: {
        hasContentEncoded: fullContent ? "ja" : "nein",
        descriptionLength: String(descLength),
      },
    };
  });

  return result;
}
