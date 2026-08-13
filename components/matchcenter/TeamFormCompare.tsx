import { FormMatch, TableEntry } from "@/types/table";
import { TeamRef } from "@/types/match";
import { FormCurve } from "@/components/form/FormCurve";
import { MSV_TEAM_ID } from "@/lib/constants";

export function TeamFormCompare({
  homeTeam,
  awayTeam,
  homeForm,
  awayForm,
}: {
  homeTeam: TeamRef;
  awayTeam: TeamRef;
  homeForm: FormMatch[];
  awayForm: FormMatch[];
}) {
  return (
    <div className="space-y-4 rounded-card border border-zebra-border bg-zebra-surface p-4">
      <div>
        <p className="mb-2 font-text text-[11px] uppercase tracking-wide text-zebra-mute">
          {homeTeam.shortName}
        </p>
        <FormCurve matches={homeForm} />
      </div>
      <div>
        <p className="mb-2 font-text text-[11px] uppercase tracking-wide text-zebra-mute">
          {awayTeam.shortName}
        </p>
        <FormCurve matches={awayForm} />
      </div>
    </div>
  );
}

/**
 * Kompakter Saisonvergleich (Platz/Punkte/Tore/Tordifferenz) — bewusst
 * als "Match Fact"-Card, keine HTML-Tabelle. Beide Werte kommen aus
 * derselben TableEntry, die auch Home/3.-Liga-Seite verwenden (siehe
 * app/spiele/[matchId]/page.tsx::getTeamTableEntry) — keine zweite
 * Tabellenberechnung. Aufrufer (MatchCenterView) blendet die ganze
 * Section aus, wenn eine Seite `null` ist — diese Komponente selbst
 * bleibt einfach und geht von zwei vorhandenen Entries aus.
 */
export function TablePositionCompare({
  homeEntry,
  awayEntry,
}: {
  homeEntry: TableEntry | null;
  awayEntry: TableEntry | null;
}) {
  return (
    <div className="flex overflow-hidden rounded-card border border-zebra-border">
      <TableCompareSide entry={homeEntry} />
      <div className="w-px bg-zebra-border" />
      <TableCompareSide entry={awayEntry} />
    </div>
  );
}

function TableCompareSide({ entry }: { entry: TableEntry | null }) {
  const isMsv = entry?.teamId === MSV_TEAM_ID;
  const diff = entry ? entry.goalsFor - entry.goalsAgainst : 0;

  return (
    <div className="flex-1 bg-zebra-surface p-4 text-center">
      <p
        className={`font-display text-sm font-bold uppercase tracking-wide ${
          isMsv ? "text-zebra-blue" : "text-zebra-ice"
        }`}
      >
        {entry?.teamShortName ?? "—"}
      </p>
      <p className={`mt-1 font-mono text-2xl font-bold ${isMsv ? "text-zebra-blue" : "text-zebra-ice"}`}>
        {entry ? `${entry.position}.` : "—"}
      </p>
      {entry && (
        <div className="mt-2 space-y-0.5 font-mono text-xs text-zebra-mute">
          <p>{entry.points} Pkt</p>
          <p>
            {entry.goalsFor}:{entry.goalsAgainst}
          </p>
          <p>
            {diff > 0 ? "+" : ""}
            {diff} TD
          </p>
        </div>
      )}
    </div>
  );
}
