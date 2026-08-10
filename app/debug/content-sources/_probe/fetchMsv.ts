import { ProbeResult, ProbeItem, emptyResult } from "./types";
import { fetchText, fetchTextWithMeta } from "./util";
import { diagnoseMsvHtml } from "./diagnoseMsv";
import { parseMsvNewsList } from "./parseMsvNews";

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

  // --- Finaler Parser (ersetzt die frühere Regex-Heuristik) ---------
  const parsed = parseMsvNewsList(res.text, res.finalUrl);

  if (!parsed.containerFound) {
    result.status = "ul.news-list nicht gefunden — Seitenstruktur hat sich vermutlich geändert";
    result.itemCount = 0;
    result.parseSuccess = false;
  } else {
    result.items = parsed.articles.slice(0, 5).map(
      (a): ProbeItem => ({
        title: a.title,
        date: a.publishedAt,
        url: a.url,
        teaser: null,
        image: a.image,
        extra: { category: a.category, source: a.source },
      })
    );
    result.itemCount = parsed.articles.length;
    result.parseSuccess = parsed.articles.length > 0;
    result.status = result.parseSuccess
      ? `OK — ${parsed.articles.length} Profi-News geparst (ul.news-list)`
      : "ul.news-list gefunden, aber 0 gültige Profi-Artikel extrahiert";
  }

  result.notes.push(`ul.news-list gefunden: ${parsed.containerFound ? "ja" : "nein"}`);
  result.notes.push(`Ausgeschlossene ZebraTalente-Beiträge: ${parsed.excludedZebraTalente}`);
  result.notes.push(`Übersprungene ungültige Einträge: ${parsed.skippedInvalid}`);

  // --- Struktur-Diagnose bleibt zur weiteren Validierung erhalten ---
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
