import { Video, Globe, Info, Database } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { NavRow } from "@/components/mehr/NavRow";

// Bewusst ein kleiner, hochwertiger Service-Bereich — kein Sammelbecken.
// Nur Dinge, die jetzt tatsächlich funktionieren, siehe README (Mehr v1).
export default function MehrPage() {
  return (
    <AppShell>
      <header className="mb-6">
        <p className="font-text text-xs uppercase tracking-wide text-zebra-mute">ZEBRA</p>
        <h1 className="font-display text-2xl font-bold uppercase tracking-wide text-zebra-ice">Mehr</h1>
      </header>

      <section className="mb-6">
        <SectionHeader title="ZebraTV" />
        <NavRow
          icon={Video}
          label="ZebraTV"
          sublabel="Videos, Interviews & Pressekonferenzen"
          href="/mehr/zebratv"
        />
      </section>

      <section className="mb-6">
        <SectionHeader title="MSV Duisburg" />
        {/*
          Nur die offizielle Website ist im Projekt belastbar als echte,
          bereits verifizierte URL vorhanden (Basis der News-/Debug-
          Pipeline). Tickets und Fanshop bewusst NICHT ergänzt — dafür
          liegt keine im Projekt belastbare URL vor, siehe Abschlussbericht.
        */}
        <NavRow icon={Globe} label="Offizielle Website" href="https://www.msv-duisburg.de/" external />
      </section>

      <section>
        <SectionHeader title="ZEBRA App" />
        <div className="flex flex-col gap-2">
          <NavRow icon={Info} label="Über ZEBRA" href="/mehr/ueber" />
          <NavRow icon={Database} label="Datenquellen" href="/mehr/datenquellen" />
        </div>
      </section>
    </AppShell>
  );
}
