import { FormMatch, TableEntry } from "@/types/table";
import { TeamRef } from "@/types/match";
import { FormCurve } from "@/components/form/FormCurve";

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

export function TablePositionCompare({
  homeEntry,
  awayEntry,
}: {
  homeEntry: TableEntry | null;
  awayEntry: TableEntry | null;
}) {
  return (
    <div className="flex overflow-hidden rounded-card border border-zebra-border">
      <div className="flex-1 bg-zebra-surface p-4 text-center">
        <p className="font-display text-sm font-bold uppercase tracking-wide text-zebra-ice">
          {homeEntry?.teamShortName ?? "—"}
        </p>
        <p className="mt-1 font-mono text-2xl font-bold text-zebra-ice">
          {homeEntry ? `Platz ${homeEntry.position}` : "—"}
        </p>
      </div>
      <div className="w-px bg-zebra-border" />
      <div className="flex-1 bg-zebra-surface p-4 text-center">
        <p className="font-display text-sm font-bold uppercase tracking-wide text-zebra-ice">
          {awayEntry?.teamShortName ?? "—"}
        </p>
        <p className="mt-1 font-mono text-2xl font-bold text-zebra-ice">
          {awayEntry ? `Platz ${awayEntry.position}` : "—"}
        </p>
      </div>
    </div>
  );
}
