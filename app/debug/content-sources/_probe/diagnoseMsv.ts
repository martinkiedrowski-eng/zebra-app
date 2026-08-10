import * as cheerio from "cheerio";
import { MsvDiagnostics, MsvLinkSample, MsvImageSample, MsvTextSample } from "./types";
import { truncate } from "./util";

const NEWS_LIKE_PATTERN = /aktuelles|artikel|news/i;
const MAX_LINK_SAMPLES = 20;
const MAX_TEXT_SAMPLES = 5;
const MAX_IMAGE_SAMPLES = 5;

function collapseWhitespace(value: string | null | undefined): string | null {
  if (!value) return null;
  const collapsed = value.replace(/\s+/g, " ").trim();
  return collapsed.length > 0 ? collapsed : null;
}

function tagNameOf($el: cheerio.Cheerio<any>): string | null {
  const el = $el.get(0);
  if (!el || !("tagName" in el) || typeof el.tagName !== "string") return null;
  return el.tagName.toLowerCase();
}

/** Nächster Vorfahre mit einem nicht-leeren class-Attribut, max. 6 Ebenen hoch. */
function nearestClassedAncestor(
  $: cheerio.CheerioAPI,
  $el: cheerio.Cheerio<any>
): { tag: string | null; className: string | null } {
  let current = $el.parent();
  for (let depth = 0; depth < 6 && current.length > 0; depth++) {
    const cls = current.attr("class");
    if (cls && cls.trim().length > 0) {
      return { tag: tagNameOf(current), className: cls.trim() };
    }
    current = current.parent();
  }
  return { tag: null, className: null };
}

function isInNavHeaderFooter($: cheerio.CheerioAPI, $el: cheerio.Cheerio<any>): boolean {
  return $el.parents("nav, header, footer").length > 0;
}

export function diagnoseMsvHtml(
  html: string,
  finalUrl: string,
  httpStatus: number,
  contentType: string | null
): MsvDiagnostics {
  const $ = cheerio.load(html);
  const allLinks = $("a");

  let totalLinks = 0;
  let internalLinks = 0;
  let newsLikeLinks = 0;
  const linkSamples: MsvLinkSample[] = [];
  const classNameCounts = new Map<string, number>();
  const containerSet = new Map<string, { tag: string; className: string }>();
  const tagCounts = new Map<string, number>();
  const datetimeValues = new Set<string>();
  const imageSamples: MsvImageSample[] = [];

  allLinks.each((_i: number, el: any) => {
    totalLinks++;
    const $el = $(el);
    const href = $el.attr("href") ?? "";
    const isInternal = href.startsWith("/") || href.includes("msv-duisburg.de");
    if (isInternal) internalLinks++;

    const looksLikeNews = NEWS_LIKE_PATTERN.test(href);
    if (looksLikeNews) newsLikeLinks++;

    if (!looksLikeNews || !isInternal) return;
    if (isInNavHeaderFooter($, $el)) return;
    if (linkSamples.length >= MAX_LINK_SAMPLES) return;

    const parent = $el.parent();
    const ancestor = nearestClassedAncestor($, $el);

    linkSamples.push({
      href,
      text: collapseWhitespace($el.text()) ? truncate(collapseWhitespace($el.text()), 120) : null,
      linkClass: $el.attr("class") ?? null,
      parentTag: tagNameOf(parent),
      parentClass: parent.attr("class") ?? null,
      containerTag: ancestor.tag,
      containerClass: ancestor.className,
    });

    // Für die Auswertung häufiger Klassennamen: eigene Klasse + Parent-Klasse zählen.
    for (const cls of [$el.attr("class"), parent.attr("class"), ancestor.className]) {
      if (!cls) continue;
      for (const single of cls.split(/\s+/).filter(Boolean)) {
        classNameCounts.set(single, (classNameCounts.get(single) ?? 0) + 1);
      }
    }
    if (ancestor.tag && ancestor.className) {
      containerSet.set(`${ancestor.tag}.${ancestor.className}`, {
        tag: ancestor.tag,
        className: ancestor.className,
      });
    }
  });

  // Tags, die typischerweise Teaser/Artikel-Strukturen markieren.
  for (const tag of ["article", "time", "picture", "img", "h2", "h3", "h4"]) {
    const count = $(tag).length;
    if (count > 0) tagCounts.set(tag, count);
  }

  $("time").each((_i: number, el: any) => {
    const dt = $(el).attr("datetime");
    if (dt && datetimeValues.size < 10) datetimeValues.add(dt);
  });

  // Bild-Stichproben: für die ersten paar Link-Samples ein nahegelegenes <img> suchen.
  for (const sample of linkSamples) {
    if (imageSamples.length >= MAX_IMAGE_SAMPLES) break;
    // Container über den Link erneut auflösen (billig genug für <=20 Samples).
    const $matchingLink = allLinks.filter((_i: number, el: any) => $(el).attr("href") === sample.href).first();
    if ($matchingLink.length === 0) continue;
    const scope = sample.containerTag
      ? $matchingLink.closest(`${sample.containerTag}.${cssEscapeClass(sample.containerClass)}`)
      : $matchingLink.parent();
    const $img = (scope.length > 0 ? scope : $matchingLink.parent()).find("img").first();
    if ($img.length === 0) continue;
    imageSamples.push({
      linkHref: sample.href,
      src: $img.attr("src") ?? null,
      dataSrc: $img.attr("data-src") ?? null,
      srcset: $img.attr("srcset") ?? null,
    });
  }

  // Text-Stichproben aus den ersten paar eindeutigen Containern.
  const seenContainers = new Set<string>();
  const textSamples: MsvTextSample[] = [];
  for (const sample of linkSamples) {
    if (textSamples.length >= MAX_TEXT_SAMPLES) break;
    const key = sample.containerTag && sample.containerClass ? `${sample.containerTag}.${sample.containerClass}` : sample.href;
    if (seenContainers.has(key)) continue;
    seenContainers.add(key);

    const $matchingLink = allLinks.filter((_i: number, el: any) => $(el).attr("href") === sample.href).first();
    if ($matchingLink.length === 0) continue;
    const $container =
      sample.containerTag && sample.containerClass
        ? $matchingLink.closest(`${sample.containerTag}.${cssEscapeClass(sample.containerClass)}`)
        : $matchingLink.parent();
    const scope = $container.length > 0 ? $container : $matchingLink.parent();

    const $heading = scope.find("h2, h3, h4").first();
    const headline = collapseWhitespace($heading.length > 0 ? $heading.text() : sample.text);

    const $time = scope.find("time").first();
    const dateValue = $time.attr("datetime") ?? collapseWhitespace($time.text());

    const $img = scope.find("img").first();
    const imgSrc = $img.attr("src");
    const imgDataSrc = $img.attr("data-src");
    const imageAttrs =
      imgSrc || imgDataSrc ? `src=${imgSrc ?? "—"} data-src=${imgDataSrc ?? "—"}` : null;

    // Kategorie: Link in Container-Nähe, dessen href auf newsuebersicht/<id>/ passt.
    const $categoryLink = scope.find('a[href*="newsuebersicht/"]').first();
    const category = collapseWhitespace($categoryLink.length > 0 ? $categoryLink.text() : null);

    const fullText = collapseWhitespace(scope.text());

    textSamples.push({
      containerTag: sample.containerTag,
      containerClass: sample.containerClass,
      headline,
      link: sample.href,
      date: dateValue ?? null,
      imageAttrs,
      category,
      textSample: truncate(fullText, 250),
    });
  }

  const commonClassNames = Array.from(classNameCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([className, count]) => ({ className, count }));

  const possibleContainers = Array.from(containerSet.values()).slice(0, 10);

  const tagsFound = Array.from(tagCounts.entries()).map(([tag, count]) => ({ tag, count }));

  return {
    pageInfo: {
      finalUrl,
      httpStatus,
      contentType,
      htmlLength: html.length,
    },
    linkDiagnostics: {
      totalLinks,
      internalLinks,
      newsLikeLinks,
      samples: linkSamples,
    },
    structureDiagnostics: {
      commonClassNames,
      possibleContainers,
      tagsFound,
      datetimeValues: Array.from(datetimeValues),
      imageSamples,
    },
    textSamples,
    robotsAssessment: "", // wird von fetchMsv.ts nach dem robots.txt-Check gesetzt
  };
}

/** Minimal-Escaping für Klassennamen mit Sonderzeichen in cheerio-Selektoren. */
function cssEscapeClass(className: string | null): string {
  if (!className) return "";
  return className.split(/\s+/)[0]?.replace(/([:.[\],])/g, "\\$1") ?? "";
}
