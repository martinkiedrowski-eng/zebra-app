import { AppShell } from "@/components/layout/AppShell";
import { ZebraStripe } from "@/components/match/ZebraStripe";

export function PlaceholderPage({ title, note }: { title: string; note: string }) {
  return (
    <AppShell>
      <header className="mb-6">
        <p className="font-text text-xs uppercase tracking-wide text-zebra-mute">ZEBRA</p>
        <h1 className="font-display text-2xl font-bold uppercase tracking-wide text-zebra-ice">
          {title}
        </h1>
      </header>
      <div className="rounded-card border border-zebra-border bg-zebra-surface p-6">
        <ZebraStripe variant="blue" className="mb-4 w-10" />
        <p className="font-text text-sm leading-relaxed text-zebra-mute">{note}</p>
      </div>
    </AppShell>
  );
}
