import { Match } from "@/types/match";
import { StatusPill } from "./StatusPill";
import { ZebraStripe } from "./ZebraStripe";
import { formatKickoffDate, formatKickoffTime } from "@/lib/format";
import { displayScore } from "@/lib/spiele/scoreDisplay";
import { LiveCountdown } from "./LiveCountdown";

type MatchCardVariant = "compact" | "featured" | "live";

interface MatchCardProps {
  match: Match;
  variant?: MatchCardVariant;
  /** Nur für "featured": z.B. "DFB-POKAL · 1. RUNDE". Ligaspiele unverändert. */
  competitionLabel?: string;
}

function ScoreOrTime({ match, size = "text-xl" }: { match: Match; size?: string }) {
  if (match.status === "scheduled") {
    return (
      <span className={`font-mono ${size} font-medium text-zebra-ice`}>
        {formatKickoffTime(match.kickoff)}
      </span>
    );
  }
  const score = displayScore(match);
  return (
    <span className={`font-mono ${size} font-bold text-zebra-ice`}>
      {score.home}:{score.away}
    </span>
  );
}

export function MatchCard({ match, variant = "compact", competitionLabel }: MatchCardProps) {
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
            {competitionLabel ?? `${match.competition} · ${formatKickoffDate(match.kickoff)}`}
          </span>
          <StatusPill status={match.status} minute={match.minute} />
        </div>
        <div className="flex items-center justify-between">
          <TeamLabel name={match.homeTeam.shortName} align="left" />
          <div className="flex flex-col items-center">
            <ScoreOrTime match={match} size="text-2xl" />
            {match.status === "finished" && match.halftimeScore && (
              <span className="mt-0.5 font-mono text-[11px] text-zebra-mute">
                Halbzeit {match.halftimeScore.home}:{match.halftimeScore.away}
              </span>
            )}
          </div>
          <TeamLabel name={match.awayTeam.shortName} align="right" />
        </div>
        {match.status === "scheduled" && (
          <div className="mt-3 flex items-center justify-between border-t border-zebra-border pt-3">
            <span className="font-text text-xs text-zebra-mute">{match.venue}</span>
            <span className="font-mono text-xs font-medium text-zebra-blue">
              <LiveCountdown kickoffIso={match.kickoff} />
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
