import { ProbeResult, ProbeItem, emptyResult } from "./types";
import { fetchText, decodeEntities, truncate } from "./util";
import { splitBlocks, extractTagText, extractAttr, isLikelyXml } from "./xmlUtils";

// Zwei plausible Kandidaten aus dem Reality Check — beide werden getestet,
// keiner wird als sicher vorausgesetzt.
const CANDIDATE_URLS = [
  "https://www.liga3-online.de/category/msv-duisburg/feed/",
  "https://www.liga3-online.de/category/vereine-3-liga/msv-duisburg/feed/",
];

export async function probeLiga3(): Promise<ProbeResult> {
  const result = emptyResult("liga3-online.de");

  for (const url of CANDIDATE_URLS) {
    const res = await fetchText(url);

    if ("error" in res) {
      result.notes.push(`${url} → Fetch fehlgeschlagen: ${res.error}`);
      continue;
    }

    result.notes.push(`${url} → HTTP ${res.status}, Content-Type: ${res.contentType ?? "unbekannt"}`);

    if (res.status < 200 || res.status >= 300) {
      continue;
    }

    if (!isLikelyXml(res.text)) {
      result.notes.push(`${url} → Antwort ist kein erkennbares XML/RSS (evtl. HTML-Fehlerseite)`);
      continue;
    }

    // Erster Kandidat, der valide aussieht, gewinnt.
    result.fetchSuccess = true;
    result.httpStatus = res.status;
    result.contentType = res.contentType;

    const items = splitBlocks(res.text, "item");
    result.itemCount = items.length;
    result.parseSuccess = items.length > 0;
    result.status = result.parseSuccess ? `OK (${url})` : `Valides XML, aber keine <item>-Elemente (${url})`;

    result.items = items.slice(0, 3).map((item): ProbeItem => {
      const title = decodeEntities(extractTagText(item, "title"));
      const link = extractTagText(item, "link");
      const pubDate = extractTagText(item, "pubDate");
      const description = decodeEntities(extractTagText(item, "description"));
      const category = extractTagText(item, "category");
      const mediaThumb = extractAttr(item, "media:content", "url") ?? extractAttr(item, "enclosure", "url");

      return {
        title: title ? title.trim() : null,
        date: pubDate ? pubDate.trim() : null,
        url: link ? link.trim() : null,
        teaser: description ? truncate(description.trim(), 300) : null,
        image: mediaThumb,
        extra: { category: category ? category.trim() : null },
      };
    });

    return result;
  }

  // Keiner der Kandidaten hat funktioniert.
  result.status = "Kein Feed-Kandidat funktioniert";
  result.errorMessage = "Weder /category/msv-duisburg/feed/ noch /category/vereine-3-liga/msv-duisburg/feed/ lieferten ein valides RSS/Atom.";
  return result;
}
