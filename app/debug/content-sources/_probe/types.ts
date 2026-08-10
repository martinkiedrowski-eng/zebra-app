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
