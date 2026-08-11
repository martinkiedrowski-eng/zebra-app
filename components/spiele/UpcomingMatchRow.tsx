import { Match } from "@/types/match";
import { MSV_TEAM_ID } from "@/lib/constants";
import { formatKickoffTime } from "@/lib/format";
import { relativeMatchDateLabel } from "@/lib/spiele/relativeDate";

/**
 * Bewusst NICHT antippbar: Für kommende Spiele generell gibt es aktuell
 * keine verifiziert zuverlässige Match-Center-Zielroute (siehe
 * lib/spiele/matchLink.ts) — eine scheinbare Interaktion ohne
 * funktionierendes Ziel ist schlechter als gar keine. Kein Link, damit
 * auch keine Fehlerseite entstehen kann.
 */
export function UpcomingMatchRow({
  match,
  competitionLabel,
}: {
  match: Match;
  /** Nur bei Pokalspielen gesetzt — Liga-Zeilen bleiben optisch unverändert. */
  competitionLabel?: string;
}) {
  const isHome = match.homeTeam.id === MSV_TEAM_ID;
  const opponent = isHome ? match.awayTeam : match.homeTeam;
  const hasKickoff = !!match.kickoff;

  return (
    <div className="rounded-card border border-zebra-border bg-zebra-surface px-4 py-3">
      <div className="flex items-center gap-3">
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
      </div>
      {competitionLabel && (
        <p className="mt-1.5 pl-[76px] font-text text-[10px] font-medium uppercase tracking-wide text-zebra-blue">
          {competitionLabel}
        </p>
      )}
    </div>
  );
}
