"use client";

import { useMemo, useState } from "react";
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

type Tab = "tabelle" | "spieltag";
type DevState = "normal" | "multiplex";

interface LigaViewProps {
  isMockMode: boolean;
  baselineTable: TableEntry[];
  matchdayNormal: Match[];
  matchdayMultiplex: Match[];
  matchday: number;
}

export function LigaView({ isMockMode, baselineTable, matchdayNormal, matchdayMultiplex, matchday }: LigaViewProps) {
  const [tab, setTab] = useState<Tab>("tabelle");
  const [devState, setDevState] = useState<DevState>("normal");

  // Im openligadb-Modus gibt es keinen künstlichen "Multiplex Live"-
  // Zustand — matchdayMultiplex ist dort ohnehin schon der echte aktuelle
  // Spieltag (siehe app/3-liga/page.tsx), devState bleibt dann irrelevant.
  const matches = !isMockMode || devState === "normal" ? matchdayNormal : matchdayMultiplex;

  const liveTable = useMemo(() => computeLiveTable(baselineTable, matches), [baselineTable, matches]);
  const hasLiveMatches = matches.some((m) => m.status === "live" || m.status === "halftime");

  const msvContext = useMemo(() => {
    const teamContext = getTeamLiveContext(liveTable, baselineTable, MSV_TEAM_ID);
    return teamContext ? buildMsvLageContext(teamContext) : null;
  }, [liveTable, baselineTable]);

  const multiplexEntries = useMemo(() => prioritizeMultiplex(matches, baselineTable), [matches, baselineTable]);

  return (
    <>
      <header className="mb-4">
        <p className="font-text text-xs uppercase tracking-wide text-zebra-mute">ZEBRA</p>
        <h1 className="font-display text-2xl font-bold uppercase tracking-wide text-zebra-ice">3. Liga</h1>
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

      {/* Tabelle | Spieltag */}
      <div className="mb-6 flex gap-1 rounded-card border border-zebra-border bg-zebra-surface p-1">
        {(["tabelle", "spieltag"] as const).map((t) => (
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
            <SectionHeader title={`${matchday}. Spieltag`} />
            <MatchdayList matches={matches} />
          </div>

          {hasLiveMatches && <LiveMultiplex entries={multiplexEntries} />}

          {msvContext && (
            <div>
              <SectionHeader title="Spieltag für den MSV" />
              <ContextCard headline={msvContext.headline} direction={msvContext.direction} />
            </div>
          )}
        </div>
      )}
    </>
  );
}
