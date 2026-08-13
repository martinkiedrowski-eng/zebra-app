export function formatKickoffDate(iso: string): string {
  const date = new Date(iso);
  return new Intl.DateTimeFormat("de-DE", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  }).format(date);
}

export function formatKickoffTime(iso: string): string {
  const date = new Date(iso);
  return new Intl.DateTimeFormat("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatCountdown(iso: string, now: Date = new Date()): string {
  const diffMs = new Date(iso).getTime() - now.getTime();
  if (diffMs <= 0) return "Jetzt";

  const totalMinutes = Math.floor(diffMs / 60000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) return `${days} Tg · ${hours} Std`;
  if (hours > 0) return `${hours} Std · ${minutes} Min`;
  return `${minutes} Min`;
}

/**
 * Für die Spieltags-Tagesgruppierung auf /3-liga (Product Audit Batch 1B).
 * Explizit Europe/Berlin statt der Server-Zeitzone (auf Vercel i.d.R.
 * UTC) — sonst könnten Kickoffs am Tagesrand in die falsche Kalendertag-
 * Gruppe rutschen. Keine neue Library, nur die bereits genutzte Intl-API.
 */
const BERLIN_TZ = "Europe/Berlin";

function isValidDate(d: Date): boolean {
  return !Number.isNaN(d.getTime());
}

/** Stabiler, chronologisch sortierbarer Gruppierungs-Key (YYYY-MM-DD in Berlin-Zeit). Ungültige Kickoffs landen konsistent auf "9999-99-99" (immer ans Ende sortiert). */
export function formatDayGroupKey(iso: string): string {
  const date = new Date(iso);
  if (!isValidDate(date)) return "9999-99-99";
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: BERLIN_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/** "FR · 14.08." — für die sichtbare Gruppen-Überschrift. */
export function formatDayGroupLabel(iso: string): string {
  const date = new Date(iso);
  if (!isValidDate(date)) return "Termin unbekannt";
  const weekday = new Intl.DateTimeFormat("de-DE", { timeZone: BERLIN_TZ, weekday: "short" })
    .format(date)
    .replace(/\.$/, "")
    .toUpperCase();
  const dayMonth = new Intl.DateTimeFormat("de-DE", { timeZone: BERLIN_TZ, day: "2-digit", month: "2-digit" }).format(
    date
  );
  return `${weekday} · ${dayMonth}.`;
}

/**
 * "14.–16. August" bzw. "14. August" bei nur einem Tag — nur aus den
 * tatsächlich vorhandenen Kickoff-Daten der übergebenen Spiele abgeleitet,
 * nie geraten. `null`, wenn kein einziger Kickoff gültig ist.
 */
export function formatMatchdayDateRange(kickoffs: string[]): string | null {
  const validDates = kickoffs.map((k) => new Date(k)).filter(isValidDate);
  if (validDates.length === 0) return null;

  const times = validDates.map((d) => d.getTime());
  const min = new Date(Math.min(...times));
  const max = new Date(Math.max(...times));

  const day = (d: Date) => new Intl.DateTimeFormat("de-DE", { timeZone: BERLIN_TZ, day: "2-digit" }).format(d);
  const month = (d: Date) => new Intl.DateTimeFormat("de-DE", { timeZone: BERLIN_TZ, month: "long" }).format(d);

  if (formatDayGroupKey(min.toISOString()) === formatDayGroupKey(max.toISOString())) {
    return `${day(min)}. ${month(min)}`;
  }
  if (month(min) === month(max)) {
    return `${day(min)}.–${day(max)}. ${month(max)}`;
  }
  return `${day(min)}. ${month(min)} – ${day(max)}. ${month(max)}`;
}
