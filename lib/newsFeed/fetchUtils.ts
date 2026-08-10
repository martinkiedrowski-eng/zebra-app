/**
 * Bewusst eigenständig von app/debug/content-sources/_probe/util.ts —
 * die Produktionsschicht darf nicht vom Debug-Modul abhängen (das könnte
 * jederzeit entfernt werden). Kleine, stabile Funktion, daher ist die
 * Dopplung hier eine bewusste Entscheidung ("Stabilität vor
 * Architektur-Perfektion"), keine versehentliche.
 */

const TIMEOUT_MS = 8000;
/** 5 Minuten — News-Aktualität im Minutenbereich reicht, siehe Reality-Check-Dokument. */
const REVALIDATE_SECONDS = 300;

export interface FetchedText {
  status: number;
  contentType: string | null;
  text: string;
  finalUrl: string;
}

export async function fetchWithTimeout(url: string): Promise<FetchedText | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      next: { revalidate: REVALIDATE_SECONDS },
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; ZebraNewsHub/1.0)",
      },
    });
    if (!res.ok) return null;
    const text = await res.text();
    return {
      status: res.status,
      contentType: res.headers.get("content-type"),
      text,
      finalUrl: res.url || url,
    };
  } catch {
    // Ein Quellenfehler darf den Aggregator nie zum Absturz bringen —
    // der Aufrufer behandelt `null` als "diese Quelle liefert jetzt nichts".
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
