import { Metadata } from "next";
import { FOOTBALL_CONFIG } from "@/config/football";

// Temporäre, isolierte Debug-Route. Zweiter, gezielter Durchgang nach dem
// ersten Reality Check: A) vollständige Torschützenliste (keine
// automatische MSV-Filterung mehr — manuelle Prüfung), B) gezielt das
// bereits abgeschlossene Ligaspiel MSV–Meppen sowie alle abgeschlossenen
// MSV-Heimspiele auf ein Zuschauerfeld hin. Rein lesend, keine
// Produktionslogik, keine bestehende Seite verändert.
export const metadata: Metadata = {
  title: "ZEBRA — Stats Sources Reality Check (Debug)",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

async function fetchJson(path: string): Promise<{ ok: true; status: number; data: unknown } | { ok: false; error: string }> {
  try {
    const res = await fetch(`${FOOTBALL_CONFIG.baseUrl}${path}`, {
      cache: "no-store",
      headers: { "User-Agent": "Mozilla/5.0 (compatible; ZebraStatsProbe/0.1; debug-only)" },
    });
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };
    const data = await res.json();
    return { ok: true, status: res.status, data };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unbekannter Fehler" };
  }
}

interface GoalGetterRow {
  name: string | null;
  count: unknown;
  id: unknown;
  rawKeys: string[];
}

function extractGoalGetter(raw: unknown): GoalGetterRow | null {
  if (typeof raw !== "object" || raw === null) return null;
  const obj = raw as Record<string, unknown>;
  const name = obj["goalGetterName"] ?? obj["GoalGetterName"] ?? obj["name"] ?? obj["Name"];
  const count = obj["goalCount"] ?? obj["GoalCount"] ?? obj["goals"] ?? obj["Goals"];
  const id = obj["goalGetterId"] ?? obj["goalGetterID"] ?? obj["GoalGetterID"] ?? obj["GoalGetterId"];
  return {
    name: typeof name === "string" ? name : name === undefined ? null : String(name),
    count,
    id,
    rawKeys: Object.keys(obj),
  };
}

function teamName(raw: unknown): string {
  if (typeof raw !== "object" || raw === null) return "";
  const obj = raw as Record<string, unknown>;
  const n = obj["TeamName"] ?? obj["teamName"] ?? "";
  return typeof n === "string" ? n : "";
}

function isFinished(raw: Record<string, unknown>): boolean {
  return raw["MatchIsFinished"] === true || raw["matchIsFinished"] === true;
}

function rawViewers(raw: Record<string, unknown>): unknown {
  // Alle bisher als plausibel identifizierten Kandidaten-Keys, roh und
  // ungefiltert zurückgegeben — keine Interpretation, keine Umrechnung.
  const candidates = [
    "numberOfViewers",
    "NumberOfViewers",
    "Attendance",
    "attendance",
    "Spectators",
    "spectators",
    "Viewers",
    "viewers",
    "Crowd",
    "crowd",
  ];
  const found: Record<string, unknown> = {};
  for (const key of candidates) {
    if (key in raw) found[key] = raw[key];
  }
  return Object.keys(found).length > 0 ? found : undefined;
}

export default async function StatsSourcesDebugPage() {
  const { leagueShortcut, season } = FOOTBALL_CONFIG;

  // --- A) Vollständige Torschützenliste ---------------------------
  const goalGetters = await fetchJson(`/getgoalgetters/${leagueShortcut}/${season}`);
  const goalGetterEntries =
    goalGetters.ok && Array.isArray(goalGetters.data) ? (goalGetters.data as unknown[]) : [];
  const goalGetterRows = goalGetterEntries.map(extractGoalGetter).filter((r): r is GoalGetterRow => r !== null);

  // --- B) Zuschauer: gezielt MSV–Meppen + alle beendeten MSV-Heimspiele ---
  const seasonMatches = await fetchJson(`/getmatchdata/${leagueShortcut}/${season}`);
  const allMatches = seasonMatches.ok && Array.isArray(seasonMatches.data) ? (seasonMatches.data as unknown[]) : [];

  const finishedMsvHomeMatches = allMatches
    .filter((m): m is Record<string, unknown> => typeof m === "object" && m !== null)
    .map((m) => m as Record<string, unknown>)
    .filter((m) => {
      const home = teamName(m["Team1"] ?? m["team1"]);
      return /msv|duisburg/i.test(home) && isFinished(m);
    });

  const meppenMatch = finishedMsvHomeMatches.find((m) => /meppen/i.test(teamName(m["Team2"] ?? m["team2"])));

  function matchScore(m: Record<string, unknown>): string {
    const results = (m["MatchResults"] ?? m["matchResults"]) as unknown;
    const arr = Array.isArray(results) ? results : [];
    const final = arr.find((r) => {
      if (typeof r !== "object" || r === null) return false;
      const ro = r as Record<string, unknown>;
      return (ro["ResultTypeID"] ?? ro["resultTypeID"]) === 2;
    }) as Record<string, unknown> | undefined;
    if (!final) return "–:–";
    const p1 = final["PointsTeam1"] ?? final["pointsTeam1"];
    const p2 = final["PointsTeam2"] ?? final["pointsTeam2"];
    return `${String(p1 ?? "–")}:${String(p2 ?? "–")}`;
  }

  const goalGettersOk = goalGetters.ok && goalGetterRows.length > 0;
  const viewerFieldExists = finishedMsvHomeMatches.some((m) => rawViewers(m) !== undefined);
  const meppenViewerFilled =
    !!meppenMatch &&
    (() => {
      const v = rawViewers(meppenMatch);
      if (!v) return false;
      return Object.values(v).some((val) => val !== null && val !== undefined && val !== 0);
    })();

  return (
    <div style={{ background: "#0B0E13", color: "#F4F6FA", minHeight: "100vh", padding: 24, fontFamily: "monospace" }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>ZEBRA — Stats Sources Reality Check</h1>
      <p style={{ fontSize: 13, color: "#888", marginBottom: 24 }}>
        Temporäre Debug-Route, zweiter Durchgang: vollständige Torschützenliste (manuelle Prüfung) + gezielter
        Zuschauer-Check für MSV–Meppen und alle abgeschlossenen MSV-Heimspiele.
      </p>

      <section style={{ marginBottom: 28, borderBottom: "1px solid #333", paddingBottom: 20 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>
          A) Vollständige Torschützenliste — getgoalgetters/{leagueShortcut}/{season}
        </h2>
        {!goalGetters.ok ? (
          <p style={{ color: "#FF3B4E", fontSize: 13 }}>Fehler: {goalGetters.error}</p>
        ) : (
          <>
            <p style={{ fontSize: 13, marginBottom: 10 }}>
              HTTP {goalGetters.status} · {goalGetterRows.length} Einträge insgesamt.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 600, overflowY: "auto" }}>
              {goalGetterRows.map((row, i) => (
                <div key={i} style={{ border: "1px solid #2a2a2a", padding: 6, fontSize: 12 }}>
                  <strong>{row.name ?? "(kein Name gefunden)"}</strong> — Tore: {String(row.count ?? "–")} · ID:{" "}
                  {String(row.id ?? "–")}
                  {i === 0 && (
                    <div style={{ color: "#8B93A3", marginTop: 2 }}>Rohe Keys: {row.rawKeys.join(", ")}</div>
                  )}
                </div>
              ))}
              {goalGetterRows.length === 0 && (
                <p style={{ fontSize: 12, color: "#888" }}>Keine Einträge geliefert.</p>
              )}
            </div>
          </>
        )}
      </section>

      <section style={{ marginBottom: 28, borderBottom: "1px solid #333", paddingBottom: 20 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>B) Zuschauer — MSV Duisburg – Meppen</h2>
        {!seasonMatches.ok ? (
          <p style={{ color: "#FF3B4E", fontSize: 13 }}>Fehler: {seasonMatches.error}</p>
        ) : !meppenMatch ? (
          <p style={{ fontSize: 12, color: "#888" }}>
            Kein abgeschlossenes MSV-Heimspiel gegen einen Gegner mit "Meppen" im Namen gefunden (
            {finishedMsvHomeMatches.length} abgeschlossene MSV-Heimspiele insgesamt geprüft).
          </p>
        ) : (
          <div style={{ border: "1px solid #2a2a2a", padding: 8, fontSize: 12 }}>
            <div>
              MatchID: {String(meppenMatch["MatchID"] ?? meppenMatch["matchID"] ?? "–")}
            </div>
            <div>
              {teamName(meppenMatch["Team1"] ?? meppenMatch["team1"])} vs{" "}
              {teamName(meppenMatch["Team2"] ?? meppenMatch["team2"])} · Endstand: {matchScore(meppenMatch)}
            </div>
            <div>Kickoff: {String(meppenMatch["MatchDateTime"] ?? meppenMatch["matchDateTime"] ?? "–")}</div>
            <div style={{ marginTop: 6 }}>
              <strong>Roher Zuschauer-Feld-Wert:</strong>{" "}
              {(() => {
                const v = rawViewers(meppenMatch);
                return v ? JSON.stringify(v) : "kein Kandidaten-Feld im rohen Match-Objekt gefunden";
              })()}
            </div>
          </div>
        )}
      </section>

      <section style={{ marginBottom: 28, borderBottom: "1px solid #333", paddingBottom: 20 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>
          Alle abgeschlossenen MSV-Heimspiele ({finishedMsvHomeMatches.length})
        </h2>
        {finishedMsvHomeMatches.length === 0 ? (
          <p style={{ fontSize: 12, color: "#888" }}>Keine gefunden.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {finishedMsvHomeMatches.map((m, i) => {
              const v = rawViewers(m);
              return (
                <div key={i} style={{ border: "1px solid #2a2a2a", padding: 6, fontSize: 12 }}>
                  vs {teamName(m["Team2"] ?? m["team2"])} · {matchScore(m)} · Zuschauerfeld:{" "}
                  {v ? JSON.stringify(v) : "keines gefunden"}
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>C) Technische Zusammenfassung</h2>
        <div style={{ fontSize: 13, display: "flex", flexDirection: "column", gap: 4 }}>
          <div>Torschützenendpoint liefert Daten: {goalGettersOk ? "JA" : "NEIN"}</div>
          <div>MSV-Spieler anhand der gelieferten Daten automatisch zuordenbar: NEIN (bewusst nicht geprüft — manuelle Sichtung von Abschnitt A vorgesehen)</div>
          <div>Zuschauerfeld vorhanden: {viewerFieldExists ? "JA" : "NEIN"}</div>
          <div>
            Zuschauerwert bei MSV–Meppen befüllt: {meppenMatch ? (meppenViewerFilled ? "JA" : "NEIN") : "Match nicht gefunden"}
          </div>
        </div>
      </section>
    </div>
  );
}
