import { Metadata } from "next";
import { FOOTBALL_CONFIG } from "@/config/football";
import { footballDataProvider } from "@/providers/registry";
import { computeLiveTable, getTeamLiveContext } from "@/lib/tableEngine";
import { buildMatchLiveContext } from "@/lib/leagueContext";
import { MSV_TEAM_ID } from "@/lib/constants";

// Temporäre, isolierte Debug-Route — analog zu /debug/content-sources.
// Ruft NUR lesend auf: rohe OpenLigaDB-Response (eigener, redundanter
// Fetch, KEIN Import aus providers/football/openligadb/client.ts, um den
// Provider nicht anzufassen) und die bestehenden, unveränderten
// footballDataProvider-/tableEngine-Funktionen. Keine neue
// Produktionslogik, keine UI-Änderung an bestehenden Seiten.
export const metadata: Metadata = {
  title: "ZEBRA — Matchday Reality Check (Debug)",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

interface RawFieldPeek {
  topLevelKeys: string[];
  team1Keys: string[];
  groupKeys: string[];
  firstGoalKeys: string[];
  matchIsFinishedRaw: unknown;
  resultsCount: number | null;
  goalsCount: number | null;
}

async function fetchRawMatchday(): Promise<
  { ok: true; status: number; raw: unknown[]; lastChangeDate: string | null } | { ok: false; error: string }
> {
  const { baseUrl, leagueShortcut, season } = FOOTBALL_CONFIG;
  try {
    const res = await fetch(`${baseUrl}/getmatchdata/${leagueShortcut}/${season}`, {
      cache: "no-store",
      headers: { "User-Agent": "Mozilla/5.0 (compatible; ZebraMatchdayProbe/0.1; debug-only)" },
    });
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };
    const raw = await res.json();
    if (!Array.isArray(raw)) return { ok: false, error: "Antwort ist kein Array" };

    let lastChangeDate: string | null = null;
    try {
      const lcRes = await fetch(`${baseUrl}/getlastchangedate/${leagueShortcut}/${season}`, {
        cache: "no-store",
      });
      if (lcRes.ok) lastChangeDate = await lcRes.text();
    } catch {
      // nicht kritisch für die Diagnose
    }

    return { ok: true, status: res.status, raw, lastChangeDate };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unbekannter Fehler" };
  }
}

function peekRawFields(raw: unknown): RawFieldPeek | null {
  if (typeof raw !== "object" || raw === null) return null;
  const obj = raw as Record<string, unknown>;
  const topLevelKeys = Object.keys(obj);

  const team1 = obj["Team1"] ?? obj["team1"];
  const team1Keys = typeof team1 === "object" && team1 !== null ? Object.keys(team1) : [];

  const group = obj["Group"] ?? obj["group"];
  const groupKeys = typeof group === "object" && group !== null ? Object.keys(group) : [];

  const goalsRaw = obj["Goals"] ?? obj["goals"];
  const goalsArray = Array.isArray(goalsRaw) ? goalsRaw : [];
  const firstGoal = goalsArray[0];
  const firstGoalKeys = typeof firstGoal === "object" && firstGoal !== null ? Object.keys(firstGoal) : [];

  const resultsRaw = obj["MatchResults"] ?? obj["matchResults"];
  const resultsArray = Array.isArray(resultsRaw) ? resultsRaw : null;

  return {
    topLevelKeys,
    team1Keys,
    groupKeys,
    firstGoalKeys,
    matchIsFinishedRaw: obj["MatchIsFinished"] ?? obj["matchIsFinished"],
    resultsCount: resultsArray ? resultsArray.length : null,
    goalsCount: goalsArray.length,
  };
}

function fieldList(keys: string[]): string {
  return keys.length > 0 ? keys.join(", ") : "(keine Keys / nicht vorhanden)";
}

export default async function MatchdayDebugPage() {
  const rawResult = await fetchRawMatchday();

  const [baselineTable, currentMatchday] = await Promise.all([
    footballDataProvider.getBaselineTable(),
    footballDataProvider.getCurrentMatchday(),
  ]);

  const liveTable = computeLiveTable(baselineTable, currentMatchday.matches);
  const msvContext = getTeamLiveContext(liveTable, baselineTable, MSV_TEAM_ID);
  const msvHeadline = msvContext ? buildMatchLiveContext(msvContext) : null;

  const rawPeeks = rawResult.ok ? rawResult.raw.slice(0, 3).map(peekRawFields) : [];

  return (
    <div style={{ background: "#0B0E13", color: "#F4F6FA", minHeight: "100vh", padding: 24, fontFamily: "monospace" }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>ZEBRA — Matchday Reality Check</h1>
      <p style={{ fontSize: 13, color: "#888", marginBottom: 24 }}>
        Temporäre Debug-Route. Zeigt rohe OpenLigaDB-Feldnamen (Groß-/Kleinschreibung), normalisierte Werte über
        den bestehenden Provider und die daraus berechnete Live-Tabelle — nichts wird hier verändert, nur
        gelesen und angezeigt.
      </p>

      <section style={{ marginBottom: 32, borderBottom: "1px solid #333", paddingBottom: 20 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>A) Rohe Response</h2>
        {!rawResult.ok ? (
          <p style={{ color: "#FF3B4E", fontSize: 13 }}>Fehler: {rawResult.error}</p>
        ) : (
          <div style={{ fontSize: 12 }}>
            <div>HTTP Status: {rawResult.status}</div>
            <div>Anzahl Spiele (ganze Saison-Response): {rawResult.raw.length}</div>
            <div>getlastchangedate: {rawResult.lastChangeDate ?? "nicht abrufbar"}</div>
          </div>
        )}
      </section>

      <section style={{ marginBottom: 32, borderBottom: "1px solid #333", paddingBottom: 20 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>B) Rohe Feldnamen (erste 3 Spiele)</h2>
        <p style={{ fontSize: 12, color: "#888", marginBottom: 10 }}>
          Beantwortet die offene Casing-Frage (PascalCase vs. camelCase) empirisch — keine Vermutung mehr.
        </p>
        {rawPeeks.length === 0 && <p style={{ fontSize: 12, color: "#888" }}>Keine Rohdaten verfügbar.</p>}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {rawPeeks.map((peek, i) =>
            peek ? (
              <div key={i} style={{ border: "1px solid #2a2a2a", padding: 8, fontSize: 11 }}>
                <div>
                  <strong>Top-Level-Keys:</strong> {fieldList(peek.topLevelKeys)}
                </div>
                <div>
                  <strong>Team1/team1-Keys:</strong> {fieldList(peek.team1Keys)}
                </div>
                <div>
                  <strong>Group/group-Keys:</strong> {fieldList(peek.groupKeys)}
                </div>
                <div>
                  <strong>matchIsFinished (roh):</strong> {String(peek.matchIsFinishedRaw)}
                </div>
                <div>
                  <strong>MatchResults-Anzahl:</strong> {peek.resultsCount ?? "Feld nicht gefunden"}
                </div>
                <div>
                  <strong>Goals-Anzahl:</strong> {peek.goalsCount ?? "Feld nicht gefunden"}
                </div>
                <div>
                  <strong>Erstes Goal-Objekt-Keys:</strong> {fieldList(peek.firstGoalKeys)}
                </div>
                <div style={{ color: "#8B93A3", marginTop: 4 }}>
                  Gesucht, aber bewusst NICHT als eigenes Feld erwartet: eine "aktuelle Spielminute" für das
                  Match selbst (nur Tor-Minuten in Goals, falls vorhanden) — siehe Top-Level-Keys oben, ob dort
                  etwas wie "minute"/"Minute"/"currentMinute" auftaucht.
                </div>
              </div>
            ) : (
              <div key={i} style={{ fontSize: 12, color: "#FF3B4E" }}>
                Eintrag {i}: kein Objekt
              </div>
            )
          )}
        </div>
      </section>

      <section style={{ marginBottom: 32, borderBottom: "1px solid #333", paddingBottom: 20 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>
          C) Normalisiert über footballDataProvider.getCurrentMatchday() (unverändert)
        </h2>
        <div style={{ fontSize: 12, marginBottom: 8 }}>Spieltag: {currentMatchday.matchday}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {currentMatchday.matches.map((m) => (
            <div key={m.id} style={{ border: "1px solid #2a2a2a", padding: 6, fontSize: 11 }}>
              <div>
                {m.homeTeam.shortName} {m.homeScore ?? "–"}:{m.awayScore ?? "–"} {m.awayTeam.shortName} ·{" "}
                <strong>{m.status}</strong>
                {m.halftimeScore ? ` · HZ ${m.halftimeScore.home}:${m.halftimeScore.away}` : ""}
              </div>
              <div style={{ color: "#8B93A3" }}>
                Kickoff: {m.kickoff} · Minute (intern): {m.minute ?? "null (bewusst nicht vorgetäuscht)"} ·
                Events: {m.events.length}
              </div>
            </div>
          ))}
          {currentMatchday.matches.length === 0 && (
            <p style={{ fontSize: 12, color: "#888" }}>Keine Spiele für den aktuellen Spieltag gefunden.</p>
          )}
        </div>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>
          F/G) Live-Tabelle &amp; MSV-Kontext (lib/tableEngine.ts, unverändert)
        </h2>
        <div style={{ fontSize: 12, marginBottom: 10 }}>
          Baseline-Tabelle: {baselineTable.length} Teams · Live-Tabelle: {liveTable.length} Teams
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 12 }}>
          {liveTable.slice(0, 10).map((e) => (
            <div key={e.teamId} style={{ fontSize: 11, display: "flex", gap: 8 }}>
              <span style={{ width: 24 }}>{e.position}</span>
              <span style={{ flex: 1, fontWeight: e.isMsv ? 700 : 400 }}>{e.teamShortName}</span>
              <span style={{ width: 40 }}>{e.points} Pkt</span>
              <span style={{ width: 60 }}>
                Tordiff {e.goalsFor - e.goalsAgainst > 0 ? "+" : ""}
                {e.goalsFor - e.goalsAgainst}
              </span>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 12 }}>
          <strong>MSV-Kontext-Satz (buildMatchLiveContext, unverändert):</strong>{" "}
          {msvHeadline ? msvHeadline.headline : "Kein MSV-Eintrag in der Tabelle gefunden."}
        </div>
      </section>
    </div>
  );
}
