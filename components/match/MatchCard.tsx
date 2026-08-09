import { Match } from "@/types/match";
import { StatusPill } from "./StatusPill";
import { ZebraStripe } from "./ZebraStripe";
import { formatKickoffDate, formatKickoffTime, formatCountdown } from "@/lib/format";

type MatchCardVariant = "compact" | "featured" | "live";

interface MatchCardProps {
  match: Match;
  variant?: MatchCardVariant;
}

function ScoreOrTime({ match, size = "text-xl" }: { match: Match; size?: string }) {
  if (match.status === "scheduled") {
    return (
      <span className={`font-mono ${size} font-medium text-zebra-ice`}>
        {formatKickoffTime(match.kickoff)}
      </span>
    );
  }
  return (
    <span className={`font-mono ${size} font-bold text-zebra-ice`}>
      {match.homeScore ?? "–"}:{match.awayScore ?? "–"}
    </span>
  );
}

export function MatchCard({ match, variant = "compact" }: MatchCardProps) {
  if (variant === "live") {
    return (
      <div className="relative overflow-hidden rounded-card bg-zebra-surface-raised p-4.5">
        <ZebraStripe variant="pulse" className="absolute inset-x-0 top-0" />
        <div className="mb-3 flex items-center justify-between pt-1">
          <span className="font-text text-xs text-zebra-mute">
            {match.competition} · {match.matchday}. Spieltag
          </span>
          <StatusPill status={match.status} minute={match.minute} />
        </div>
        <div className="flex items-center justify-between">
          <TeamLabel name={match.homeTeam.shortName} align="left" />
          <span className="font-mono text-4xl font-bold text-zebra-ice">
            {match.homeScore ?? 0}:{match.awayScore ?? 0}
          </span>
          <TeamLabel name={match.awayTeam.shortName} align="right" />
        </div>
        <ZebraStripe variant="pulse" className="absolute inset-x-0 bottom-0" />
      </div>
    );
  }

  if (variant === "featured") {
    return (
      <div
        className={`rounded-card border p-4.5 ${
          match.isMsvMatch ? "border-zebra-blue/40 bg-zebra-surface" : "border-zebra-border bg-zebra-surface"
        }`}
      >
        <div className="mb-3 flex items-center justify-between">
          <span className="font-text text-xs text-zebra-mute">
            {match.competition} · {formatKickoffDate(match.kickoff)}
          </span>
          <StatusPill status={match.status} minute={match.minute} />
        </div>
        <div className="flex items-center justify-between">
          <TeamLabel name={match.homeTeam.shortName} align="left" />
          <ScoreOrTime match={match} size="text-2xl" />
          <TeamLabel name={match.awayTeam.shortName} align="right" />
        </div>
        {match.status === "scheduled" && (
          <div className="mt-3 flex items-center justify-between border-t border-zebra-border pt-3">
            <span className="font-text text-xs text-zebra-mute">{match.venue}</span>
            <span className="font-mono text-xs font-medium text-zebra-blue">
              {formatCountdown(match.kickoff)}
            </span>
          </div>
        )}
      </div>
    );
  }

  // compact
  return (
    <div className="flex items-center justify-between rounded-card border border-zebra-border bg-zebra-surface px-4 py-3">
      <div className="flex flex-1 items-center gap-2 font-text text-sm text-zebra-ice">
        <span className="w-10 truncate">{match.homeTeam.shortName}</span>
        <ScoreOrTime match={match} size="text-sm" />
        <span className="w-10 truncate">{match.awayTeam.shortName}</span>
      </div>
      <StatusPill status={match.status} minute={match.minute} />
    </div>
  );
}

function TeamLabel({ name, align }: { name: string; align: "left" | "right" }) {
  return (
    <div className={`flex flex-1 flex-col ${align === "left" ? "items-start" : "items-end"}`}>
      <span className="font-display text-sm font-bold uppercase tracking-wide text-zebra-ice">
        {name}
      </span>
    </div>
  );
}
