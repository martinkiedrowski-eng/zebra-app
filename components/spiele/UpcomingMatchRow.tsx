import Link from "next/link";
import { Match } from "@/types/match";
import { MSV_TEAM_ID } from "@/lib/constants";
import { formatKickoffTime } from "@/lib/format";
import { relativeMatchDateLabel } from "@/lib/spiele/relativeDate";

export function UpcomingMatchRow({ match }: { match: Match }) {
  const isHome = match.homeTeam.id === MSV_TEAM_ID;
  const opponent = isHome ? match.awayTeam : match.homeTeam;
  const hasKickoff = !!match.kickoff;

  return (
    <Link
      href={`/spiele/${match.id}`}
      className="flex items-center gap-3 rounded-card border border-zebra-border bg-zebra-surface px-4 py-3"
    >
      <span className="w-16 flex-shrink-0 font-mono text-xs text-zebra-mute">
        {hasKickoff ? relativeMatchDateLabel(match.kickoff) : "–"}
      </span>
      <span className="w-6 flex-shrink-0 font-text text-[11px] font-medium uppercase text-zebra-mute">
        {isHome ? "H" : "A"}
      </span>
      <span className="min-w-0 flex-1 truncate font-text text-sm text-zebra-ice">{opponent.shortName}</span>
      {hasKickoff && (
        <span className="flex-shrink-0 font-mono text-xs text-zebra-mute">{formatKickoffTime(match.kickoff)}</span>
      )}
    </Link>
  );
}
