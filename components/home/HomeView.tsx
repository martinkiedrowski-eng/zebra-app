"use client";

import { useState } from "react";
import Link from "next/link";
import { Match } from "@/types/match";
import { TableEntry, FormMatch } from "@/types/table";
import { NewsFeedItem } from "@/types/newsFeed";
import { RadarEvent } from "@/types/radar";
import { MatchCard } from "@/components/match/MatchCard";
import { MatchEventsList } from "@/components/match/MatchEventsList";
import { RadarList } from "@/components/radar/RadarList";
import { TableExcerpt } from "@/components/table/TableExcerpt";
import { FormCurve } from "@/components/form/FormCurve";
import { NewsFeedRow } from "@/components/news/NewsFeedRow";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { hasReliableMatchId } from "@/lib/spiele/matchLink";

const FORM_SLOTS = 5;

/**
 * form kommt (wie bisher, unverändert über footballDataProvider.getMsvForm())
 * neuestes-zuerst sortiert. Für die Anzeige "ältestes → neuestes" wird
 * hier lokal umgedreht und auf FORM_SLOTS aufgefüllt — reine
 * Darstellungslogik, keine neue Datenquelle, kein Provider-Aufruf.
 * Auffüllung erfolgt bewusst rechts (spätere/unbekannte Slots), damit
 * z.B. nach einem Saisonspiel "S – – – –" entsteht statt "– – – – S".
 */
function buildFormSlots(form: FormMatch[]): (FormMatch | null)[] {
  const chronological = [...form].reverse();
  return Array.from({ length: FORM_SLOTS }, (_, i) => chronological[i] ?? null);
}

type MatchState = "next" | "live";

interface HomeViewProps {
  nextMatch: Match | null;
  /** "DFB-POKAL · 1. RUNDE" bei Pokal, sonst undefined — siehe app/page.tsx. */
  nextMatchCompetitionLabel?: string;
  liveMatch: Match | null;
  form: FormMatch[];
  table: TableEntry[];
  radarEvents: RadarEvent[];
  topNews: NewsFeedItem[];
  isDemoData: boolean;
  /** Nur im Mock-Modus gibt es den Next-Up/Live-Dev-Umschalter — im
   *  openligadb-Modus bestimmt allein, ob liveMatch !== null, den Zustand. */
  isMockMode: boolean;
}

export function HomeView({
  nextMatch,
  nextMatchCompetitionLabel,
  liveMatch,
  form,
  table,
  radarEvents,
  topNews,
  isDemoData,
  isMockMode,
}: HomeViewProps) {
  const [devState, setDevState] = useState<MatchState>("next");
  // Real-Modus: der Zustand ergibt sich ausschließlich daraus, ob gerade
  // ein echtes MSV-Live-Spiel existiert — kein Umschalter, keine Fiktion.
  const state: MatchState = isMockMode ? devState : liveMatch ? "live" : "next";
  const showLive = state === "live" && !!liveMatch;

  return (
    <>
      <header className="mb-4 flex items-start justify-between">
        <div>
          <p className="font-text text-xs uppercase tracking-wide text-zebra-mute">Heute beim</p>
          <h1 className="font-display text-2xl font-bold uppercase tracking-wide text-zebra-ice">
            MSV Duisburg
          </h1>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          {/* Rein typografisches Brand-Detail, kein Logo/Wappen. */}
          <span className="font-display text-base font-bold leading-none tracking-[0.18em] text-zebra-blue">
            1902
          </span>
          {isDemoData && (
            <span className="rounded-pill border border-zebra-border px-2.5 py-1 font-text text-[10px] font-medium uppercase tracking-wide text-zebra-mute-2">
              Demo-Daten
            </span>
          )}
        </div>
      </header>

      {/*
        Dev-/Demo-Umschalter für die beiden konzipierten Home-Zustände.
        Kein Produktfeature, ausschließlich Mock-Modus — im openligadb-
        Modus bestimmt der echte Spielstatus den Zustand automatisch.
      */}
      {isMockMode && (
        <div className="mb-6 flex items-center gap-2 rounded-card border border-dashed border-zebra-border p-2">
          <span className="pl-1 font-text text-[10px] uppercase tracking-wide text-zebra-mute-2">
            Dev-Zustand
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setDevState("next")}
              className={`rounded-pill px-3 py-1 font-text text-xs font-medium ${
                devState === "next" ? "bg-zebra-blue text-zebra-ice" : "text-zebra-mute"
              }`}
            >
              Next Up
            </button>
            <button
              onClick={() => setDevState("live")}
              className={`rounded-pill px-3 py-1 font-text text-xs font-medium ${
                devState === "live" ? "bg-zebra-pulse text-zebra-ice" : "text-zebra-mute"
              }`}
            >
              Live
            </button>
          </div>
        </div>
      )}

      {/* key erzwingt einen Remount bei Zustandswechsel -> die
          zebra-state-swap-Animation aus globals.css spielt genau einmal,
          das ist der geforderte orchestrierte Moment. */}
      <div key={state} className="zebra-state-swap">
        {showLive && liveMatch ? (
          <section className="mb-6">
            <Link href={`/spiele/${liveMatch.id}`} className="block">
              <MatchCard match={liveMatch} variant="live" />
            </Link>
          </section>
        ) : (
          nextMatch && (
            <section className="mb-6">
              <SectionHeader title="Next Up" />
              {hasReliableMatchId(nextMatch.id, isMockMode) ? (
                <Link href={`/spiele/${nextMatch.id}`} className="block">
                  <MatchCard match={nextMatch} variant="featured" competitionLabel={nextMatchCompetitionLabel} />
                </Link>
              ) : (
                <MatchCard match={nextMatch} variant="featured" competitionLabel={nextMatchCompetitionLabel} />
              )}
            </section>
          )
        )}

        {(showLive ? liveMatch!.events.length > 0 : radarEvents.length > 0) && (
          <section className="mb-6">
            <SectionHeader title={showLive ? "Spielereignisse" : "Zebra Radar"} />
            {showLive && liveMatch ? (
              <MatchEventsList events={liveMatch.events} />
            ) : (
              <RadarList events={radarEvents} />
            )}
          </section>
        )}

        <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <SectionHeader title="Tabelle" actionLabel="Alle" actionHref="/3-liga" muted={!!showLive} />
            <TableExcerpt entries={table} />
          </div>
          <div>
            <SectionHeader title="Form" muted={!!showLive} />
            <div className="rounded-card border border-zebra-border bg-zebra-surface p-4">
              <FormCurve matches={buildFormSlots(form)} />
            </div>
          </div>
        </section>

        {topNews.length > 0 && (
          <section className="mb-6">
            <SectionHeader title="News" actionLabel="Alle" actionHref="/news" muted={!!showLive} />
            <NewsFeedRow items={topNews} />
          </section>
        )}
      </div>
    </>
  );
}
