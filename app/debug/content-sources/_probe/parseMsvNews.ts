import * as cheerio from "cheerio";

/**
 * Finaler Parser für https://www.msv-duisburg.de/aktuelles/newsuebersicht/
 * — basiert ausschließlich auf live auf Vercel verifizierten Fakten:
 *
 * - relevanter Container: ul.news-list
 * - Artikel-Links: href-Muster /aktuelles/artikel/.../
 * - Zeitangabe: <time>/datetime im Container
 * - Sichtbarer Titeltext folgt dem Muster "<Kategorie-Präfix> | <Headline>"
 *   (z.B. "ZebraTV | ...", "ZebraTalente | ...", "#MSVSVM | ...") — dieses
 *   Präfix ist NICHT dieselbe Kategorie-ID wie newsuebersicht/15|11|5/,
 *   sondern ein separates, pro Artikel sichtbares Tag im Titeltext selbst.
 *
 * Bewusst noch nicht Teil einer News-Provider-Architektur — liegt vorerst
 * im Debug-Modul, weil der eigentliche News Hub laut Vorgabe noch nicht
 * gebaut werden soll. Die Funktion ist aber bereits so geschrieben (reine
 * Funktion, keine Next.js-/Debug-Abhängigkeiten), dass sie unverändert in
 * einen künftigen Provider übernommen werden kann.
 */

export const MSV_OFFICIAL_SOURCE = "MSV Duisburg (offiziell)";

export interface MsvNewsArticle {
  title: string;
  url: string;
  publishedAt: string | null;
  category: string | null;
  source: string;
  image: string | null;
}

export interface MsvNewsParseResult {
  containerFound: boolean;
  articles: MsvNewsArticle[];
  excludedZebraTalente: number;
  skippedInvalid: number;
}

const ARTICLE_HREF_PATTERN = /\/aktuelles\/artikel\//i;
const ZEBRA_TALENTE_PATTERN = /^zebratalente$/i;

function collapseWhitespace(value: string | null | undefined): string {
  if (!value) return "";
  return value.replace(/\s+/g, " ").trim();
}

/**
 * Trennt "<Präfix> | <Headline>" sauber auf. Kein "|" gefunden -> gesamter
 * Text bleibt Headline, Kategorie ist null (nichts erraten).
 */
function splitCategoryAndHeadline(rawText: string): { category: string | null; headline: string } {
  const text = collapseWhitespace(rawText);
  const separatorIndex = text.indexOf("|");
  if (separatorIndex === -1) {
    return { category: null, headline: text };
  }
  const category = text.slice(0, separatorIndex).trim();
  const headline = text.slice(separatorIndex + 1).trim();
  if (!category || !headline) {
    return { category: null, headline: text };
  }
  return { category, headline };
}

/** Entfernt ein führendes Datum (z.B. "08.08.2026 ") aus dem Text, falls vorhanden. */
function stripLeadingDate(text: string): string {
  return text.replace(/^\d{2}\.\d{2}\.\d{4}\s*/, "").trim();
}

/**
 * Sucht defensiv nach einer ECHTEN, verwertbaren Bild-URL im Container.
 * Überspringt Base64-/Data-URIs und leere Werte. Keine URL wird
 * konstruiert oder geraten — nur tatsächlich im DOM gefundene Attribute.
 */
function findRealImageUrl(
  $: cheerio.CheerioAPI,
  $container: cheerio.Cheerio<any>,
  baseUrl: string
): string | null {
  const candidates: (string | undefined)[] = [];

  $container.find("img").each((_i: number, el: any) => {
    const $img = $(el);
    candidates.push($img.attr("src"));
    candidates.push($img.attr("data-src"));
    candidates.push($img.attr("data-lazy-src"));
  });

  $container.find("source").each((_i: number, el: any) => {
    const $source = $(el);
    const srcset = $source.attr("srcset");
    if (srcset) {
      const parts = srcset.split(",");
      const first = parts[0]?.trim();
      const firstUrl = first?.split(" ")[0];
      if (firstUrl) candidates.push(firstUrl);
    }
  });

  for (const candidate of candidates) {
    if (!candidate) continue;
    const trimmed = candidate.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith("data:")) continue; // Base64-/Placeholder-Bild, keine echte URL
    try {
      return new URL(trimmed, baseUrl).toString();
    } catch {
      continue; // keine gültige URL, keine Rate-Versuche
    }
  }

  return null;
}

export function parseMsvNewsList(html: string, baseUrl: string): MsvNewsParseResult {
  const $ = cheerio.load(html);
  const list = $("ul.news-list");

  if (list.length === 0) {
    return { containerFound: false, articles: [], excludedZebraTalente: 0, skippedInvalid: 0 };
  }

  const articles: MsvNewsArticle[] = [];
  let excludedZebraTalente = 0;
  let skippedInvalid = 0;
  const seenUrls = new Set<string>();

  const items = list.find("li");
  const scope = items.length > 0 ? items : list.children();

  scope.each((_i: number, el: any) => {
    try {
      const $item = $(el);
      const $link = $item.find('a[href*="/aktuelles/artikel/"]').first();
      const href = $link.attr("href");
      if (!href || !ARTICLE_HREF_PATTERN.test(href)) {
        skippedInvalid++;
        return;
      }

      let absoluteUrl: string;
      try {
        absoluteUrl = new URL(href, baseUrl).toString();
      } catch {
        skippedInvalid++;
        return;
      }
      if (seenUrls.has(absoluteUrl)) return; // Dublette innerhalb derselben Liste
      seenUrls.add(absoluteUrl);

      // Titeltext: bevorzugt title-Attribut des Links (enthält laut
      // Live-Beobachtung "<Präfix> | <Headline>"), sonst Linktext, sonst
      // nächstgelegene Überschrift im Item.
      const titleAttr = $link.attr("title");
      const linkText = $link.text();
      const headingText = $item.find("h2, h3, h4").first().text();
      const rawTitleSource = titleAttr || linkText || headingText;
      const rawTitle = stripLeadingDate(collapseWhitespace(rawTitleSource));

      if (!rawTitle) {
        skippedInvalid++;
        return;
      }

      const { category, headline } = splitCategoryAndHeadline(rawTitle);

      if (!headline) {
        skippedInvalid++;
        return;
      }

      if (category && ZEBRA_TALENTE_PATTERN.test(category)) {
        excludedZebraTalente++;
        return; // explizit NICHT in den Profi-Newsfeed aufgenommen
      }

      // Datum: bevorzugt strukturiertes datetime-Attribut, sonst
      // sichtbarer Zeittext, sonst DD.MM.YYYY-Textmuster im Item.
      const $time = $item.find("time").first();
      const datetimeAttr = $time.attr("datetime");
      const timeText = collapseWhitespace($time.text());
      const dateTextMatch = $item.text().match(/\b\d{2}\.\d{2}\.\d{4}\b/);
      const publishedAt = datetimeAttr || (timeText || null) || (dateTextMatch?.[0] ?? null);

      const image = findRealImageUrl($, $item, baseUrl);

      articles.push({
        title: headline,
        url: absoluteUrl,
        publishedAt: publishedAt ?? null,
        category,
        source: MSV_OFFICIAL_SOURCE,
        image,
      });
    } catch {
      // Ein einzelner defekter Teaser darf den ganzen Feed nicht zerstören.
      skippedInvalid++;
    }
  });

  return { containerFound: true, articles, excludedZebraTalente, skippedInvalid };
}
