import { MatchEvent } from "@/types/match";

const ICON_LABEL: Record<MatchEvent["type"], string> = {
  goal: "⚽",
  "yellow-card": "🟨",
  "red-card": "🟥",
  substitution: "⇄",
  halftime: "⏸",
};

export function MatchEventsList({ events }: { events: MatchEvent[] }) {
  const sorted = [...events].sort((a, b) => b.minute - a.minute);

  return (
    <div className="divide-y divide-zebra-border rounded-card border border-zebra-border bg-zebra-surface">
      {sorted.map((event) => (
        <div key={event.id} className="flex items-center gap-3 px-4 py-3">
          <span className="w-8 flex-shrink-0 font-mono text-xs font-medium text-zebra-mute">
            {event.minute}&apos;
          </span>
          <span aria-hidden="true" className="w-5 flex-shrink-0 text-center text-sm">
            {ICON_LABEL[event.type]}
          </span>
          <div className="min-w-0">
            {event.type === "halftime" ? (
              <p className="font-text text-sm font-medium uppercase tracking-wide text-zebra-mute">
                {event.detail ?? "Halbzeit"}
              </p>
            ) : (
              <p className="truncate font-text text-sm text-zebra-ice">
                {event.player}
                {event.detail ? <span className="text-zebra-mute"> · {event.detail}</span> : null}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
