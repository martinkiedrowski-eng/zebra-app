import { FormMatch, FormResult } from "@/types/table";

// Wichtig (Design-System-Update): Niederlagen verwenden den eigenen,
// gedämpften zebra-loss-Token — NICHT zebra-pulse. zebra-pulse bleibt
// exklusiv für LIVE/Dringlichkeit reserviert.
const STYLES: Record<FormResult, string> = {
  win: "bg-zebra-success text-zebra-void",
  draw: "border border-zebra-mute-2 text-zebra-mute bg-transparent",
  loss: "bg-zebra-loss text-zebra-ice",
};

const LETTER: Record<FormResult, string> = {
  win: "S",
  draw: "U",
  loss: "N",
};

export function FormCurve({ matches }: { matches: FormMatch[] }) {
  return (
    <div className="flex items-center gap-2">
      {matches.map((m) => (
        <div key={m.matchId} className="flex flex-col items-center gap-1">
          <span
            title={`${m.home ? "H" : "A"} vs ${m.opponentShortName} · ${m.scoreLabel}`}
            className={`flex h-6 w-6 items-center justify-center rounded-full font-text text-[11px] font-bold ${STYLES[m.result]}`}
          >
            {LETTER[m.result]}
          </span>
          <span className="font-text text-[10px] text-zebra-mute">{m.opponentShortName}</span>
        </div>
      ))}
    </div>
  );
}
