import Link from "next/link";
import { Match } from "@/types/match";
import { StatusPill } from "@/components/match/StatusPill";
import { formatKickoffTime } from "@/lib/format";

export function MatchdayList({ matches }: { matches: Match[] }) {
  return (
    <div className="space-y-2">
      {matches.map((match) => (
        <Link
          key={match.id}
          href={`/spiele/${match.id}`}
          className={`relative flex items-center gap-3 overflow-hidden rounded-card border px-4 py-3 transition-colors hover:border-zebra-blue/50 ${
            match.isMsvMatch ? "border-zebra-blue/40 bg-zebra-blue-dim/40" : "border-zebra-border bg-zebra-surface"
          }`}
        >
          {match.isMsvMatch && (
            <span aria-hidden="true" className="absolute inset-y-0 left-0 w-[3px] bg-zebra-blue" />
          )}
          {/* min-w-0 auf beiden Team-Spans ist entscheidend: erst dadurch
              dürfen sie innerhalb von flex-1 tatsächlich schrumpfen/wachsen
              und den vorhandenen Platz nutzen, statt starr auf einer festen
              Breite abzuschneiden. */}
          <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
            <span
              className={`min-w-0 truncate text-right font-text text-sm ${
                match.isMsvMatch ? "font-semibold text-zebra-blue" : "text-zebra-ice"
              }`}
            >
              {match.homeTeam.shortName}
            </span>
          </div>

          <div className="flex-shrink-0">
            {match.status === "scheduled" ? (
              <span className="font-mono text-xs text-zebra-mute">{formatKickoffTime(match.kickoff)}</span>
            ) : (
              <span className="font-mono text-sm font-bold text-zebra-ice">
                {match.homeScore}:{match.awayScore}
              </span>
            )}
          </div>

          <div className="flex min-w-0 flex-1 items-center gap-2">
            <span
              className={`min-w-0 truncate font-text text-sm ${
                match.isMsvMatch ? "font-semibold text-zebra-blue" : "text-zebra-ice"
              }`}
            >
              {match.awayTeam.shortName}
            </span>
          </div>

          <StatusPill status={match.status} minute={match.minute} />
        </Link>
      ))}
    </div>
  );
}
