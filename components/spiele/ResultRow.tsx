import { Match } from "@/types/match";
import { MSV_TEAM_ID } from "@/lib/constants";
import { formatKickoffDate } from "@/lib/format";
import { computeMsvResultLabel } from "@/lib/spiele/matchResult";

const BADGE_STYLE = {
  S: "bg-zebra-success text-zebra-void",
  U: "border border-zebra-mute-2 text-zebra-mute",
  N: "bg-zebra-loss text-zebra-ice",
} as const;

/** Bewusst NICHT antippbar — siehe UpcomingMatchRow.tsx für die Begründung. */
export function ResultRow({
  match,
  competitionLabel,
}: {
  match: Match;
  /** Nur bei Pokalspielen gesetzt — Liga-Zeilen bleiben optisch unverändert. */
  competitionLabel?: string;
}) {
  const isHome = match.homeTeam.id === MSV_TEAM_ID;
  const opponent = isHome ? match.awayTeam : match.homeTeam;
  const label = computeMsvResultLabel(match);
  const hasScore = match.homeScore !== null && match.awayScore !== null;

  return (
    <div className="rounded-card border border-zebra-border bg-zebra-surface px-4 py-3">
      <div className="flex items-center gap-3">
        <span className="w-16 flex-shrink-0 font-mono text-xs text-zebra-mute">
          {match.kickoff ? formatKickoffDate(match.kickoff) : "–"}
        </span>
        <span className="w-6 flex-shrink-0 font-text text-[11px] font-medium uppercase text-zebra-mute">
          {isHome ? "H" : "A"}
        </span>
        <span className="min-w-0 flex-1 truncate font-text text-sm text-zebra-ice">{opponent.shortName}</span>
        {hasScore && (
          <span className="flex-shrink-0 font-mono text-sm font-bold text-zebra-ice">
            {isHome ? match.homeScore : match.awayScore}:{isHome ? match.awayScore : match.homeScore}
          </span>
        )}
        {label && (
          <span
            className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full font-text text-[10px] font-bold ${BADGE_STYLE[label]}`}
          >
            {label}
          </span>
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
