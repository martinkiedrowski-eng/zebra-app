/**
 * Zentrale, einzige Zeitformatierung für alle News-Cards (Home + /news +
 * /mehr/zebratv nutzen alle dieselbe NewsFeedCard, die diese Funktion
 * aufruft) — keine zweite Implementierung an anderer Stelle.
 *
 * Ursache der beobachteten Inkonsistenz ("vor 22 Std" neben rohem
 * "11.08.2026"): manche Quellen liefern publishedAt bereits als
 * maschinenlesbares ISO-Datum (parst sauber), msv-duisburg.de liefert im
 * Fallback-Fall (kein <time datetime> im DOM gefunden) einen reinen
 * "DD.MM.YYYY"-Text, den `Date.parse()` nicht versteht — bisher wurde der
 * dann unformatiert 1:1 durchgereicht. Fix: zusätzlicher, expliziter
 * Parser für genau dieses deutsche Datumsformat als Fallback, danach
 * läuft alles durch dieselbe Min/Std/Tg/Datum-Logik.
 */

function parseGermanDateOnly(value: string): number | null {
  const match = value.trim().match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (!match) return null;
  const [, day, month, year] = match;
  const parsed = Date.parse(`${year}-${month}-${day}T00:00:00`);
  return Number.isNaN(parsed) ? null : parsed;
}

export function formatNewsTime(publishedAt: string): string {
  if (!publishedAt) return "";

  let parsed = Date.parse(publishedAt);
  if (Number.isNaN(parsed)) {
    const fallback = parseGermanDateOnly(publishedAt);
    if (fallback !== null) parsed = fallback;
  }

  // Weiterhin nicht parsebar: lieber nichts anzeigen als ein rohes,
  // unverständliches Datumsfragment.
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
