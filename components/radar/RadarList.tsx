import { RadarEvent } from "@/types/radar";

function timeAgo(iso: string): string {
  const diffMin = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (diffMin < 60) return `vor ${diffMin} Min`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return `vor ${diffH} Std`;
  return `vor ${Math.round(diffH / 24)} Tg`;
}

export function RadarList({ events }: { events: RadarEvent[] }) {
  return (
    <div className="divide-y divide-zebra-border rounded-card border border-zebra-border bg-zebra-surface">
      {events.map((event) => (
        <div key={event.id} className="flex items-start gap-3 px-4 py-3">
          {event.relevance === "high" ? (
            <span
              aria-hidden="true"
              className="mt-1.5 h-2.5 w-2.5 flex-shrink-0 rounded-full"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(-45deg, #FF3B4E 0 2px, transparent 2px 4px)",
              }}
            />
          ) : (
            <span
              aria-hidden="true"
              className="mt-1.5 h-2.5 w-2.5 flex-shrink-0 rounded-full bg-zebra-mute-2"
            />
          )}
          <div className="min-w-0">
            <p className="font-text text-sm text-zebra-ice">{event.headline}</p>
            <p className="mt-0.5 font-text text-[11px] text-zebra-mute">{timeAgo(event.timestamp)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
