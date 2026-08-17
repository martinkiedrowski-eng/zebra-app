import { AppShell } from "@/components/layout/AppShell";
import { BackLink } from "@/components/mehr/BackLink";

const SOURCES = [
  { label: "Spieldaten & Tabelle", value: "OpenLigaDB" },
  { label: "Offizielle Vereinsnews", value: "MSV Duisburg" },
  { label: "Videos", value: "ZebraTV / YouTube" },
  { label: "MSV-News (extern)", value: "liga3-online.de" },
  { label: "3.-Liga-weite News", value: "Sportschau (ARD)" },
] as const;

// Bewusst nur die Quellen, die aktuell tatsächlich produktiv genutzt
// werden (siehe lib/newsFeed/aggregate.ts, providers/registry.ts).
// RevierSport ausdrücklich nicht aufgeführt (HTTP 403, nicht Teil des
// produktiven Feeds). Keine Debug-/technischen Details hier — die stehen
// ausschließlich unter /debug/*.
export default function DatenquellenPage() {
  return (
    <AppShell>
      <BackLink />
      <header className="mb-4">
        <p className="font-text text-xs uppercase tracking-wide text-zebra-mute">ZEBRA</p>
        <h1 className="font-display text-2xl font-bold uppercase tracking-wide text-zebra-ice">Datenquellen</h1>
      </header>

      <div className="divide-y divide-zebra-border rounded-card border border-zebra-border bg-zebra-surface">
        {SOURCES.map((s) => (
          <div key={s.label} className="flex items-center justify-between px-4 py-3">
            <span className="font-text text-sm text-zebra-ice">{s.label}</span>
            <span className="font-text text-xs text-zebra-mute">{s.value}</span>
          </div>
        ))}
      </div>

      <p className="mt-4 font-text text-xs text-zebra-mute-2">
        Die Aktualität einzelner Inhalte hängt von der jeweiligen Datenquelle ab.
      </p>
    </AppShell>
  );
}
