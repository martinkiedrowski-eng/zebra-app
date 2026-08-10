import { AppShell } from "@/components/layout/AppShell";
import { BackLink } from "@/components/mehr/BackLink";
import { ZebraStripe } from "@/components/match/ZebraStripe";

export default function UeberZebraPage() {
  return (
    <AppShell>
      <BackLink />
      <header className="mb-6">
        <p className="font-text text-xs uppercase tracking-wide text-zebra-mute">ZEBRA</p>
        <h1 className="font-display text-2xl font-bold uppercase tracking-wide text-zebra-ice">Über ZEBRA</h1>
      </header>

      <div className="rounded-card border border-zebra-border bg-zebra-surface p-5">
        <ZebraStripe variant="blue" className="mb-4 w-10" />
        <p className="font-text text-sm leading-relaxed text-zebra-ice">
          Die inoffizielle Matchday- und News-App für MSV-Fans.
        </p>
        <p className="mt-3 font-text text-sm leading-relaxed text-zebra-mute">
          Spiele. Tabelle. News. Matchday.
          <br />
          Alles Wichtige rund um den MSV an einem Ort.
        </p>
        <p className="mt-5 font-text text-xs text-zebra-mute-2">
          Inoffizielles Fanprojekt – keine Verbindung zum MSV Duisburg.
        </p>
      </div>
    </AppShell>
  );
}
