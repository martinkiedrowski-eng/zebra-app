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

/**
 * `matches` darf `null`-Einträge enthalten (additiv, seit Home-Form-
 * Polish) — z.B. für Saisonbeginn mit weniger als 5 gespielten Spielen,
 * als neutrale, noch nicht belegte Slots. Match Center (TeamFormCompare)
 * übergibt weiterhin nie `null` und ist von dieser Erweiterung optisch
 * unberührt.
 */
export function FormCurve({ matches }: { matches: (FormMatch | null)[] }) {
  return (
    <div className="flex items-center gap-2">
      {matches.map((m, i) => (
        <div key={m ? m.matchId : `empty-${i}`} className="flex flex-col items-center gap-1">
          {m ? (
            <span
              title={`${m.home ? "H" : "A"} vs ${m.opponentShortName} · ${m.scoreLabel}`}
              className={`flex h-6 w-6 items-center justify-center rounded-full font-text text-[11px] font-bold ${STYLES[m.result]}`}
            >
              {LETTER[m.result]}
            </span>
          ) : (
            <span
              aria-hidden="true"
              className="flex h-6 w-6 items-center justify-center rounded-full border border-zebra-border font-text text-[11px] font-bold text-zebra-mute-2"
            >
              –
            </span>
          )}
          <span className="max-w-[40px] truncate font-text text-[10px] text-zebra-mute">
            {m ? m.opponentShortName : ""}
          </span>
        </div>
      ))}
    </div>
  );
}
