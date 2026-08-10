import { formatKickoffDate } from "@/lib/format";

/**
 * "HEUTE"/"MORGEN" für die nahen Fälle, sonst das normale, bereits
 * bestehende Kickoff-Datumsformat (lib/format.ts, unverändert). Reiner
 * Kalendertag-Vergleich, keine Uhrzeit-Anteile.
 */
export function relativeMatchDateLabel(kickoffIso: string, now: Date = new Date()): string {
  const kickoff = new Date(kickoffIso);
  if (Number.isNaN(kickoff.getTime())) return "";

  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diffDays = Math.round((startOfDay(kickoff) - startOfDay(now)) / 86_400_000);

  if (diffDays === 0) return "HEUTE";
  if (diffDays === 1) return "MORGEN";
  return formatKickoffDate(kickoffIso);
}
