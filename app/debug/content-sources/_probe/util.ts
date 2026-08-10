/**
 * Nur für den Debug-Probe. Bewusst dependency-frei (kein npm-Paket
 * hinzugefügt) — leichte, regelbasierte Extraktion statt eines echten
 * XML-Parsers, weil dieser Code komplett entfernt wird, sobald der
 * eigentliche News-Provider gebaut ist.
 */

const TIMEOUT_MS = 8000;

export async function fetchText(
  url: string
): Promise<{ status: number; contentType: string | null; text: string } | { error: string }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      cache: "no-store",
      signal: controller.signal,
      headers: {
        // Manche Seiten liefern an "nackte" Server-Fetches ohne UA einen
        // anderen/leeren Response — ein harmloser Browser-UA ist hier
        // reine Kompatibilität, kein Umgehen von Schutzmaßnahmen.
        "User-Agent": "Mozilla/5.0 (compatible; ZebraContentProbe/0.1; debug-only)",
      },
    });
    const text = await res.text();
    return {
      status: res.status,
      contentType: res.headers.get("content-type"),
      text,
    };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Unbekannter Fetch-Fehler" };
  } finally {
    clearTimeout(timeout);
  }
}

/** Kürzt einen String sicher, nie mehr als `max` Zeichen — für Logs/Anzeige, nie ganze Dokumente. */
export function truncate(value: string | null, max = 200): string | null {
  if (value === null) return null;
  return value.length > max ? `${value.slice(0, max)}…` : value;
}

export function decodeEntities(value: string | null): string | null {
  if (value === null) return null;
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'");
}

export function stripCdataAndTags(value: string | null): string | null {
  if (value === null) return null;
  return value
    .replace(/^<!\[CDATA\[/, "")
    .replace(/\]\]>$/, "")
    .replace(/<[^>]+>/g, "")
    .trim();
}
