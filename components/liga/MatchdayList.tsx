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
          className={`flex items-center gap-3 rounded-card border px-4 py-3 transition-colors hover:border-zebra-blue/50 ${
            match.isMsvMatch ? "border-zebra-blue/40 bg-zebra-surface" : "border-zebra-border bg-zebra-surface"
          }`}
        >
          <div className="flex flex-1 items-center gap-2 min-w-0">
            <span
              className={`w-16 truncate font-text text-sm ${
                match.isMsvMatch ? "font-semibold text-zebra-ice" : "text-zebra-ice"
              }`}
            >
              {match.homeTeam.shortName}
            </span>
            {match.status === "scheduled" ? (
              <span className="font-mono text-xs text-zebra-mute">{formatKickoffTime(match.kickoff)}</span>
            ) : (
              <span className="font-mono text-sm font-bold text-zebra-ice">
                {match.homeScore}:{match.awayScore}
              </span>
            )}
            <span
              className={`w-16 truncate font-text text-sm ${
                match.isMsvMatch ? "font-semibold text-zebra-ice" : "text-zebra-ice"
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
