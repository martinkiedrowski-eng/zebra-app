import { ProbeResult, ProbeItem, emptyResult } from "./types";
import { fetchText, decodeEntities, truncate } from "./util";

const NEWS_OVERVIEW_URL = "https://www.msv-duisburg.de/aktuelles/newsuebersicht/";
const ROBOTS_URL = "https://www.msv-duisburg.de/robots.txt";

const KNOWN_CATEGORY_IDS: Record<string, string> = {
  "15": "News",
  "11": "Zebra TV",
  "5": "Spieltagshinweise",
};

async function probeRobotsTxt(result: ProbeResult): Promise<void> {
  const res = await fetchText(ROBOTS_URL);
  if ("error" in res) {
    result.notes.push(`robots.txt nicht abrufbar: ${res.error}`);
    return;
  }
  if (res.status < 200 || res.status >= 300) {
    result.notes.push(`robots.txt → HTTP ${res.status}`);
    return;
  }
  const relevantLines = res.text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => /^(User-agent|Disallow|Allow|Sitemap|Crawl-delay)/i.test(l))
    .slice(0, 40);
  result.notes.push(`robots.txt (${relevantLines.length} relevante Zeilen von HTTP ${res.status}):`);
  for (const line of relevantLines) {
    result.notes.push(`  ${line}`);
  }
  if (relevantLines.length === 0) {
    result.notes.push("  (keine User-agent/Disallow/Allow/Sitemap-Zeilen gefunden)");
  }
}

function checkCategoryIds(html: string, result: ProbeResult): void {
  for (const [id, expectedLabel] of Object.entries(KNOWN_CATEGORY_IDS)) {
    const pattern = new RegExp(`newsuebersicht/${id}/[^"']*["'][^>]*>([^<]*)`, "i");
    const match = html.match(pattern);
    if (match) {
      const foundLabel = match[1] ? match[1].trim() : "(kein Linktext gefunden)";
      result.notes.push(`Kategorie-ID ${id}: gefunden, Linktext "${foundLabel}" (erwartet: "${expectedLabel}")`);
    } else {
      result.notes.push(`Kategorie-ID ${id} ("${expectedLabel}"): NICHT gefunden auf der aktuellen Seite`);
    }
  }
}

function extractTeasers(html: string, result: ProbeResult): void {
  // Heuristik, kein stabiler Parser: Artikel-Links unter /aktuelles/artikel/.
  const anchorRe = /<a[^>]+href=["']([^"']*\/aktuelles\/artikel\/[^"']+)["'][^>]*title=["']([^"']*)["']/gi;
  const seen = new Set<string>();
  const found: { url: string; title: string; index: number }[] = [];

  let match: RegExpExecArray | null;
  while ((match = anchorRe.exec(html)) !== null && found.length < 3) {
    const url = match[1] ?? "";
    const title = match[2] ?? "";
    if (!url || seen.has(url)) continue;
    seen.add(url);
    found.push({ url, title, index: match.index });
  }

  if (found.length === 0) {
    result.notes.push("Heuristische Teaser-Extraktion: keine /aktuelles/artikel/-Links mit title-Attribut gefunden.");
    return;
  }

  let zebraTalenteCount = 0;

  result.items = found.map(({ url, title, index }): ProbeItem => {
    const windowStart = Math.max(0, index - 600);
    const windowEnd = Math.min(html.length, index + 600);
    const context = html.slice(windowStart, windowEnd);

    const dateMatch = context.match(/\b(\d{2}\.\d{2}\.\d{4})\b/);
    const categoryMatch = context.match(/newsuebersicht\/(\d+)\/[^"']*["'][^>]*>([^<]*)</i);
    const imgMatch = context.match(/<img[^>]+src=["']([^"']+)["']/i);

    const decodedTitle = decodeEntities(title)?.trim() ?? null;
    if (decodedTitle && decodedTitle.includes("ZebraTalente")) zebraTalenteCount++;

    return {
      title: decodedTitle,
      date: dateMatch ? dateMatch[1] ?? null : null,
      url: url.startsWith("http") ? url : `https://www.msv-duisburg.de${url}`,
      teaser: null, // Teaser-Fließtext steht nur auf der Artikel-Detailseite, nicht in der Übersicht
      image: imgMatch ? imgMatch[1] ?? null : null,
      extra: {
        category: categoryMatch ? truncate(decodeEntities(categoryMatch[2] ?? null)?.trim() ?? null, 40) : null,
        categoryId: categoryMatch ? categoryMatch[1] ?? null : null,
      },
    };
  });

  result.notes.push(
    `ZebraTalente-Präfix in den ${found.length} gefundenen Stichproben-Titeln: ${zebraTalenteCount}× vorhanden.`
  );
}

export async function probeMsv(): Promise<ProbeResult> {
  const result = emptyResult("msv-duisburg.de");

  await probeRobotsTxt(result);

  const res = await fetchText(NEWS_OVERVIEW_URL);
  if ("error" in res) {
    result.status = "Newsübersicht nicht erreichbar";
    result.errorMessage = res.error;
    return result;
  }

  result.fetchSuccess = true;
  result.httpStatus = res.status;
  result.contentType = res.contentType;

  if (res.status < 200 || res.status >= 300) {
    result.status = `Newsübersicht antwortet mit HTTP ${res.status}`;
    return result;
  }

  checkCategoryIds(res.text, result);
  extractTeasers(res.text, result);

  result.itemCount = result.items.length;
  result.parseSuccess = result.items.length > 0;
  result.status = result.parseSuccess
    ? "OK (heuristische Extraktion)"
    : "Seite erreichbar, aber Heuristik fand keine Artikel — HTML-Struktur hat sich vermutlich geändert";

  return result;
}
