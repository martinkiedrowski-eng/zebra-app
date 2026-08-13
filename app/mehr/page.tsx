import { Video, Globe, Info, Database, Ticket, ShoppingBag } from "lucide-react";
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
          Offizielle Website + Tickets + ZebraShop bilden eine Gruppe
          (gleiche Card-/Row-Logik, gleiche Höhe, gleiche Typografie,
          gleiche External-Link-Kennzeichnung über NavRow selbst).
          Tickets/ZebraShop-URLs stammen von der Aufgabenstellung als
          offizielle MSV-Ziele — bewusst 1:1 übernommen, keine
          Tracking-Parameter ergänzt.
        */}
        <div className="flex flex-col gap-2">
          <NavRow icon={Globe} label="Offizielle Website" href="https://www.msv-duisburg.de/" external />
          <NavRow icon={Ticket} label="Tickets" href="https://www.ticket-onlineshop.com/ols/msv/de" external />
          <NavRow icon={ShoppingBag} label="ZebraShop" href="https://www.msv-zebrashop.de/" external />
        </div>
      </section>

      <section>
        <SectionHeader title="ZEBRA App" />
        <div className="flex flex-col gap-2">
          <NavRow icon={Info} label="Über ZEBRA" href="/mehr/ueber" />
          <NavRow icon={Database} label="Datenquellen" href="/mehr/datenquellen" />
        </div>
      </section>

      {/*
        Kein "Aufstiegs"-Menüpunkt, nur ein ruhiger Versionsabschluss.
        lucide-react besitzt kein tatsächliches Zebra-Icon (nur generische
        Tier-Icons wie PawPrint/Cat/Dog) — bewusst NICHT durch ein
        unpassendes generisches Tier-Icon ersetzt, stattdessen das
        Unicode-Zebra "🦓" wie vorgegeben.
      */}
      <div className="mt-10 flex flex-col items-center gap-1 pb-2">
        <span aria-hidden="true" className="text-lg leading-none">
          🦓
        </span>
        <span className="font-text text-[10px] font-medium uppercase tracking-wide text-zebra-mute">
          Zebra 1.0
        </span>
      </div>
    </AppShell>
  );
}
