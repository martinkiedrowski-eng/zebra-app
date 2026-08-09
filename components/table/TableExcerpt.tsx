import { TableEntry } from "@/types/table";

export function TableExcerpt({ entries }: { entries: TableEntry[] }) {
  return (
    <div className="overflow-hidden rounded-card border border-zebra-border bg-zebra-surface">
      {entries.map((entry) => (
        <div
          key={entry.teamId}
          className={`flex items-center gap-3 border-b border-zebra-border px-3 py-2.5 last:border-b-0 ${
            entry.isMsv ? "relative bg-zebra-blue-dim/40" : ""
          }`}
        >
          {entry.isMsv && (
            <span aria-hidden="true" className="absolute inset-y-0 left-0 w-[3px] bg-zebra-blue" />
          )}
          <span className="w-5 font-mono text-xs text-zebra-mute">{entry.position}</span>
          <span
            className={`flex-1 truncate font-text text-sm ${
              entry.isMsv ? "font-semibold text-zebra-ice" : "text-zebra-ice"
            }`}
          >
            {entry.teamShortName}
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
      ))}
    </div>
  );
}
