import Link from "next/link";
import { MultiplexEntry, getRelevanceLabel } from "@/lib/multiplex";
import { StatusPill } from "@/components/match/StatusPill";
import { displayScore } from "@/lib/spiele/scoreDisplay";

export function LiveMultiplex({ entries }: { entries: MultiplexEntry[] }) {
  if (entries.length === 0) return null;

  return (
    <div className="rounded-card border border-zebra-border bg-zebra-surface">
      <div className="flex items-center gap-2 border-b border-zebra-border px-4 py-2.5">
        <span aria-hidden="true" className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-zebra-pulse" />
        <span className="font-display text-xs font-bold uppercase tracking-wide text-zebra-ice">
          Live in der 3. Liga
        </span>
      </div>
      <div className="divide-y divide-zebra-border">
        {entries.map(({ match, relevanceReason }) => {
          const label = getRelevanceLabel(relevanceReason);
          return (
            <Link
              key={match.id}
              href={`/spiele/${match.id}`}
              className="flex items-center gap-3 px-4 py-2.5 hover:bg-zebra-surface-raised"
            >
              <div className="flex flex-1 items-center gap-2 min-w-0">
                <span
                  className={`w-14 truncate font-text text-sm ${
                    match.isMsvMatch ? "font-semibold text-zebra-ice" : "text-zebra-ice"
                  }`}
                >
                  {match.homeTeam.shortName}
                </span>
                <span className="font-mono text-sm font-bold text-zebra-ice">
                  {displayScore(match).home}:{displayScore(match).away}
                </span>
                <span
                  className={`w-14 truncate font-text text-sm ${
                    match.isMsvMatch ? "font-semibold text-zebra-ice" : "text-zebra-ice"
                  }`}
                >
                  {match.awayTeam.shortName}
                </span>
                {label && (
                  <span className="rounded-pill bg-zebra-blue-dim px-1.5 py-0.5 font-text text-[9px] font-medium uppercase tracking-wide text-zebra-blue">
                    {label}
                  </span>
                )}
              </div>
              <StatusPill status={match.status} minute={match.minute} />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
