import { Match } from "@/types/match";
import { StatusPill } from "@/components/match/StatusPill";
import { ZebraStripe } from "@/components/match/ZebraStripe";
import { formatKickoffDate, formatKickoffTime } from "@/lib/format";
import { LiveCountdown } from "@/components/match/LiveCountdown";
import { displayScore } from "@/lib/spiele/scoreDisplay";

export function MatchHero({ match }: { match: Match }) {
  const isLive = match.status === "live" || match.status === "halftime";
  const isFinished = match.status === "finished";

  return (
    <div
      className={`relative overflow-hidden rounded-card p-4.5 ${
        isLive ? "bg-zebra-surface-raised" : "bg-zebra-surface border border-zebra-border"
      }`}
    >
      {isLive && <ZebraStripe variant="pulse" className="absolute inset-x-0 top-0" />}

      <div className={`flex items-center justify-between ${isLive ? "pt-2" : ""} mb-4`}>
        <span className="font-text text-xs text-zebra-mute">
          {match.competition} · {match.matchday}. Spieltag
        </span>
        <StatusPill status={match.status} minute={match.minute} />
      </div>

      <div className="flex items-center justify-between">
        <span className="flex-1 font-display text-base font-bold uppercase tracking-wide text-zebra-ice">
          {match.homeTeam.shortName}
        </span>

        {match.status === "scheduled" ? (
          <span className="font-mono text-3xl font-medium text-zebra-ice">
            {formatKickoffTime(match.kickoff)}
          </span>
        ) : (
          <span
            className={`font-mono font-bold text-zebra-ice ${isLive ? "text-5xl" : "text-4xl"}`}
          >
            {displayScore(match).home}:{displayScore(match).away}
          </span>
        )}

        <span className="flex-1 text-right font-display text-base font-bold uppercase tracking-wide text-zebra-ice">
          {match.awayTeam.shortName}
        </span>
      </div>

      {isFinished && match.halftimeScore && (
        <p className="mt-1 text-center font-mono text-xs text-zebra-mute">
          Halbzeit {match.halftimeScore.home}:{match.halftimeScore.away}
        </p>
      )}

      <div className="mt-3 flex items-center justify-between border-t border-zebra-border pt-3">
        <span className="font-text text-xs text-zebra-mute">
          {formatKickoffDate(match.kickoff)} · {match.venue}
        </span>
        {match.status === "scheduled" && (
          <span className="font-mono text-xs font-medium text-zebra-blue">
            <LiveCountdown kickoffIso={match.kickoff} />
          </span>
        )}
      </div>

      {isLive && <ZebraStripe variant="pulse" className="absolute inset-x-0 bottom-0" />}
    </div>
  );
}
