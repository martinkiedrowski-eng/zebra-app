/**
 * Zentrale, einzige Zeitformatierung für alle News-Cards (Home + /news +
 * /mehr/zebratv nutzen alle dieselbe NewsFeedCard, die diese Funktion
 * aufruft) — keine zweite Implementierung an anderer Stelle.
 *
 * ROOT CAUSE des "gerade eben"-Bugs (live über /debug/news-dates
 * bestätigt): `Date.parse("11.08.2026")` liefert in der echten
 * Laufzeitumgebung KEIN `NaN` — anders als ursprünglich angenommen.
 * Der bisherige Code rief `Date.parse(publishedAt)` zuerst unconditional
 * auf und prüfte erst DANACH per `Number.isNaN(parsed)`, ob der eigene,
 * sichere `parseGermanDateOnly()`-Fallback greifen sollte. Weil
 * `Date.parse()` für dieses Format aber "erfolgreich" (nur eben falsch,
 * mit einem Ergebnis nahe der aktuellen Zeit) zurückkehrte, wurde der
 * NaN-Zweig nie erreicht — der Fallback war faktisch toter Code.
 *
 * Fix: das eindeutige `DD.MM.YYYY`-Muster wird jetzt IMMER zuerst und
 * ausschließlich über den eigenen, deterministischen Parser behandelt,
 * bevor überhaupt der generische `Date.parse()`-Pfad in Betracht kommt.
 * Zusätzlich: ein reines Kalenderdatum hat keine Uhrzeit — die relative
 * Anzeige dafür rechnet deshalb in ganzen Kalendertagen (Europe/Berlin),
 * nicht in Millisekunden-Differenz zur aktuellen Uhrzeit (das hätte je
 * nach Tageszeit zu falschen Rundungen geführt, z.B. "vor 3 Tg" statt
 * "vor 2 Tg").
 *
 * Valide ISO-Datumswerte mit echter Uhrzeit (die meisten Quellen)
 * durchlaufen weiterhin unverändert die bestehende Min/Std/Tg/Datum-Logik.
 */

const BERLIN_TZ = "Europe/Berlin";

/**
 * Reines "DD.MM.YYYY" -> Millisekunden-Zeitstempel für Mitternacht UTC
 * dieses Kalendertags (bewusst UTC-verankert, nicht serverlokal — so
 * bleibt die Konstruktion unabhängig davon, in welcher Zeitzone die
 * Vercel-Function tatsächlich läuft). Lehnt Kalender-Unsinn wie "31.02."
 * ab, statt es stillschweigend in den Folgemonat rollen zu lassen.
 */
function parseGermanDateOnly(value: string): number | null {
  const match = value.trim().match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (!match) return null;

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const ms = Date.UTC(year, month - 1, day);

  const check = new Date(ms);
  const isValid =
    check.getUTCFullYear() === year && check.getUTCMonth() === month - 1 && check.getUTCDate() === day;
  return isValid ? ms : null;
}

function berlinDateParts(date: Date): { year: number; month: number; day: number } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: BERLIN_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? NaN);
  return { year: get("year"), month: get("month"), day: get("day") };
}

/** Differenz in ganzen Kalendertagen (Europe/Berlin), nicht in Ist-Stunden. */
function calendarDayDiff(dateOnlyMs: number, now: Date): number {
  const a = berlinDateParts(new Date(dateOnlyMs));
  const b = berlinDateParts(now);
  const aUtc = Date.UTC(a.year, a.month - 1, a.day);
  const bUtc = Date.UTC(b.year, b.month - 1, b.day);
  return Math.round((bUtc - aUtc) / 86_400_000);
}

function formatDateOnlyRelative(dateOnlyMs: number): string {
  const days = calendarDayDiff(dateOnlyMs, new Date());

  // <= 0: heute (oder, defensiv, ein durch Zeitzonen-Rundung minimal in
  // der Zukunft liegender Kalendertag) — niemals "gerade eben"
  // vortäuschen, da für ein reines Datum keine Uhrzeit bekannt ist.
  if (days <= 0) return "heute";
  if (days < 7) return `vor ${days} Tg`;

  return new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" }).format(
    new Date(dateOnlyMs)
  );
}

export function formatNewsTime(publishedAt: string): string {
  if (!publishedAt) return "";

  const dateOnlyMs = parseGermanDateOnly(publishedAt);
  if (dateOnlyMs !== null) {
    return formatDateOnlyRelative(dateOnlyMs);
  }

  const parsed = Date.parse(publishedAt);
  if (Number.isNaN(parsed)) return "";

  const diffMs = Date.now() - parsed;
  const diffMin = Math.round(diffMs / 60000);

  if (diffMin < 1) return "gerade eben";
  if (diffMin < 60) return `vor ${diffMin} Min`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return `vor ${diffH} Std`;
  const diffD = Math.round(diffH / 24);
  if (diffD < 7) return `vor ${diffD} Tg`;

  return new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" }).format(
    new Date(parsed)
  );
}

/**
 * Exportiert für lib/newsFeed/aggregate.ts::toTimestamp() — dieselbe
 * DD.MM.YYYY-Erkennung wird für die Sortierung gebraucht (identischer
 * Root-Cause-Bug war dort ebenfalls vorhanden). Eine Wahrheit, keine
 * zweite Kopie der Parsing-Logik.
 */
export { parseGermanDateOnly };
