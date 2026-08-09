import { AppShell } from "@/components/layout/AppShell";
import { ZebraStripe } from "@/components/match/ZebraStripe";
import { DATA_SOURCE_LABEL } from "@/providers/registry";

export default function MehrPage() {
  return (
    <AppShell>
      <header className="mb-6">
        <p className="font-text text-xs uppercase tracking-wide text-zebra-mute">ZEBRA</p>
        <h1 className="font-display text-2xl font-bold uppercase tracking-wide text-zebra-ice">Mehr</h1>
      </header>
      <div className="rounded-card border border-zebra-border bg-zebra-surface p-6">
        <ZebraStripe variant="blue" className="mb-4 w-10" />
        <p className="font-text text-sm leading-relaxed text-zebra-mute">
          Team/Kader, Gegner-Watch, Zebra TV, Gespeichert, Suche und Einstellungen werden hier gesammelt, sobald die
          jeweiligen Bereiche existieren.
        </p>
      </div>
      {/* Dezenter Datenquellen-Hinweis (Punkt 14) — bewusst hier, nicht auf Home. */}
      <p className="mt-6 font-text text-[11px] text-zebra-mute-2">Daten: {DATA_SOURCE_LABEL}</p>
    </AppShell>
  );
}
