import { Video, Globe, Info, Database, Ticket, ShoppingBag, Radio } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { NavRow } from "@/components/mehr/NavRow";

// Bewusst ein kleiner, hochwertiger Service-Bereich — kein Sammelbecken.
// Nur Dinge, die jetzt tatsächlich funktionieren, siehe README (Mehr v1).
export default function MehrPage() {
  return (
    <AppShell>
      <header className="mb-6 flex items-start justify-between">
        <div>
          <p className="font-text text-xs uppercase tracking-wide text-zebra-mute">ZEBRA</p>
          <h1 className="font-display text-2xl font-bold uppercase tracking-wide text-zebra-ice">Mehr</h1>
        </div>
        <span className="font-display text-base font-bold leading-none tracking-[0.18em] text-zebra-blue">
          1902
        </span>
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

      {/*
        ZebraFM (V1.1 Sprint 01): stabile, matchübergreifend identische
        externe Stream-URL (live recherchiert und bestätigt) — kein
        eigener Audio-Player gebaut, da dafür kein Bedarf besteht. Bewusst
        kein LIVE-Badge: nicht jedes MSV-Spiel wird tatsächlich übertragen,
        eine Annahme allein aus einem laufenden Spiel wäre unehrlich.
      */}
      <section className="mb-6">
        <SectionHeader title="ZebraFM" />
        <a
          href="https://stream.zebrafm.de/live"
          target="_blank"
          rel="noopener noreferrer"
          className="block rounded-card border border-zebra-border bg-zebra-surface p-4"
        >
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-zebra-blue-dim text-zebra-blue">
              <Radio size={20} />
            </span>
            <div className="min-w-0">
              <p className="font-text text-sm font-semibold text-zebra-ice">
                Blinden- und Fanradio des MSV Duisburg
              </p>
              <p className="mt-0.5 font-text text-xs text-zebra-mute">Hören, was andere sehen!</p>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-center gap-1.5 rounded-control bg-zebra-blue py-2 font-text text-sm font-medium text-zebra-ice">
            <Radio size={14} />
            ZebraFM hören
          </div>
        </a>
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
