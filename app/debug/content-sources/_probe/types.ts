/**
 * Types ausschließlich für den temporären Content-Source-Probe
 * (app/debug/content-sources). Bewusst getrennt von types/news.ts &
 * types/matchCenter.ts — dieser Probe nimmt keine News-Architektur
 * vorweg, er zeigt nur rohe Prüfergebnisse.
 */

export interface ProbeItem {
  title: string | null;
  date: string | null;
  url: string | null;
  teaser: string | null;
  image: string | null;
  /** Quellenspezifische Zusatzfelder, z.B. Kategorie, Video-ID. */
  extra?: Record<string, string | null>;
}

export interface MsvLinkSample {
  href: string;
  text: string | null;
  linkClass: string | null;
  parentTag: string | null;
  parentClass: string | null;
  containerTag: string | null;
  containerClass: string | null;
}

export interface MsvImageSample {
  linkHref: string | null;
  src: string | null;
  dataSrc: string | null;
  srcset: string | null;
}

export interface MsvTextSample {
  containerTag: string | null;
  containerClass: string | null;
  headline: string | null;
  link: string | null;
  date: string | null;
  imageAttrs: string | null;
  category: string | null;
  textSample: string | null;
}

export interface MsvDiagnostics {
  pageInfo: {
    finalUrl: string;
    httpStatus: number;
    contentType: string | null;
    htmlLength: number;
  };
  linkDiagnostics: {
    totalLinks: number;
    internalLinks: number;
    newsLikeLinks: number;
    samples: MsvLinkSample[];
  };
  structureDiagnostics: {
    commonClassNames: { className: string; count: number }[];
    possibleContainers: { tag: string; className: string }[];
    tagsFound: { tag: string; count: number }[];
    datetimeValues: string[];
    imageSamples: MsvImageSample[];
  };
  textSamples: MsvTextSample[];
  robotsAssessment: string;
}

export interface ProbeResult {
  source: string;
  /** Kurzer, für Menschen lesbarer Status-Text. */
  status: string;
  httpStatus: number | null;
  contentType: string | null;
  fetchSuccess: boolean;
  parseSuccess: boolean;
  itemCount: number | null;
  errorMessage: string | null;
  items: ProbeItem[];
  /** Zusätzliche Beobachtungen (z.B. Kategorie-ID-Check, robots.txt-Auszug). */
  notes: string[];
  /** Nur msv-duisburg.de: strukturierte Struktur-Diagnose für den späteren Parser. */
  diagnostics?: MsvDiagnostics;
}

export function emptyResult(source: string): ProbeResult {
  return {
    source,
    status: "nicht ausgeführt",
    httpStatus: null,
    contentType: null,
    fetchSuccess: false,
    parseSuccess: false,
    itemCount: null,
    errorMessage: null,
    items: [],
    notes: [],
  };
}
