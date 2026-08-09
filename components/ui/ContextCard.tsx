import { ContextDirection } from "@/lib/leagueContext";

const ARROW: Record<ContextDirection, string> = {
  up: "↑",
  down: "↓",
  neutral: "→",
};

const COLOR: Record<ContextDirection, string> = {
  up: "text-zebra-success",
  down: "text-zebra-loss",
  neutral: "text-zebra-mute",
};

/**
 * Generische Kontext-Karte für regelbasiert erzeugte Kurztexte (Liga-
 * Kontext im Match Center, MSV-Lage und Spieltag-Fazit auf der
 * 3.-Liga-Seite) — ein Look für alle "was bedeutet das gerade"-Momente.
 */
export function ContextCard({ headline, direction }: { headline: string; direction: ContextDirection }) {
  return (
    <div className="flex items-center gap-3 rounded-card border border-zebra-border bg-zebra-surface p-4">
      <span className={`font-mono text-xl font-bold ${COLOR[direction]}`} aria-hidden="true">
        {ARROW[direction]}
      </span>
      <p className="font-text text-sm text-zebra-ice">{headline}</p>
    </div>
  );
}
