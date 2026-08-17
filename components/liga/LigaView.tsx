"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Match } from "@/types/match";
import { TableEntry } from "@/types/table";
import { LeagueTable } from "./LeagueTable";
import { MatchdayList } from "./MatchdayList";
import { LiveMultiplex } from "./LiveMultiplex";
import { ContextCard } from "@/components/ui/ContextCard";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { computeLiveTable, getTeamLiveContext } from "@/lib/tableEngine";
import { buildMsvLageContext } from "@/lib/leagueContext";
import { prioritizeMultiplex } from "@/lib/multiplex";
import { MSV_TEAM_ID } from "@/lib/constants";
import { formatMatchdayDateRange } from "@/lib/format";
import { FOOTBALL_CONFIG } from "@/config/football";

type Tab = "tabelle" | "spieltag";
type DevState = "normal" | "multiplex";

interface LigaViewProps {
  isMockMode: boolean;
  baselineTable: TableEntry[];
  matchdayNormal: Match[];
  matchdayMultiplex: Match[];
  /** Der tatsächlich AKTUELLE Spieltag — Grundlage für Tabelle/Live-Tabelle/Kontext, unabhängig davon, welcher Spieltag gerade durchgeblättert wird. */
  matchday: number;
  /** Der Spieltag, den der Nutzer sich gerade ansieht (Blättern über URL-Query, siehe app/3-liga/page.tsx). */
  browsedMatchday: number;
  browsedMatches: Match[];
  matchdayRange: { min: number; max: number };
  /** Der nach der 48h-Regel automatisch relevante Spieltag (Polish Sprint 01) — Ziel des "Aktueller Spieltag"-Rücksprungs. */
  relevantMatchday: number;
}

export function LigaView({
  isMockMode,
  baselineTable,
  matchdayNormal,
  matchdayMultiplex,
  matchday,
  browsedMatchday,
  browsedMatches,
  matchdayRange,
  relevantMatchday,
}: LigaViewProps) {
  const [tab, setTab] = useState<Tab>("spieltag");
  const [devState, setDevState] = useState<DevState>("normal");

  // Im openligadb-Modus gibt es keinen künstlichen "Multiplex Live"-
  // Zustand — matchdayMultiplex ist dort ohnehin schon der echte aktuelle
  // Spieltag (siehe app/3-liga/page.tsx), devState bleibt dann irrelevant.
  const matches = !isMockMode || devState === "normal" ? matchdayNormal : matchdayMultiplex;

  const liveTable = useMemo(() => computeLiveTable(baselineTable, matches), [baselineTable, matches]);
  const hasLiveMatches = matches.some((m) => m.status === "live" || m.status === "halftime");
  const isViewingCurrentMatchday = browsedMatchday === matchday;

  const msvContext = useMemo(() => {
    const teamContext = getTeamLiveContext(liveTable, baselineTable, MSV_TEAM_ID);
    return teamContext ? buildMsvLageContext(teamContext) : null;
  }, [liveTable, baselineTable]);

  // Nur bereits vorhandene, mathematisch sichere Tabellenfelder — keine
  // neue Berechnung, keine Prognose.
  const msvEntry = liveTable.find((e) => e.teamId === MSV_TEAM_ID) ?? null;

  const multiplexEntries = useMemo(() => prioritizeMultiplex(matches, baselineTable), [matches, baselineTable]);

  const matchdayDateRange = useMemo(
    () => formatMatchdayDateRange(browsedMatches.map((m) => m.kickoff)),
    [browsedMatches]
  );

  const atMin = browsedMatchday <= matchdayRange.min;
  const atMax = browsedMatchday >= matchdayRange.max;

  return (
    <>
      <header className="mb-4 flex items-start justify-between">
        <div>
          <p className="font-text text-xs uppercase tracking-wide text-zebra-mute">ZEBRA</p>
          <h1 className="font-display text-2xl font-bold uppercase tracking-wide text-zebra-ice">3. Liga</h1>
        </div>
        <span className="font-display text-base font-bold leading-none tracking-[0.18em] text-zebra-blue">
          1902
        </span>
      </header>

      {/* Dev-/Demo-Umschalter — nur Mock-Modus. */}
      {isMockMode && (
        <div className="mb-4 flex items-center gap-2 rounded-card border border-dashed border-zebra-border p-2">
          <span className="pl-1 font-text text-[10px] uppercase tracking-wide text-zebra-mute-2">Dev-Zustand</span>
          <div className="flex gap-1">
            <button
              onClick={() => setDevState("normal")}
              className={`rounded-pill px-3 py-1 font-text text-xs font-medium ${
                devState === "normal" ? "bg-zebra-blue text-zebra-ice" : "text-zebra-mute"
              }`}
            >
              Normal
            </button>
            <button
              onClick={() => setDevState("multiplex")}
              className={`rounded-pill px-3 py-1 font-text text-xs font-medium ${
                devState === "multiplex" ? "bg-zebra-pulse text-zebra-ice" : "text-zebra-mute"
              }`}
            >
              Multiplex Live
            </button>
          </div>
        </div>
      )}

      {/* Spieltag | Tabelle */}
      <div className="mb-6 flex gap-1 rounded-card border border-zebra-border bg-zebra-surface p-1">
        {(["spieltag", "tabelle"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 rounded-control py-2 font-text text-sm font-medium capitalize ${
              tab === t ? "bg-zebra-blue text-zebra-ice" : "text-zebra-mute"
            }`}
          >
            {t === "tabelle" ? "Tabelle" : "Spieltag"}
          </button>
        ))}
      </div>

      {tab === "tabelle" && (
        <div className="space-y-4">
          {msvContext && <ContextCard headline={msvContext.headline} direction={msvContext.direction} />}
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg font-bold uppercase tracking-wide text-zebra-ice">
              {hasLiveMatches ? "Live-Tabelle" : "Tabelle"}
            </h2>
            {hasLiveMatches && (
              <span className="rounded-pill bg-zebra-blue-dim px-2 py-0.5 font-text text-[10px] font-medium uppercase tracking-wide text-zebra-blue">
                vorläufig
              </span>
            )}
          </div>
          <LeagueTable entries={liveTable} />
        </div>
      )}

      {tab === "spieltag" && (
        <div className="space-y-6">
          <div>
            {/* Spieltagsnavigation: URL-getrieben (?spieltag=N), Grenzen
                kommen aus footballDataProvider.getSeasonMatchdayRange() —
                kein "Spieltag 0", kein Blättern über die Saisongrenze
                hinaus. */}
            <div className="mb-3 flex items-center justify-between">
              {atMin ? (
                <span className="p-1.5 text-zebra-mute-2">
                  <ChevronLeft size={18} />
                </span>
              ) : (
                <Link
                  href={`/3-liga?spieltag=${browsedMatchday - 1}`}
                  className="rounded-control p-1.5 text-zebra-mute hover:bg-zebra-surface-raised hover:text-zebra-ice"
                  aria-label="Vorheriger Spieltag"
                >
                  <ChevronLeft size={18} />
                </Link>
              )}
              <span className="font-display text-sm font-bold uppercase tracking-wide text-zebra-ice">
                {browsedMatchday}. Spieltag
                {matchdayDateRange && (
                  <span className="ml-2 font-text text-xs font-normal normal-case tracking-normal text-zebra-mute">
                    {matchdayDateRange}
                  </span>
                )}
              </span>
              {atMax ? (
                <span className="p-1.5 text-zebra-mute-2">
                  <ChevronRight size={18} />
                </span>
              ) : (
                <Link
                  href={`/3-liga?spieltag=${browsedMatchday + 1}`}
                  className="rounded-control p-1.5 text-zebra-mute hover:bg-zebra-surface-raised hover:text-zebra-ice"
                  aria-label="Nächster Spieltag"
                >
                  <ChevronRight size={18} />
                </Link>
              )}
            </div>
            {browsedMatchday !== relevantMatchday && (
              <div className="mb-3 flex justify-center">
                <Link
                  href={`/3-liga?spieltag=${relevantMatchday}`}
                  className="rounded-pill bg-zebra-blue-dim px-3 py-1 font-text text-xs font-medium text-zebra-blue"
                >
                  Aktueller Spieltag
                </Link>
              </div>
            )}
            <MatchdayList matches={browsedMatches} matchdayNumber={browsedMatchday} />
          </div>

          {isViewingCurrentMatchday && hasLiveMatches && <LiveMultiplex entries={multiplexEntries} />}

          {msvEntry && (
            <div>
              <SectionHeader title="MSV-Status" />
              <div className="rounded-card border border-zebra-border bg-zebra-surface p-4">
                <p className="font-display text-lg font-bold uppercase tracking-wide text-zebra-ice">
                  {msvEntry.position}. Platz
                </p>
                <p className="mt-1 font-mono text-sm text-zebra-mute">
                  {msvEntry.points} {msvEntry.points === 1 ? "Punkt" : "Punkte"} ·{" "}
                  {msvEntry.goalsFor - msvEntry.goalsAgainst > 0 ? "+" : ""}
                  {msvEntry.goalsFor - msvEntry.goalsAgainst} Tordifferenz
                </p>
                {msvContext && (
                  <p className="mt-3 border-t border-zebra-border pt-3 font-text text-sm text-zebra-ice">
                    {msvContext.headline}
                  </p>
                )}
              </div>

              {/*
                Saisonbilanz: bewusst dieselben msvEntry-Felder wie oben,
                keine zweite Berechnung. "Punkte" erscheint hier absichtlich
                NICHT noch einmal (steht bereits in MSV-Status direkt
                darüber) — nur S/U/N und Tore, um Redundanz zu vermeiden.
              */}
              <div className="mt-3 rounded-card border border-zebra-border bg-zebra-surface p-4">
                <p className="font-text text-[11px] font-medium uppercase tracking-wide text-zebra-mute">
                  Saison {FOOTBALL_CONFIG.season}/{String(FOOTBALL_CONFIG.season + 1).slice(-2)}
                </p>
                <p className="mt-1.5 font-mono text-sm font-medium text-zebra-ice">
                  {msvEntry.wins} S · {msvEntry.draws} U · {msvEntry.losses} N
                </p>
                <p className="mt-1 font-mono text-sm text-zebra-mute">
                  {msvEntry.goalsFor}:{msvEntry.goalsAgainst} Tore
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
