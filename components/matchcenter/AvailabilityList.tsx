import { MatchAvailability } from "@/types/matchCenter";

function Group({ label, items, tone }: { label: string; items: string[]; tone: "loss" | "mute" | "success" }) {
  if (items.length === 0) return null;
  const dotColor = tone === "loss" ? "bg-zebra-loss" : tone === "success" ? "bg-zebra-success" : "bg-zebra-mute-2";

  return (
    <div>
      <p className="mb-1.5 font-text text-[11px] uppercase tracking-wide text-zebra-mute">{label}</p>
      <ul className="space-y-1.5">
        {items.map((item) => (
          <li key={item} className="flex items-center gap-2 font-text text-sm text-zebra-ice">
            <span className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${dotColor}`} aria-hidden="true" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function AvailabilityList({ availability }: { availability: MatchAvailability }) {
  return (
    <div className="space-y-4 rounded-card border border-zebra-border bg-zebra-surface p-4">
      <Group label="Ausfälle" items={availability.out} tone="loss" />
      <Group label="Fraglich" items={availability.doubtful} tone="mute" />
      <Group label="Rückkehrer" items={availability.returning} tone="success" />
    </div>
  );
}
