import { TableEntry } from "@/types/table";

/**
 * V1.0-Release-Regel (bewusst NICHT aus Daten abgeleitet, siehe Vorgabe):
 * Platz 1–2 = Aufstieg, Platz 3 = Relegation — reine UI-Anzeigeregel,
 * unabhängig von tableEngine.ts/entry.zone. Die bestehende Abstiegszone
 * (entry.zone === "relegation", von tableEngine.ts berechnet) bleibt
 * davon komplett unberührt und wird weiterhin unverändert übernommen.
 */
type DisplayZone = "aufstieg" | "relegation-platz" | "abstieg" | null;

function displayZoneFor(entry: TableEntry): DisplayZone {
  if (entry.position <= 2) return "aufstieg";
  if (entry.position === 3) return "relegation-platz";
  if (entry.zone === "relegation") return "abstieg";
  return null;
}

const ZONE_LABEL: Record<Exclude<DisplayZone, null>, string> = {
  aufstieg: "Aufstieg",
  "relegation-platz": "Relegation",
  abstieg: "Abstieg",
};

export function LeagueTable({ entries }: { entries: TableEntry[] }) {
  return (
    <div className="overflow-hidden rounded-card border border-zebra-border bg-zebra-surface">
      {/* Kopfzeile nur ab sm sichtbar, auf Mobile sprechen die Werte für sich */}
      <div className="hidden items-center gap-2 border-b border-zebra-border px-3 py-2 font-text text-[11px] uppercase tracking-wide text-zebra-mute sm:flex">
        <span className="w-6">#</span>
        <span className="flex-1">Team</span>
        <span className="hidden w-8 text-right md:inline">S</span>
        <span className="hidden w-8 text-right md:inline">U</span>
        <span className="hidden w-8 text-right md:inline">N</span>
        <span className="hidden w-14 text-right md:inline">Tore</span>
        <span className="w-8 text-right">Sp</span>
        <span className="w-10 text-right">Diff</span>
        <span className="w-8 text-right">Pkt</span>
      </div>

      {entries.map((entry, i) => {
        const zone = displayZoneFor(entry);
        const prevEntry = i > 0 ? entries[i - 1] : undefined;
        const prevZone = prevEntry ? displayZoneFor(prevEntry) : null;
        const isZoneBorder = i > 0 && zone !== null && zone !== prevZone;

        return (
          <div key={entry.teamId}>
            {isZoneBorder && zone && (
              <div className="flex items-center gap-2 border-t border-zebra-border px-3 py-1">
                <span className="font-text text-[10px] uppercase tracking-wide text-zebra-mute-2">
                  {ZONE_LABEL[zone]}
                </span>
              </div>
            )}
            <div
              className={`relative flex items-center gap-2 border-b border-zebra-border px-3 py-2.5 last:border-b-0 ${
                entry.isMsv ? "bg-zebra-blue-dim/40" : ""
              }`}
            >
              {entry.isMsv && (
                <span aria-hidden="true" className="absolute inset-y-0 left-0 w-[3px] bg-zebra-blue" />
              )}
              <span className="w-6 font-mono text-xs text-zebra-mute">{entry.position}</span>
              <span
                className={`flex-1 truncate font-text text-sm ${
                  entry.isMsv ? "font-semibold text-zebra-ice" : "text-zebra-ice"
                }`}
              >
                {entry.teamShortName}
              </span>
              <span className="hidden w-8 text-right font-mono text-xs text-zebra-mute md:inline">
                {entry.wins}
              </span>
              <span className="hidden w-8 text-right font-mono text-xs text-zebra-mute md:inline">
                {entry.draws}
              </span>
              <span className="hidden w-8 text-right font-mono text-xs text-zebra-mute md:inline">
                {entry.losses}
              </span>
              <span className="hidden w-14 text-right font-mono text-xs text-zebra-mute md:inline">
                {entry.goalsFor}:{entry.goalsAgainst}
              </span>
              <span className="w-8 text-right font-mono text-xs text-zebra-mute">{entry.played}</span>
              <span className="w-10 text-right font-mono text-xs text-zebra-mute">
                {entry.goalsFor - entry.goalsAgainst > 0 ? "+" : ""}
                {entry.goalsFor - entry.goalsAgainst}
              </span>
              <span className="w-8 text-right font-mono text-sm font-bold text-zebra-ice">
                {entry.points}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
