import { Metadata } from "next";
import { FOOTBALL_CONFIG } from "@/config/football";
import { footballDataProvider } from "@/providers/registry";
import { computeLiveTable, getTeamLiveContext } from "@/lib/tableEngine";
import { buildMatchLiveContext } from "@/lib/leagueContext";
import { prioritizeMultiplex } from "@/lib/multiplex";
import { MSV_TEAM_ID } from "@/lib/constants";

// Temporäre, isolierte Debug-Route für den Live-Matchday-Reality-Check
// während tatsächlich laufender 3.-Liga-Spiele. Ruft NUR lesend auf:
// - einen eigenen, redundanten Roh-Fetch (KEIN Import aus
//   providers/football/openligadb/client.ts, um den Provider nicht
//   anzufassen — identisches Muster wie der ursprüngliche
//   /debug/matchday-Probe aus einer früheren Phase)
// - die bestehenden, unveränderten footballDataProvider-/tableEngine-/
//   leagueContext-/multiplex-Funktionen
// Keine neue Produktionslogik, keine bestehende Seite verändert.
export const metadata: Metadata = {
  title: "ZEBRA — Live Matchday Reality Check (Debug)",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

interface RawFetchResult {
  ok: boolean;
  status: number | null;
  error: string | null;
  data: unknown[];
}

async function rawFetchJsonArray(url: string): Promise<RawFetchResult> {
  try {
    const res = await fetch(url, {
      cache: "no-store",
      headers: { "User-Agent": "Mozilla/5.0 (compatible; ZebraMatchdayProbe/0.2; debug-only)" },
    });
    if (!res.ok) return { ok: false, status: res.status, error: `HTTP ${res.status}`, data: [] };
    const json = await res.json();
    return { ok: true, status: res.status, error: null, data: Array.isArray(json) ? json : [] };
  } catch (err) {
    return { ok: false, status: null, error: err instanceof Error ? err.message : "Unbekannter Fehler", data: [] };
  }
}

async function rawFetchText(url: string): Promise<{ ok: boolean; status: number | null; text: string }> {
  try {
    const res = await fetch(url, { cache: "no-store" });
    const text = await res.text();
    return { ok: res.ok, status: res.status, text };
  } catch (err) {
    return { ok: false, status: null, text: err instanceof Error ? err.message : "Unbekannter Fehler" };
  }
}

function raw(obj: unknown, ...keys: string[]): unknown {
  if (typeof obj !== "object" || obj === null) return undefined;
  const o = obj as Record<string, unknown>;
  for (const k of keys) {
    if (k in o) return o[k];
  }
  return undefined;
}

function rawObj(obj: unknown, ...keys: string[]): Record<string, unknown> | null {
  const v = raw(obj, ...keys);
  return typeof v === "object" && v !== null ? (v as Record<string, unknown>) : null;
}

function rawMatchId(m: unknown): string {
  const v = raw(m, "MatchID", "matchID", "MatchId", "matchId");
  return v === undefined || v === null ? "" : String(v);
}

function rawTeamName(m: unknown, side: "Team1" | "Team2"): string {
  const teamObj = rawObj(m, side, side.toLowerCase());
  const name = teamObj ? raw(teamObj, "TeamName", "teamName") : undefined;
  return typeof name === "string" ? name : "?";
}

function rawGoalsArray(m: unknown): unknown[] {
  const v = raw(m, "Goals", "goals");
  return Array.isArray(v) ? v : [];
}

function findMinuteLikeKey(m: unknown): { key: string; value: unknown } | null {
  if (typeof m !== "object" || m === null) return null;
  const entries = Object.entries(m as Record<string, unknown>);
  const hit = entries.find(([k]) => /minut/i.test(k));
  return hit ? { key: hit[0], value: hit[1] } : null;
}

function fmt(v: unknown): string {
  if (v === undefined) return "(Feld nicht vorhanden)";
  if (v === null) return "null";
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

export default async function MatchdayDebugPage() {
  const now = new Date();
  const berlinTime = new Intl.DateTimeFormat("de-DE", {
    timeZone: "Europe/Berlin",
    dateStyle: "medium",
    timeStyle: "medium",
  }).format(now);

  const [normalizedMatchday, baselineTable] = await Promise.all([
    footballDataProvider.getCurrentMatchday(),
    footballDataProvider.getBaselineTable(),
  ]);

  const { leagueShortcut, season } = FOOTBALL_CONFIG;
  const matchdayNumber = normalizedMatchday.matchday;

  const rawMatchdayRes = await rawFetchJsonArray(
    `${FOOTBALL_CONFIG.baseUrl}/getmatchdata/${leagueShortcut}/${season}/${matchdayNumber}`
  );
  const lastChange = await rawFetchText(`${FOOTBALL_CONFIG.baseUrl}/getlastchangedate/${leagueShortcut}/${season}`);

  const liveTable = computeLiveTable(baselineTable, normalizedMatchday.matches);
  const msvLiveContext = getTeamLiveContext(liveTable, baselineTable, MSV_TEAM_ID);
  const msvHeadline = msvLiveContext ? buildMatchLiveContext(msvLiveContext) : null;

  const liveMatches = normalizedMatchday.matches.filter((m) => m.status === "live" || m.status === "halftime");
  const multiplexEntries = prioritizeMultiplex(normalizedMatchday.matches, baselineTable);
  const multiplexLive = multiplexEntries.filter((e) => e.match.status === "live" || e.match.status === "halftime");

  const sampleLiveMatch = liveMatches[0] ?? null;
  const sampleRawMatch = sampleLiveMatch
    ? rawMatchdayRes.data.find((m) => rawMatchId(m) === sampleLiveMatch.id) ?? null
    : null;

  const minuteCheck = sampleRawMatch ? findMinuteLikeKey(sampleRawMatch) : null;

  const msvBaseIndex = baselineTable.findIndex((e) => e.teamId === MSV_TEAM_ID);
  const neighborStart = msvBaseIndex >= 0 ? Math.max(0, msvBaseIndex - 2) : 0;
  const neighborEnd = msvBaseIndex >= 0 ? Math.min(baselineTable.length, msvBaseIndex + 3) : 0;

  return (
    <div style={{ background: "#0B0E13", color: "#F4F6FA", minHeight: "100vh", padding: 20, fontFamily: "monospace", fontSize: 13 }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>ZEBRA — Live Matchday Reality Check</h1>

      <section style={{ marginBottom: 20, borderBottom: "1px solid #333", paddingBottom: 12 }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>DEBUG ABGERUFEN</h2>
        <div>Europe/Berlin: {berlinTime}</div>
        <div>ISO: {now.toISOString()}</div>
      </section>

      <section style={{ marginBottom: 20, borderBottom: "1px solid #333", paddingBottom: 12 }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>B) ROHE OPENLIGADB-DATEN</h2>
        <div>
          League/Season/Spieltag: {leagueShortcut}/{season}/{matchdayNumber}
        </div>
        <div>HTTP Status: {rawMatchdayRes.status ?? "—"}</div>
        <div>Anzahl Spiele: {rawMatchdayRes.data.length}</div>
        <div>getlastchangedate: {lastChange.ok ? lastChange.text : `Fehler (${lastChange.status ?? "—"})`}</div>
        {rawMatchdayRes.error && <div style={{ color: "#FF3B4E" }}>Fetch-Fehler: {rawMatchdayRes.error}</div>}

        <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
          {rawMatchdayRes.data.map((m, i) => {
            const goals = rawGoalsArray(m);
            return (
              <div key={i} style={{ border: "1px solid #2a2a2a", padding: 6 }}>
                <div>
                  MatchID {rawMatchId(m)}: {rawTeamName(m, "Team1")} vs {rawTeamName(m, "Team2")}
                </div>
                <div>kickoff: {fmt(raw(m, "MatchDateTime", "matchDateTime"))}</div>
                <div>MatchIsFinished: {fmt(raw(m, "MatchIsFinished", "matchIsFinished"))}</div>
                <div>MatchResults: {fmt(raw(m, "MatchResults", "matchResults"))}</div>
                <div>numberOfViewers (nur diagnostisch): {fmt(raw(m, "NumberOfViewers", "numberOfViewers"))}</div>
                <div>Anzahl Goals/Events: {goals.length}</div>
              </div>
            );
          })}
          {rawMatchdayRes.data.length === 0 && <div style={{ color: "#888" }}>Keine Rohdaten verfügbar.</div>}
        </div>

        {sampleRawMatch && (
          <div style={{ marginTop: 10 }}>
            <div style={{ color: "#8B93A3" }}>ROHE TOP-LEVEL KEYS (Beispiel-Livespiel):</div>
            <div>{Object.keys(sampleRawMatch as object).join(", ")}</div>
            {rawGoalsArray(sampleRawMatch)[0] !== undefined && (
              <>
                <div style={{ color: "#8B93A3", marginTop: 4 }}>ROHE EVENT/GOAL KEYS (erstes Event):</div>
                <div>{Object.keys(rawGoalsArray(sampleRawMatch)[0] as object).join(", ")}</div>
              </>
            )}
          </div>
        )}
      </section>

      <section style={{ marginBottom: 20, borderBottom: "1px solid #333", paddingBottom: 12 }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>
          C) NORMALISIERT — footballDataProvider.getCurrentMatchday() (unverändert)
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {normalizedMatchday.matches.map((m) => (
            <div key={m.id} style={{ border: "1px solid #2a2a2a", padding: 6 }}>
              <div>
                {m.homeTeam.shortName} {m.homeScore ?? "–"}:{m.awayScore ?? "–"} {m.awayTeam.shortName} ·{" "}
                <strong>{m.status}</strong> · MatchID {m.id}
              </div>
              <div style={{ color: "#8B93A3" }}>
                kickoff: {m.kickoff} · minute (intern): {m.minute ?? "null (bewusst nicht vorgetäuscht)"} · Events:{" "}
                {m.events.length}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section style={{ marginBottom: 20, borderBottom: "1px solid #333", paddingBottom: 12 }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>D) LIVE MATCHES FOUND: {liveMatches.length}</h2>
        {liveMatches.length === 0 ? (
          <p>Aktuell kein von OpenLigaDB als live erkennbares Spiel.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {liveMatches.map((m) => {
              const rawM = rawMatchdayRes.data.find((r) => rawMatchId(r) === m.id) ?? null;
              return (
                <div key={m.id} style={{ border: "1px solid #1E5FD9", padding: 8 }}>
                  <div>
                    {m.homeTeam.shortName} {m.homeScore ?? "–"}:{m.awayScore ?? "–"} {m.awayTeam.shortName}
                  </div>
                  <div>raw MatchIsFinished: {fmt(rawM ? raw(rawM, "MatchIsFinished", "matchIsFinished") : undefined)}</div>
                  <div>normalisierter Status: {m.status}</div>
                  <div>getlastchangedate: {lastChange.ok ? lastChange.text : "—"}</div>
                  <div>Anzahl Events: {m.events.length}</div>
                  {rawGoalsArray(rawM).map((g, gi) => (
                    <div key={gi} style={{ paddingLeft: 8, borderLeft: "2px solid #1E5FD9", marginTop: 4 }}>
                      {fmt(raw(g, "ScoreTeam1", "scoreTeam1"))}:{fmt(raw(g, "ScoreTeam2", "scoreTeam2"))} ·{" "}
                      {fmt(raw(g, "GoalGetterName", "goalGetterName"))} · rohe Minute:{" "}
                      {fmt(raw(g, "MatchMinute", "matchMinute"))}
                    </div>
                  ))}
                  {rawM && rawGoalsArray(rawM).length === 0 && (
                    <div style={{ color: "#8B93A3", marginTop: 4 }}>Keine Goals im rohen Match-Objekt.</div>
                  )}
                  {rawM && (
                    <div style={{ marginTop: 4, color: "#8B93A3" }}>
                      raw Event Keys:{" "}
                      {rawGoalsArray(rawM)[0] ? Object.keys(rawGoalsArray(rawM)[0] as object).join(", ") : "(keine Goals)"}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section style={{ marginBottom: 20, borderBottom: "1px solid #333", paddingBottom: 12 }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>E) LIVE-TABELLE (lib/tableEngine.ts, unverändert)</h2>
        <div style={{ display: "flex", gap: 20 }}>
          <div>
            <div style={{ color: "#8B93A3" }}>BASE TABLE (Top 5 + MSV-Umfeld)</div>
            {[...baselineTable.slice(0, 5), ...baselineTable.slice(neighborStart, neighborEnd)]
              .filter((e, i, arr) => arr.findIndex((x) => x.teamId === e.teamId) === i)
              .map((e) => (
                <div key={e.teamId} style={{ fontWeight: e.teamId === MSV_TEAM_ID ? 700 : 400 }}>
                  {e.position}. {e.teamShortName} — {e.points} Pkt
                </div>
              ))}
          </div>
          <div>
            <div style={{ color: "#8B93A3" }}>LIVE TABLE (Top 5 + MSV-Umfeld)</div>
            {[...liveTable.slice(0, 5), ...liveTable.slice(neighborStart, neighborEnd)]
              .filter((e, i, arr) => arr.findIndex((x) => x.teamId === e.teamId) === i)
              .map((e) => (
                <div key={e.teamId} style={{ fontWeight: e.teamId === MSV_TEAM_ID ? 700 : 400 }}>
                  {e.position}. {e.teamShortName} — {e.points} Pkt
                </div>
              ))}
          </div>
        </div>
        <div style={{ marginTop: 10 }}>
          <div style={{ color: "#8B93A3" }}>MSV LIVE CONTEXT</div>
          {msvLiveContext ? (
            <div>
              Ausgangsplatz {msvLiveContext.previousPosition} → Live-Platz {msvLiveContext.currentPosition} ·{" "}
              {msvHeadline?.headline ?? ""}
            </div>
          ) : (
            <div>Kein MSV-Eintrag gefunden.</div>
          )}
        </div>
      </section>

      <section style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>F) MULTIPLEX (lib/multiplex.ts, unverändert)</h2>
        {multiplexLive.length === 0 ? (
          <p>Keine aktuell laufenden Spiele für den Multiplex.</p>
        ) : (
          multiplexLive.map((e) => (
            <div key={e.match.id}>
              {e.match.homeTeam.shortName} {e.match.homeScore}:{e.match.awayScore} {e.match.awayTeam.shortName}
              {e.relevanceReason ? ` (${e.relevanceReason})` : ""}
            </div>
          ))
        )}
      </section>

      <section>
        <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>CURRENT MATCH MINUTE AVAILABLE</h2>
        {!sampleRawMatch ? (
          <p>Kein Live-Spiel zum Prüfen vorhanden.</p>
        ) : minuteCheck ? (
          <div>
            JA — Feldname: <strong>{minuteCheck.key}</strong>, Rohwert: {fmt(minuteCheck.value)}
          </div>
        ) : (
          <div>NEIN — kein Top-Level-Feld mit &quot;Minute&quot; im Namen im rohen Beispiel-Livespiel gefunden.</div>
        )}
      </section>
    </div>
  );
}
