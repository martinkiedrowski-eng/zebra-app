"use client";

import { useState } from "react";
import Link from "next/link";
import { FormMatch } from "@/types/table";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { hasReliableMatchId } from "@/lib/spiele/matchLink";
import { MsvSeasonCheck, VenueSplit, LeagueCheckResult, formatDe1 } from "@/lib/leagueStats";
import { GoalGetter } from "@/lib/stats/goalGetters";

interface StatsViewProps {
  seasonCheck: MsvSeasonCheck | null;
  homeSplit: VenueSplit;
  awaySplit: VenueSplit;
  leagueCheck: LeagueCheckResult | null;
  form: FormMatch[];
  goalGetters: GoalGetter[];
  isMockMode: boolean;
}

function Kpi({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex-1 rounded-card border border-zebra-border bg-zebra-surface p-3 text-center">
      <p className="font-mono text-base font-bold text-zebra-ice">{value}</p>
      <p className="mt-0.5 font-text text-[10px] uppercase tracking-wide text-zebra-mute">{label}</p>
    </div>
  );
}

function VenueCard({ title, split, rank }: { title: string; split: VenueSplit; rank: number | null }) {
  return (
    <div className="flex-1 rounded-card border border-zebra-border bg-zebra-surface p-4">
      <p className="font-text text-[11px] font-semibold uppercase tracking-wide text-zebra-mute">{title}</p>
      {split.played === 0 ? (
        <p className="mt-2 font-text text-sm text-zebra-mute-2">Noch kein Spiel absolviert.</p>
      ) : (
        <>
          <p className="mt-2 font-mono text-xs text-zebra-mute">
            {split.played} {split.played === 1 ? "Spiel" : "Spiele"}
          </p>
          <p className="mt-1 font-mono text-sm font-medium text-zebra-ice">
            {split.wins} S · {split.draws} U · {split.losses} N
          </p>
          <p className="mt-1 font-mono text-sm text-zebra-mute">
            {split.goalsFor}:{split.goalsAgainst} Tore
          </p>
          <p className="mt-1 font-mono text-sm font-bold text-zebra-ice">{split.points} Punkte</p>
          {rank !== null && (
            <p className="mt-2 border-t border-zebra-border pt-2 font-text text-xs text-zebra-blue">
              {title === "Zu Hause" ? "Heimtabelle" : "Auswärtstabelle"}: Platz {rank}
            </p>
          )}
        </>
      )}
    </div>
  );
}

function LeagueCheckRow({ label, rank }: { label: string; rank: number | null }) {
  return (
    <div className="flex items-center justify-between border-b border-zebra-border px-4 py-2.5 last:border-b-0">
      <span className="font-text text-sm text-zebra-ice">{label}</span>
      <span className="font-mono text-sm font-bold text-zebra-blue">{rank !== null ? `Platz ${rank}` : "—"}</span>
    </div>
  );
}

export function StatsView({
  seasonCheck,
  homeSplit,
  awaySplit,
  leagueCheck,
  form,
  goalGetters,
  isMockMode,
}: StatsViewProps) {
  const [showAllScorers, setShowAllScorers] = useState(false);
  const visibleGoalGetters = showAllScorers ? goalGetters : goalGetters.slice(0, 5);

  return (
    <div className="space-y-6">
      {seasonCheck && (
        <div>
          <SectionHeader title="MSV Duisburg" />
          <div className="rounded-card border border-zebra-border bg-zebra-surface p-4">
            <p className="font-display text-lg font-bold uppercase tracking-wide text-zebra-ice">
              {seasonCheck.position}. Platz
            </p>
            <p className="mt-1 font-mono text-sm text-zebra-mute">
              {seasonCheck.points} {seasonCheck.points === 1 ? "Punkt" : "Punkte"} ·{" "}
              {seasonCheck.goalDiff > 0 ? "+" : ""}
              {seasonCheck.goalDiff} Tordifferenz
            </p>
            <p className="mt-1 font-mono text-sm text-zebra-ice">
              {seasonCheck.wins} S · {seasonCheck.draws} U · {seasonCheck.losses} N
            </p>
            <p className="mt-1 font-mono text-sm text-zebra-mute">
              {seasonCheck.goalsFor}:{seasonCheck.goalsAgainst} Tore
            </p>

            {(seasonCheck.goalsPerGame !== null ||
              seasonCheck.concededPerGame !== null ||
              seasonCheck.pointsQuotaPercent !== null) && (
              <div className="mt-3 flex gap-2 border-t border-zebra-border pt-3">
                {seasonCheck.goalsPerGame !== null && (
                  <Kpi value={formatDe1(seasonCheck.goalsPerGame)} label="Tore/Spiel" />
                )}
                {seasonCheck.concededPerGame !== null && (
                  <Kpi value={formatDe1(seasonCheck.concededPerGame)} label="Gegentore/Spiel" />
                )}
                {seasonCheck.pointsQuotaPercent !== null && (
                  <Kpi value={`${seasonCheck.pointsQuotaPercent} %`} label="Punktequote" />
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <div>
        <SectionHeader title="Heim & Auswärts" />
        <div className="flex gap-3">
          <VenueCard title="Zu Hause" split={homeSplit} rank={leagueCheck?.homeRank ?? null} />
          <VenueCard title="Auswärts" split={awaySplit} rank={leagueCheck?.awayRank ?? null} />
        </div>
      </div>

      <div>
        <SectionHeader title="Form – Letzte 5" />
        {form.length === 0 ? (
          <div className="rounded-card border border-zebra-border bg-zebra-surface p-4 text-center">
            <p className="font-text text-sm text-zebra-mute">Noch keine abgeschlossenen Ligaspiele.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-card border border-zebra-border bg-zebra-surface">
            {form.map((m) => {
              const letter = m.result === "win" ? "S" : m.result === "draw" ? "U" : "N";
              const color =
                m.result === "win"
                  ? "text-zebra-success"
                  : m.result === "loss"
                    ? "text-zebra-loss"
                    : "text-zebra-mute";
              const clickable = hasReliableMatchId(m.matchId, isMockMode);
              const row = (
                <div className="flex items-center gap-3 border-b border-zebra-border px-4 py-2.5 last:border-b-0">
                  <span className={`w-5 font-mono text-sm font-bold ${color}`}>{letter}</span>
                  <span className="w-14 font-mono text-sm text-zebra-ice">{m.scoreLabel}</span>
                  <span className="flex-1 truncate font-text text-sm text-zebra-mute">
                    {m.home ? "vs." : "bei"} {m.opponentShortName}
                  </span>
                </div>
              );
              return clickable ? (
                <Link
                  key={m.matchId}
                  href={`/spiele/${m.matchId}?from=3-liga`}
                  className="block hover:bg-zebra-surface-raised"
                >
                  {row}
                </Link>
              ) : (
                <div key={m.matchId}>{row}</div>
              );
            })}
          </div>
        )}
      </div>

      {leagueCheck && (
        <div>
          <SectionHeader title="Liga-Check" />
          <div className="overflow-hidden rounded-card border border-zebra-border bg-zebra-surface">
            <LeagueCheckRow label="Tore" rank={leagueCheck.goalsForRank} />
            <LeagueCheckRow label="Gegentore" rank={leagueCheck.goalsAgainstRank} />
            <LeagueCheckRow label="Tordifferenz" rank={leagueCheck.goalDiffRank} />
            <LeagueCheckRow label="Heim" rank={leagueCheck.homeRank} />
            <LeagueCheckRow label="Auswärts" rank={leagueCheck.awayRank} />
          </div>
        </div>
      )}

      <div>
        <SectionHeader title="Torjäger" />
        {goalGetters.length === 0 ? (
          <div className="rounded-card border border-zebra-border bg-zebra-surface p-4 text-center">
            <p className="font-text text-sm text-zebra-mute">Torjägerliste aktuell nicht verfügbar.</p>
          </div>
        ) : (
          <>
            <div className="overflow-hidden rounded-card border border-zebra-border bg-zebra-surface">
              {visibleGoalGetters.map((g) => (
                <div
                  key={`${g.rank}-${g.name}`}
                  className="flex items-center gap-3 border-b border-zebra-border px-4 py-2.5 last:border-b-0"
                >
                  <span className="w-6 font-mono text-sm text-zebra-mute">{g.rank}.</span>
                  <span className="flex-1 truncate font-text text-sm text-zebra-ice">{g.name}</span>
                  <span className="font-mono text-sm font-bold text-zebra-ice">{g.goals}</span>
                </div>
              ))}
            </div>
            {goalGetters.length > 5 && (
              <button
                onClick={() => setShowAllScorers((v: boolean) => !v)}
                className="mt-2 w-full rounded-control py-2 font-text text-xs font-medium text-zebra-blue"
              >
                {showAllScorers ? "Weniger anzeigen" : "Alle anzeigen"}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
