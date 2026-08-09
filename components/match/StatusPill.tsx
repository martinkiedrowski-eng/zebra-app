import { MatchStatus } from "@/types/match";

const LABEL: Record<MatchStatus, string> = {
  scheduled: "Bevorstehend",
  live: "Live",
  halftime: "Halbzeit",
  finished: "Beendet",
  postponed: "Verlegt",
};

export function StatusPill({ status, minute }: { status: MatchStatus; minute?: number | null }) {
  const label = status === "live" && minute ? `Live · ${minute}'` : LABEL[status];

  const styles: Record<MatchStatus, string> = {
    scheduled: "border border-zebra-border text-zebra-mute",
    live: "bg-zebra-pulse text-zebra-ice animate-pulse-dot",
    halftime: "bg-zebra-surface-raised text-zebra-mute border border-zebra-border",
    finished: "bg-zebra-surface-raised text-zebra-ice",
    postponed: "border border-zebra-border text-zebra-mute-2",
  };

  return (
    <span
      className={`inline-flex items-center rounded-pill px-2.5 py-1 font-text text-[11px] font-medium uppercase tracking-wide ${styles[status]}`}
    >
      {label}
    </span>
  );
}
