import { TableEntry } from "@/types/table";

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
        const isZoneBorder = i > 0 && entry.zone && entries[i - 1].zone !== entry.zone;

        return (
          <div key={entry.teamId}>
            {isZoneBorder && (
              <div className="flex items-center gap-2 border-t border-zebra-border px-3 py-1">
                <span className="font-text text-[10px] uppercase tracking-wide text-zebra-mute-2">
                  {entry.zone === "relegation" ? "Abstieg" : entry.zone === "promotion" ? "Aufstieg" : ""}
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
