import { ProbeResult, ProbeItem, emptyResult } from "./types";
import { fetchText, fetchTextWithMeta, decodeEntities } from "./util";
import { diagnoseMsvHtml } from "./diagnoseMsv";

const NEWS_OVERVIEW_URL = "https://www.msv-duisburg.de/aktuelles/newsuebersicht/";
const ROBOTS_URL = "https://www.msv-duisburg.de/robots.txt";

const KNOWN_CATEGORY_IDS: Record<string, string> = {
  "15": "News",
  "11": "Zebra TV",
  "5": "Spieltagshinweise",
};

/**
 * Prüft NUR, was in robots.txt tatsächlich für User-agent "*" als
 * Disallow steht, und ob das den genutzten Pfad betrifft — keine
 * Interpretation über den Wortlaut hinaus.
 */
function assessRobots(robotsText: string, pathToCheck: string): string {
  const lines = robotsText
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  let inStarGroup = false;
  const disallowPaths: string[] = [];

  for (const line of lines) {
    if (/^User-agent:/i.test(line)) {
      const agent = line.replace(/^User-agent:\s*/i, "").trim();
      inStarGroup = agent === "*";
      continue;
    }
    if (inStarGroup && /^Disallow:/i.test(line)) {
      const path = line.replace(/^Disallow:\s*/i, "").trim();
      if (path) disallowPaths.push(path);
    }
  }

  if (disallowPaths.length === 0) {
    return 'Keine Disallow-Regel für User-agent "*" in robots.txt gefunden — nichts spricht laut robots.txt gegen den Abruf der genutzten Seite.';
  }

  const blocking = disallowPaths.filter((p) => pathToCheck.startsWith(p));
  if (blocking.length > 0) {
    return `robots.txt (User-agent "*") verbietet Pfad(e), die "${pathToCheck}" betreffen: ${blocking.join(", ")}`;
  }
  return `robots.txt (User-agent "*") enthält ${disallowPaths.length} Disallow-Regel(n), keine davon betrifft den genutzten Pfad "${pathToCheck}".`;
}

async function probeRobotsTxt(result: ProbeResult): Promise<string> {
  const res = await fetchText(ROBOTS_URL);
  if ("error" in res) {
    result.notes.push(`robots.txt nicht abrufbar: ${res.error}`);
    return "robots.txt konnte nicht abgerufen werden — keine Aussage möglich.";
  }
  if (res.status < 200 || res.status >= 300) {
    result.notes.push(`robots.txt → HTTP ${res.status}`);
    return `robots.txt antwortete mit HTTP ${res.status} — keine Aussage möglich.`;
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

  const path = new URL(NEWS_OVERVIEW_URL).pathname;
  return assessRobots(res.text, path);
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

function extractTeasersHeuristic(html: string, result: ProbeResult): void {
  // Bestehende, bereits als unzuverlässig bekannte Heuristik — unverändert
  // beibehalten (liefert aktuell 0 Treffer), NICHT durch die neue
  // cheerio-Diagnose ersetzt. Die Diagnose unten liefert die Grundlage für
  // den künftigen echten Parser.
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
    result.notes.push("Bisherige heuristische Teaser-Extraktion (Regex): weiterhin 0 Treffer.");
    return;
  }

  result.items = found.map(({ url, title, index }): ProbeItem => {
    const windowStart = Math.max(0, index - 600);
    const windowEnd = Math.min(html.length, index + 600);
    const context = html.slice(windowStart, windowEnd);
    const dateMatch = context.match(/\b(\d{2}\.\d{2}\.\d{4})\b/);
    const imgMatch = context.match(/<img[^>]+src=["']([^"']+)["']/i);

    return {
      title: decodeEntities(title)?.trim() ?? null,
      date: dateMatch ? dateMatch[1] ?? null : null,
      url: url.startsWith("http") ? url : `https://www.msv-duisburg.de${url}`,
      teaser: null,
      image: imgMatch ? imgMatch[1] ?? null : null,
    };
  });
}

export async function probeMsv(): Promise<ProbeResult> {
  const result = emptyResult("msv-duisburg.de");

  const robotsAssessment = await probeRobotsTxt(result);

  const res = await fetchTextWithMeta(NEWS_OVERVIEW_URL);
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
  extractTeasersHeuristic(res.text, result);

  result.itemCount = result.items.length;
  result.parseSuccess = result.items.length > 0;
  result.status = result.parseSuccess
    ? "OK (heuristische Extraktion)"
    : "Seite erreichbar, Regex-Heuristik findet weiterhin 0 Items — siehe Struktur-Diagnose unten";

  try {
    const diagnostics = diagnoseMsvHtml(res.text, res.finalUrl, res.status, res.contentType);
    diagnostics.robotsAssessment = robotsAssessment;
    result.diagnostics = diagnostics;
  } catch (err) {
    result.notes.push(
      `Struktur-Diagnose (cheerio) fehlgeschlagen: ${err instanceof Error ? err.message : "unbekannter Fehler"}`
    );
  }

  return result;
}
