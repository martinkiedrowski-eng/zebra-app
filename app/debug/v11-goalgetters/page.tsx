import { Metadata } from "next";
import { FOOTBALL_CONFIG } from "@/config/football";

// Temporäre, isolierte Debug-Route für den Torjäger-Live-Reality-Check
// (Voglsammer-Diskrepanz). Ruft OpenLigaDB komplett unabhängig von der
// produktiven lib/stats/goalGetters.ts auf — bewusst KEINE Transformation
// durch bestehenden Code, damit die rohe API-Antwort unverfälscht sichtbar
// bleibt. Keine produktive Datei importiert diese Route, keine bestehende
// Komponente verändert.
export const metadata: Metadata = {
  title: "ZEBRA — Torjäger Live Reality Check (Debug)",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const { leagueShortcut, season, baseUrl } = FOOTBALL_CONFIG;
const GOALGETTERS_URL = `${baseUrl}/getgoalgetters/${leagueShortcut}/${season}`;
const SEASON_MATCHES_URL = `${baseUrl}/getmatchdata/${leagueShortcut}/${season}`;

const WATCH_NAMES = ["Lobinger", "Ndikom", "Hermes", "Fein", "Voglsammer"];

interface FetchResult {
  url: string;
  ok: boolean;
  status: number | null;
  isJson: boolean;
  data: unknown[];
  error: string | null;
}

async function fetchJsonArray(url: string): Promise<FetchResult> {
  try {
    const res = await fetch(url, { cache: "no-store" });
    const text = await res.text();
    let data: unknown = null;
    let isJson = false;
    try {
      data = JSON.parse(text);
      isJson = true;
    } catch {
      isJson = false;
    }
    return {
      url,
      ok: res.ok,
      status: res.status,
      isJson,
      data: isJson && Array.isArray(data) ? data : [],
      error: null,
    };
  } catch (err) {
    return {
      url,
      ok: false,
      status: null,
      isJson: false,
      data: [],
      error: err instanceof Error ? err.message : "Unbekannter Fehler",
    };
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

function fmt(v: unknown): string {
  if (v === undefined) return "(nicht vorhanden)";
  if (v === null) return "null";
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

function isMatchName(name: unknown, needle: string): boolean {
  return typeof name === "string" && name.toLowerCase().includes(needle.toLowerCase());
}

interface RawGoalWithContext {
  matchId: string;
  kickoff: string;
  homeTeam: string;
  awayTeam: string;
  finalScore: string;
  goal: Record<string, unknown>;
}

export default async function GoalGettersDebugPage() {
  // --- Test A: rohe getgoalgetters-Antwort, KEINE Transformation ---
  const ggRes = await fetchJsonArray(GOALGETTERS_URL);
  const ggEntries = ggRes.data;
  const ggVoglsammer = ggEntries.filter((e) => isMatchName(raw(e, "GoalGetterName", "goalGetterName"), "Voglsammer"));
  const ggVoglsammerSum = ggVoglsammer.reduce((sum: number, e) => {
    const v = raw(e, "GoalCount", "goalCount");
    const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : 0;
    return sum + (Number.isFinite(n) ? n : 0);
  }, 0);

  const ggWatchHits = WATCH_NAMES.map((name) => ({
    name,
    entries: ggEntries.filter((e) => isMatchName(raw(e, "GoalGetterName", "goalGetterName"), name)),
  }));

  // --- Test B: rohe Saisonspiele ---
  const seasonRes = await fetchJsonArray(SEASON_MATCHES_URL);
  const seasonMatches = seasonRes.data;
  const finished = seasonMatches.filter((m) => raw(m, "MatchIsFinished", "matchIsFinished") === true);
  const notFinished = seasonMatches.length - finished.length;

  function goalsOf(m: unknown): unknown[] {
    const g = raw(m, "Goals", "goals");
    return Array.isArray(g) ? g : [];
  }
  const finishedWithGoals = finished.filter((m) => goalsOf(m).length > 0);
  const finishedWithoutGoals = finished.filter((m) => goalsOf(m).length === 0);

  // --- Test C: rohe Goal-Events sammeln (mit Match-Kontext) ---
  const allGoalsWithContext: RawGoalWithContext[] = [];
  for (const m of seasonMatches) {
    const goals = goalsOf(m);
    if (goals.length === 0) continue;
    const matchId = fmt(raw(m, "MatchID", "matchID"));
    const kickoff = fmt(raw(m, "MatchDateTime", "matchDateTime"));
    const homeTeam = fmt(raw(rawObj(m, "Team1", "team1"), "TeamName", "teamName"));
    const awayTeam = fmt(raw(rawObj(m, "Team2", "team2"), "TeamName", "teamName"));
    const results = raw(m, "MatchResults", "matchResults");
    const finalRes = Array.isArray(results)
      ? results.find((r) => raw(r, "ResultTypeID", "resultTypeID") === 2)
      : null;
    const finalScore = finalRes
      ? `${fmt(raw(finalRes, "PointsTeam1", "pointsTeam1"))}:${fmt(raw(finalRes, "PointsTeam2", "pointsTeam2"))}`
      : "–:–";

    for (const g of goals) {
      if (typeof g === "object" && g !== null) {
        allGoalsWithContext.push({
          matchId,
          kickoff,
          homeTeam,
          awayTeam,
          finalScore,
          goal: g as Record<string, unknown>,
        });
      }
    }
  }

  const hasStableId = allGoalsWithContext.some(
    (g) => raw(g.goal, "GoalGetterID", "GoalGetterId", "goalGetterId", "goalGetterID") !== undefined
  );
  const idField = hasStableId
    ? (["GoalGetterID", "GoalGetterId", "goalGetterId", "goalGetterID"].find((k) =>
        allGoalsWithContext.some((g) => raw(g.goal, k) !== undefined)
      ) ?? null)
    : null;

  const voglsammerGoals = allGoalsWithContext.filter((g) => isMatchName(raw(g.goal, "GoalGetterName", "goalGetterName"), "Voglsammer"));
  const voglsammerRegularGoals = voglsammerGoals.filter((g) => raw(g.goal, "IsOwnGoal", "isOwnGoal") !== true);

  // --- Test D: Selbstaggregation (nur auf dieser Debug-Seite, nicht produktiv) ---
  interface AggEntry {
    key: string;
    name: string;
    goals: number;
  }
  const aggMap = new Map<string, AggEntry>();
  for (const { goal } of allGoalsWithContext) {
    if (raw(goal, "IsOwnGoal", "isOwnGoal") === true) continue; // Eigentore nie dem Torschützen gutschreiben
    const name = raw(goal, "GoalGetterName", "goalGetterName");
    if (typeof name !== "string" || !name.trim()) continue;
    const id = idField ? raw(goal, idField) : undefined;
    const key = id !== undefined && id !== null ? `id:${String(id)}` : `name:${name.trim()}`;
    const existing = aggMap.get(key);
    if (existing) {
      existing.goals += 1;
    } else {
      aggMap.set(key, { key, name: name.trim(), goals: 1 });
    }
  }
  const aggregated = Array.from(aggMap.values()).sort((a, b) => b.goals - a.goals);
  const voglsammerAgg = aggregated.filter((a) => isMatchName(a.name, "Voglsammer"));

  // --- Datenqualitäts-Check ---
  const idToNames = new Map<string, Set<string>>();
  const nameToIds = new Map<string, Set<string>>();
  let goalsWithoutId = 0;
  let goalsWithoutMinute = 0;
  let emptyNames = 0;
  let ownGoalCount = 0;
  let penaltyCount = 0;
  for (const { goal } of allGoalsWithContext) {
    const name = raw(goal, "GoalGetterName", "goalGetterName");
    const id = idField ? raw(goal, idField) : undefined;
    if (typeof name !== "string" || !name.trim()) emptyNames++;
    if (id === undefined || id === null) goalsWithoutId++;
    if (raw(goal, "MatchMinute", "matchMinute") === undefined) goalsWithoutMinute++;
    if (raw(goal, "IsOwnGoal", "isOwnGoal") === true) ownGoalCount++;
    if (raw(goal, "IsPenalty", "isPenalty") === true) penaltyCount++;
    if (id !== undefined && id !== null && typeof name === "string") {
      const idKey = String(id);
      if (!idToNames.has(idKey)) idToNames.set(idKey, new Set());
      idToNames.get(idKey)!.add(name);
      if (!nameToIds.has(name)) nameToIds.set(name, new Set());
      nameToIds.get(name)!.add(idKey);
    }
  }
  const idsWithMultipleNames = Array.from(idToNames.entries()).filter(([, names]) => names.size > 1);
  const namesWithMultipleIds = Array.from(nameToIds.entries()).filter(([, ids]) => ids.size > 1);

  return (
    <div style={{ background: "#0B0E13", color: "#F4F6FA", minHeight: "100vh", padding: 20, fontFamily: "monospace", fontSize: 13 }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>ZEBRA — Torjäger Live Reality Check</h1>
      <p style={{ fontSize: 12, color: "#888", marginBottom: 20 }}>
        Ausschließlich rohe API-Daten, keine Transformation durch lib/stats/goalGetters.ts.
      </p>

      {/* A) RAW getgoalgetters */}
      <section style={{ marginBottom: 20, borderBottom: "1px solid #333", paddingBottom: 12 }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>A) RAW getgoalgetters</h2>
        <div>Endpoint: {GOALGETTERS_URL}</div>
        <div>leagueShortcut: {leagueShortcut} · season: {season}</div>
        <div>HTTP Status: {fmt(ggRes.status)}</div>
        <div>Fetch erfolgreich: {ggRes.error ? "NEIN" : "JA"}</div>
        <div>JSON valide: {ggRes.isJson ? "JA" : "NEIN"}</div>
        <div>Anzahl Einträge: {ggEntries.length}</div>
        {ggRes.error && <div style={{ color: "#FF3B4E" }}>Fehler: {ggRes.error}</div>}

        <div style={{ marginTop: 10, fontWeight: 700 }}>ANZAHL VOGLSAMMER-EINTRÄGE: {ggVoglsammer.length}</div>
        {ggVoglsammer.map((e, i) => (
          <div key={i} style={{ border: "1px solid #2a2a2a", padding: 6, marginTop: 4 }}>
            Index {i}: {JSON.stringify(e)}
          </div>
        ))}
        {ggVoglsammer.length > 1 && (
          <div style={{ marginTop: 4, color: "#8B93A3" }}>Summe aller Voglsammer-Einträge: {ggVoglsammerSum}</div>
        )}
      </section>

      {/* B) RAW Top Goalgetters (Stichprobe) */}
      <section style={{ marginBottom: 20, borderBottom: "1px solid #333", paddingBottom: 12 }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>B) RAW Stichprobe (getgoalgetters)</h2>
        {ggWatchHits.map(({ name, entries }) => (
          <div key={name} style={{ marginBottom: 8 }}>
            <strong>{name}</strong>: {entries.length} Treffer
            {entries.map((e, i) => (
              <div key={i} style={{ border: "1px solid #2a2a2a", padding: 6, marginTop: 4 }}>
                {JSON.stringify(e)}
              </div>
            ))}
          </div>
        ))}
      </section>

      {/* C) Saisonmatches */}
      <section style={{ marginBottom: 20, borderBottom: "1px solid #333", paddingBottom: 12 }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>C) SAISONMATCHES (RAW)</h2>
        <div>Endpoint: {SEASON_MATCHES_URL}</div>
        <div>HTTP Status: {fmt(seasonRes.status)}</div>
        <div>Anzahl Saisonspiele insgesamt: {seasonMatches.length}</div>
        <div>Davon finished: {finished.length}</div>
        <div>Davon nicht finished (scheduled/live/etc.): {notFinished}</div>
        <div>Finished MIT Goal-Array: {finishedWithGoals.length}</div>
        <div>Finished OHNE Goal-Array: {finishedWithoutGoals.length}</div>
      </section>

      {/* D) Goal-Event Raw Check */}
      <section style={{ marginBottom: 20, borderBottom: "1px solid #333", paddingBottom: 12 }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>D) GOAL-EVENT RAW CHECK</h2>
        <div>Gesamtzahl Goal-Events (alle Saisonspiele): {allGoalsWithContext.length}</div>
        <div style={{ fontWeight: 700, marginTop: 6 }}>
          LIEFERT DAS RAW GOAL EVENT EINE STABILE SPIELER-ID? {hasStableId ? "JA" : "NEIN"}
          {hasStableId && idField && ` — Feldname: ${idField}`}
        </div>
        <div style={{ marginTop: 8, color: "#8B93A3" }}>Beispiel-Goal-Events (erste 5, vollständig roh):</div>
        {allGoalsWithContext.slice(0, 5).map((g, i) => (
          <div key={i} style={{ border: "1px solid #2a2a2a", padding: 6, marginTop: 4 }}>
            Match {g.matchId} ({g.homeTeam} vs {g.awayTeam}, {g.kickoff}): {JSON.stringify(g.goal)}
          </div>
        ))}
      </section>

      {/* E) Voglsammer in Match-Goals */}
      <section style={{ marginBottom: 20, borderBottom: "1px solid #333", paddingBottom: 12 }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>E) VOGLSAMMER IN DEN MATCH-GOALS</h2>
        <div style={{ fontWeight: 700 }}>VOGLSAMMER GOALS IN SEASON MATCH DATA: {voglsammerGoals.length}</div>
        {voglsammerGoals.map((g, i) => {
          const isOwn = raw(g.goal, "IsOwnGoal", "isOwnGoal") === true;
          return (
            <div key={i} style={{ border: "1px solid #2a2a2a", padding: 6, marginTop: 4 }}>
              <div>
                Match {g.matchId} · {g.kickoff} · {g.homeTeam} vs {g.awayTeam} · Endstand {g.finalScore}
              </div>
              <div>
                Name RAW: {fmt(raw(g.goal, "GoalGetterName", "goalGetterName"))} · Spieler-ID:{" "}
                {idField ? fmt(raw(g.goal, idField)) : "(kein ID-Feld gefunden)"}
              </div>
              <div>
                Minute: {fmt(raw(g.goal, "MatchMinute", "matchMinute"))} · ScoreTeam1:{" "}
                {fmt(raw(g.goal, "ScoreTeam1", "scoreTeam1"))} · ScoreTeam2: {fmt(raw(g.goal, "ScoreTeam2", "scoreTeam2"))}
              </div>
              <div>
                IsPenalty: {fmt(raw(g.goal, "IsPenalty", "isPenalty"))} · IsOwnGoal:{" "}
                {fmt(raw(g.goal, "IsOwnGoal", "isOwnGoal"))} {isOwn && "⚠️ EIGENTOR"}
              </div>
            </div>
          );
        })}
      </section>

      {/* F) Selbstaggregation */}
      <section style={{ marginBottom: 20, borderBottom: "1px solid #333", paddingBottom: 12 }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>
          F) TEMPORÄRE SELBSTAGGREGATION (nur Diagnose, nicht produktiv)
        </h2>
        <div>AGGREGATION KEY: {hasStableId ? "PLAYER_ID" : "EXACT_NAME"}</div>
        <div style={{ marginTop: 6 }}>Top 20:</div>
        {aggregated.slice(0, 20).map((a, i) => (
          <div key={a.key} style={{ borderBottom: "1px solid #2a2a2a", padding: "4px 0" }}>
            {i + 1}. {a.name} — {a.goals}
          </div>
        ))}
      </section>

      {/* G) Dreifachvergleich Voglsammer */}
      <section style={{ marginBottom: 20, borderBottom: "1px solid #333", paddingBottom: 12 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>ANDREAS VOGLSAMMER — DREIFACHVERGLEICH</h2>
        <div style={{ fontSize: 15, marginBottom: 4 }}>
          A) getgoalgetters RAW: {ggVoglsammer.length === 0 ? "kein Eintrag" : `${ggVoglsammerSum} Tore (${ggVoglsammer.length} Datensatz/Datensätze)`}
        </div>
        <div style={{ fontSize: 15, marginBottom: 4 }}>
          B) ZEBRA aktuelle Verarbeitung (lib/stats/goalGetters.ts-Logik, hier nur nachgebildet, nicht importiert):{" "}
          {ggVoglsammer.length > 0 ? fmt(raw(ggVoglsammer[0], "GoalCount", "goalCount")) : "kein Eintrag"}
          {ggVoglsammer.length > 1 && " (nur der ERSTE Datensatz, da keine Aggregation stattfindet)"}
        </div>
        <div style={{ fontSize: 15 }}>
          C) Saison-Match-Goal-Aggregation: {voglsammerRegularGoals.length} Tore
          {voglsammerGoals.length !== voglsammerRegularGoals.length &&
            ` (${voglsammerGoals.length - voglsammerRegularGoals.length} Eigentor/Eigentore ausgeschlossen)`}
        </div>
      </section>

      {/* H) Datenqualität */}
      <section>
        <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>H) DATENQUALITÄTS-CHECK</h2>
        <div>IDs mit mehreren unterschiedlichen Namen: {idsWithMultipleNames.length}</div>
        {idsWithMultipleNames.map(([id, names]) => (
          <div key={id} style={{ color: "#8B93A3" }}>
            ID {id}: {Array.from(names).join(", ")}
          </div>
        ))}
        <div>Namen mit mehreren unterschiedlichen IDs: {namesWithMultipleIds.length}</div>
        {namesWithMultipleIds.map(([name, ids]) => (
          <div key={name} style={{ color: "#8B93A3" }}>
            {name}: {Array.from(ids).join(", ")}
          </div>
        ))}
        <div>Goal-Events ohne Name: {emptyNames}</div>
        <div>Goal-Events ohne ID-Feld: {goalsWithoutId}</div>
        <div>Goal-Events ohne Minute: {goalsWithoutMinute}</div>
        <div>Eigentore insgesamt: {ownGoalCount}</div>
        <div>Elfmetertore insgesamt: {penaltyCount}</div>
      </section>
    </div>
  );
}
