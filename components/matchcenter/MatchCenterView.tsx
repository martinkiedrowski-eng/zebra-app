"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Match } from "@/types/match";
import { FormMatch, TableEntry } from "@/types/table";
import { MatchAvailability, MatchContentItem } from "@/types/matchCenter";
import { MatchHero } from "./MatchHero";
import { MatchEventsList } from "@/components/match/MatchEventsList";
import { MatchFactsGrid } from "./MatchFactsGrid";
import { LineupList } from "./LineupList";
import { AvailabilityList } from "./AvailabilityList";
import { TeamFormCompare, TablePositionCompare } from "./TeamFormCompare";
import { ContextCard } from "@/components/ui/ContextCard";
import { MatchContentList } from "./MatchContentList";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { computeLiveTable, getTeamLiveContext } from "@/lib/tableEngine";
import { buildMatchLiveContext } from "@/lib/leagueContext";
import { MSV_TEAM_ID } from "@/lib/constants";

type MatchState = "preview" | "live" | "report";

interface MatchCenterViewProps {
  isMockMode: boolean;
  previewMatch: Match;
  liveMatch: Match;
  reportMatch: Match;
  homeForm: FormMatch[];
  awayForm: FormMatch[];
  homeTableEntry: TableEntry | null;
  awayTableEntry: TableEntry | null;
  availability: MatchAvailability;
  content: MatchContentItem[];
  baselineTable: TableEntry[];
  matchdayLive: Match[];
  matchdayReport: Match[];
}

const CONTENT_ORDER_PREVIEW = ["vorbericht", "pressekonferenz", "interview"] as const;
const CONTENT_ORDER_REPORT = ["spielbericht", "pressekonferenz", "interview", "highlights"] as const;

/** Im Real-Modus bestimmt allein match.status den Anzeigezustand — kein Umschalter, keine Fiktion. */
function deriveStateFromStatus(status: Match["status"]): MatchState {
  if (status === "finished") return "report";
  if (status === "live" || status === "halftime") return "live";
  return "preview";
}

export function MatchCenterView({
  isMockMode,
  previewMatch,
  liveMatch,
  reportMatch,
  homeForm,
  awayForm,
  homeTableEntry,
  awayTableEntry,
  availability,
  content,
  baselineTable,
  matchdayLive,
  matchdayReport,
}: MatchCenterViewProps) {
  const [devState, setDevState] = useState<MatchState>("preview");
  const [animKey, setAnimKey] = useState(0);

  function toggle(next: MatchState) {
    setDevState(next);
    setAnimKey((k) => k + 1);
  }

  const state: MatchState = isMockMode ? devState : deriveStateFromStatus(previewMatch.status);
  const match = state === "preview" ? previewMatch : state === "live" ? liveMatch : reportMatch;

  const hasAvailabilityData =
    availability.out.length > 0 || availability.doubtful.length > 0 || availability.returning.length > 0;

  // Echte Tabellenberechnungs-Engine statt ±1-Simulation — dieselbe
  // Funktion, die auch die 3.-Liga-Seite verwendet. Für PREVIEW ist noch
  // kein Spieltag-Ergebnis eingeflossen, daher keine Berechnung nötig.
  const isMsvInThisMatch = match.homeTeam.id === MSV_TEAM_ID || match.awayTeam.id === MSV_TEAM_ID;
  const context = useMemo(() => {
    if (!isMsvInThisMatch || state === "preview") return null;
    const matchdayMatches = state === "live" ? matchdayLive : matchdayReport;
    const liveTable = computeLiveTable(baselineTable, matchdayMatches);
    const teamContext = getTeamLiveContext(liveTable, baselineTable, MSV_TEAM_ID);
    // Polish Sprint 01, Punkt 12: sobald das Spiel abgeschlossen ist
    // (state === "report"), keine "mit diesem Stand..."-Formulierung mehr
    // — die Positionsverschiebung ist dann Realität, nicht Hypothese.
    return teamContext ? buildMatchLiveContext(teamContext, state === "report") : null;
  }, [state, baselineTable, matchdayLive, matchdayReport, isMsvInThisMatch]);

  const filteredContent =
    state === "preview"
      ? content.filter((c) => (CONTENT_ORDER_PREVIEW as readonly string[]).includes(c.type))
      : content.filter((c) => (CONTENT_ORDER_REPORT as readonly string[]).includes(c.type));

  // Navigationskontext (Polish Sprint 01, Punkt 5): "Zurück" führt zuverlässig
  // dorthin zurück, woher der Nutzer tatsächlich kam, statt pauschal zu
  // Home. ?from=3-liga&spieltag=N kommt von components/liga/MatchdayList.tsx,
  // ?from=spiele von components/spiele/NextMatchCard.tsx. Ohne den
  // Parameter (z.B. Aufruf von Home) bleibt Home der sinnvolle Fallback.
  const searchParams = useSearchParams();
  const from = searchParams.get("from");
  const fromSpieltag = searchParams.get("spieltag");
  const backHref =
    from === "3-liga"
      ? fromSpieltag
        ? `/3-liga?spieltag=${fromSpieltag}`
        : "/3-liga"
      : from === "spiele"
        ? "/spiele"
        : "/";

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <Link href={backHref} className="flex items-center gap-1.5 font-text text-sm text-zebra-mute hover:text-zebra-ice">
          <ArrowLeft size={18} strokeWidth={2} />
          Zurück
        </Link>
      </div>

      {/* Dev-/Demo-Umschalter — nur Mock-Modus. Im openligadb-Modus bestimmt
          match.status automatisch den Zustand, siehe deriveStateFromStatus. */}
      {isMockMode && (
        <div className="mb-6 flex items-center gap-2 rounded-card border border-dashed border-zebra-border p-2">
          <span className="pl-1 font-text text-[10px] uppercase tracking-wide text-zebra-mute-2">Dev-Zustand</span>
          <div className="flex gap-1">
            {(["preview", "live", "report"] as const).map((s) => (
              <button
                key={s}
                onClick={() => toggle(s)}
                className={`rounded-pill px-3 py-1 font-text text-xs font-medium capitalize ${
                  state === s
                    ? s === "live"
                      ? "bg-zebra-pulse text-zebra-ice"
                      : "bg-zebra-blue text-zebra-ice"
                    : "text-zebra-mute"
                }`}
              >
                {s === "preview" ? "Preview" : s === "live" ? "Live" : "Report"}
              </button>
            ))}
          </div>
        </div>
      )}

      <div key={animKey} className="zebra-state-swap space-y-6">
        <MatchHero match={match} />

        {state === "preview" && (
          <>
            <section>
              <SectionHeader title="Form" />
              <TeamFormCompare
                homeTeam={match.homeTeam}
                awayTeam={match.awayTeam}
                homeForm={homeForm}
                awayForm={awayForm}
              />
            </section>
            {/*
              DFB-Pokal-Schutz: der Saisonvergleich basiert ausschließlich
              auf der 3.-Liga-Tabelle (getTeamTableEntry). Bei einem
              Pokalgegner außerhalb der 3. Liga (z.B. SV Elversberg, 2.
              Bundesliga) liefert das `null` — dann komplett ausblenden,
              statt Nullwerte vorzutäuschen oder aus einer falschen Liga
              zu raten.
            */}
            {homeTableEntry && awayTableEntry && (
              <section>
                <SectionHeader title="Saisonvergleich" />
                <TablePositionCompare homeEntry={homeTableEntry} awayEntry={awayTableEntry} />
              </section>
            )}
            {hasAvailabilityData && (
              <section>
                <SectionHeader title="Personallage" />
                <AvailabilityList availability={availability} />
              </section>
            )}
            {filteredContent.length > 0 && (
              <section>
                <SectionHeader title="Relevante Inhalte" />
                <MatchContentList items={filteredContent} />
              </section>
            )}
          </>
        )}

        {state === "live" && (
          <>
            {match.events.length > 0 && (
              <section>
                <SectionHeader title="Ereignisse" />
                <MatchEventsList events={match.events} />
              </section>
            )}
            {match.stats && (
              <section>
                <SectionHeader title="Live Match Facts" />
                <MatchFactsGrid stats={match.stats} />
              </section>
            )}
            {match.lineup && (
              <section>
                <SectionHeader title="Aufstellung" />
                <LineupList lineup={match.lineup} homeTeam={match.homeTeam} awayTeam={match.awayTeam} />
              </section>
            )}
            {context && (
              <section>
                <SectionHeader title="Was bedeutet das gerade für den MSV?" />
                <ContextCard headline={context.headline} direction={context.direction} />
              </section>
            )}
          </>
        )}

        {state === "report" && (
          <>
            {match.events.length > 0 && (
              <section>
                <SectionHeader title="Tore & Ereignisse" />
                <MatchEventsList events={match.events} />
              </section>
            )}
            {match.stats && (
              <section>
                <SectionHeader title="Match Stats" />
                <MatchFactsGrid stats={match.stats} />
              </section>
            )}
            {match.lineup && (
              <section>
                <SectionHeader title="Aufstellungen" />
                <LineupList lineup={match.lineup} homeTeam={match.homeTeam} awayTeam={match.awayTeam} />
              </section>
            )}
            {context && (
              <section>
                <SectionHeader title="Tabellenwirkung" />
                <ContextCard headline={context.headline} direction={context.direction} />
              </section>
            )}
            {filteredContent.length > 0 && (
              <section>
                <SectionHeader title="Nach dem Spiel" />
                <MatchContentList items={filteredContent} />
              </section>
            )}
          </>
        )}
      </div>
    </>
  );
}
