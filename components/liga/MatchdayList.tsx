import Link from "next/link";
import { Match } from "@/types/match";
import { StatusPill } from "@/components/match/StatusPill";
import { formatKickoffTime, formatDayGroupKey, formatDayGroupLabel } from "@/lib/format";
import { displayScore } from "@/lib/spiele/scoreDisplay";

interface DayGroup {
  key: string;
  label: string;
  matches: Match[];
}

function groupByDay(matches: Match[]): DayGroup[] {
  const groups = new Map<string, DayGroup>();

  for (const match of matches) {
    const key = formatDayGroupKey(match.kickoff);
    const existing = groups.get(key);
    if (existing) {
      existing.matches.push(match);
    } else {
      groups.set(key, { key, label: formatDayGroupLabel(match.kickoff), matches: [match] });
    }
  }

  // Gruppen-Keys sind YYYY-MM-DD (oder "9999-99-99" bei unbekanntem
  // Datum) — als String chronologisch sortierbar, unbekannte Termine
  // landen zuverlässig am Ende statt an zufälliger Stelle.
  return Array.from(groups.values())
    .sort((a, b) => a.key.localeCompare(b.key))
    .map((group) => ({
      ...group,
      matches: [...group.matches].sort((a, b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime()),
    }));
}

/**
 * `matchdayNumber` (optional) hängt den Navigationskontext `?from=3-liga&spieltag=N`
 * an die Match-Center-Links an (Polish Sprint 01, Punkt 5) — damit die
 * Matchdetailseite weiß, dass sie von hier kam, und "Zurück" zuverlässig
 * zu genau diesem Spieltag zurückführt statt pauschal zu Home. Ohne diese
 * Prop (z.B. falls die Komponente je anderswo ohne Spieltagsbezug genutzt
 * würde) verlinkt die Zeile weiterhin ohne Kontext-Parameter.
 */
export function MatchdayList({ matches, matchdayNumber }: { matches: Match[]; matchdayNumber?: number }) {
  const groups = groupByDay(matches);

  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <div key={group.key}>
          <p className="mb-2 font-text text-[11px] font-semibold uppercase tracking-wide text-zebra-mute">
            {group.label}
          </p>
          <div className="space-y-2">
            {group.matches.map((match) => (
              <MatchdayRow key={match.id} match={match} matchdayNumber={matchdayNumber} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function MatchdayRow({ match, matchdayNumber }: { match: Match; matchdayNumber?: number }) {
  // Die große Status-Pille war für "bevorstehend" reiner Platzverbrauch —
  // Uhrzeit bzw. Endstand machen den Zustand bereits eindeutig. Für
  // live/halftime bleibt die Pille, weil das ein echter, vorhandener
  // Status ist, kein neu erfundener.
  const showPill = match.status === "live" || match.status === "halftime";
  const hasValidKickoff = !Number.isNaN(new Date(match.kickoff).getTime());
  const score = displayScore(match);

  const href =
    matchdayNumber !== undefined
      ? `/spiele/${match.id}?from=3-liga&spieltag=${matchdayNumber}`
      : `/spiele/${match.id}`;

  return (
    <Link
      href={href}
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
          Breite abzuschneiden. Ohne die große Pille bleibt jetzt spürbar
          mehr Platz für beide Namen. */}
      <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
        <span
          className={`min-w-0 truncate text-right font-text text-sm ${
            match.isMsvMatch ? "font-semibold text-zebra-blue" : "text-zebra-ice"
          }`}
        >
          {match.homeTeam.shortName}
        </span>
      </div>

      <div className="flex-shrink-0 text-center">
        {match.status === "scheduled" ? (
          <span className="font-mono text-xs text-zebra-mute">
            {hasValidKickoff ? formatKickoffTime(match.kickoff) : "–"}
          </span>
        ) : (
          <>
            <span className="font-mono text-sm font-bold text-zebra-ice">
              {score.home}:{score.away}
            </span>
            {match.status === "finished" && match.halftimeScore && (
              <span className="block font-mono text-[10px] text-zebra-mute">
                ({match.halftimeScore.home}:{match.halftimeScore.away})
              </span>
            )}
          </>
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

      {showPill && <StatusPill status={match.status} minute={match.minute} />}
    </Link>
  );
}
