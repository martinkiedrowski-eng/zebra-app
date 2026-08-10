/**
 * Alles, was OpenLigaDB liefert, kommt hier zuerst durch, bevor es unsere
 * internen Types berührt. Grund: Die exakte Groß-/Kleinschreibung und
 * Feldbenennung der API konnte bisher NICHT gegen eine echte Response
 * verifiziert werden (kein Netzwerkzugriff in der Entwicklungsumgebung —
 * siehe Reality-Check-Dokument und Debug-Bericht). Statt einer einzigen,
 * möglicherweise falschen Feldbezeichnung zu vertrauen, probiert diese
 * Schicht mehrere plausible Kandidaten und fällt kontrolliert auf einen
 * sicheren Default zurück — nie auf NaN oder "undefined im UI".
 *
 * Wenn KEIN Kandidat einen Wert liefert, wird einmalig (nicht pro Zeile,
 * um die Vercel-Logs nicht zu fluten) eine Warnung mit den tatsächlichen
 * Objekt-Keys geloggt. Das macht die nächste Produktions-Session
 * selbst-diagnostizierend: ein Blick in die Vercel-Function-Logs zeigt die
 * echten Feldnamen, ohne raten zu müssen.
 */

type RawObject = Record<string, unknown>;

export function isRawObject(value: unknown): value is RawObject {
  return typeof value === "object" && value !== null;
}

export function pickString(obj: RawObject, keys: string[], fallback = ""): string {
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === "string" && value.trim() !== "") return value;
  }
  return fallback;
}

export function pickNumber(obj: RawObject, keys: string[], fallback = 0): number {
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim() !== "") {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return fallback;
}

export function pickBoolean(obj: RawObject, keys: string[], fallback = false): boolean {
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === "boolean") return value;
  }
  return fallback;
}

export function pickArray(obj: RawObject, keys: string[]): unknown[] {
  for (const key of keys) {
    const value = obj[key];
    if (Array.isArray(value)) return value;
  }
  return [];
}

export function pickNullableString(obj: RawObject, keys: string[]): string | null {
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === "string" && value.trim() !== "") return value;
  }
  return null;
}

const warnedContexts = new Set<string>();

/**
 * Loggt einmalig pro `context` (z.B. "getbltable-entry") die tatsächlichen
 * Top-Level-Keys eines unerwarteten Rohobjekts. Bewusst ohne komplette
 * Werte im Log (keine potenziell großen/sensiblen Payloads), nur die
 * Struktur — das reicht, um das Mapping zu korrigieren.
 */
export function warnUnexpectedShape(context: string, raw: unknown): void {
  if (warnedContexts.has(context)) return;
  warnedContexts.add(context);
  try {
    const keys = isRawObject(raw) ? Object.keys(raw) : [];
    // eslint-disable-next-line no-console
    console.error(
      `[ZEBRA/OpenLigaDB] Unerwartete Datenstruktur bei "${context}" — erwartete Felder nicht gefunden. ` +
        `Tatsächliche Keys: ${keys.length ? keys.join(", ") : "(kein Objekt / leer)"}`
    );
  } catch {
    // Logging darf den Request niemals zum Absturz bringen.
  }
}
