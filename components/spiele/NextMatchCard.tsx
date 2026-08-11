import Link from "next/link";
import { Match } from "@/types/match";
import { MSV_TEAM_ID } from "@/lib/constants";
import { formatKickoffTime, formatCountdown } from "@/lib/format";
import { relativeMatchDateLabel } from "@/lib/spiele/relativeDate";
import { hasReliableMatchId } from "@/lib/spiele/matchLink";

export function NextMatchCard({
  match,
  isMockMode,
  competitionLabel,
}: {
  match: Match;
  isMockMode: boolean;
  /** "DFB-Pokal · 1. Runde" o.ä. — nur bei Pokalspielen gesetzt, Liga-Spiele unverändert. */
  competitionLabel?: string;
}) {
  const isHome = match.homeTeam.id === MSV_TEAM_ID;
  const opponent = isHome ? match.awayTeam : match.homeTeam;
  const hasKickoff = !!match.kickoff;
  // Nur klickbar, wenn Match Center für dieses Spiel voraussichtlich
  // tatsächlich auflöst — siehe lib/spiele/matchLink.ts. Gilt unverändert
  // und wettbewerbsunabhängig auch für Pokalspiele.
  const clickable = hasReliableMatchId(match.id, isMockMode);

  const body = (
    <>
      <div className="mb-3 flex items-center justify-between">
        <span className="font-text text-xs text-zebra-mute">
          {competitionLabel ?? `${match.competition}${match.matchday ? ` · ${match.matchday}. Spieltag` : ""}`}
        </span>
        <span className="rounded-pill bg-zebra-blue-dim px-2.5 py-1 font-text text-[10px] font-medium uppercase tracking-wide text-zebra-blue">
          {isHome ? "Heimspiel" : "Auswärtsspiel"}
        </span>
      </div>

      <div className="flex items-center justify-between">
        <span className="flex-1 font-display text-lg font-bold uppercase tracking-wide text-zebra-ice">
          {isHome ? "MSV" : opponent.shortName}
        </span>
        <span className="px-2 font-text text-xs text-zebra-mute">vs</span>
        <span className="flex-1 text-right font-display text-lg font-bold uppercase tracking-wide text-zebra-ice">
          {isHome ? opponent.shortName : "MSV"}
        </span>
      </div>

      {hasKickoff && (
        <div className="mt-3 flex items-center justify-between border-t border-zebra-border pt-3">
          <span className="font-mono text-sm font-medium text-zebra-ice">
            {relativeMatchDateLabel(match.kickoff)} · {formatKickoffTime(match.kickoff)}
          </span>
          <span className="font-mono text-xs font-medium text-zebra-blue">{formatCountdown(match.kickoff)}</span>
        </div>
      )}

      {match.venue && <p className="mt-2 font-text text-xs text-zebra-mute">{match.venue}</p>}
    </>
  );

  const className = "block rounded-card border border-zebra-border bg-zebra-surface p-4.5";

  if (!clickable) {
    return <div className={className}>{body}</div>;
  }

  return (
    <Link href={`/spiele/${match.id}`} className={className}>
      {body}
    </Link>
  );
}
