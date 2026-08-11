import { Metadata } from "next";
import { FOOTBALL_CONFIG } from "@/config/football";

// Temporäre, isolierte Debug-Route für den "MSV Statistics / Squad /
// Lineups / Attendance"-Reality-Check. Beantwortet ausschließlich zwei
// konkrete, bisher unverifizierte Fragen zu OpenLigaDB selbst:
// 1) Liefert getgoalgetters/bl3/2026 echte Daten, welche Felder, sind
//    MSV-Spieler filterbar?
// 2) Enthält ein rohes Match-Objekt irgendein Zuschauer-/Attendance-Feld
//    (z.B. NumberOfViewers)?
// Keine Secrets, keine API-Keys, keine externen kommerziellen APIs (die
// bräuchten ohnehin einen Key, den dieser Probe nicht besitzt und nicht
// anzeigen darf). Verändert keine bestehende Seite, keine Produktionslogik.
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

function extractPossibleViewerFields(raw: unknown): Record<string, unknown> {
  if (typeof raw !== "object" || raw === null) return {};
  const obj = raw as Record<string, unknown>;
  const candidates = [
    "NumberOfViewers",
    "numberOfViewers",
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
    if (key in obj) found[key] = obj[key];
  }
  return found;
}

export default async function StatsSourcesDebugPage() {
  const { leagueShortcut, season } = FOOTBALL_CONFIG;

  const goalGetters = await fetchJson(`/getgoalgetters/${leagueShortcut}/${season}`);
  const matchdaySample = await fetchJson(`/getmatchdata/${leagueShortcut}/${season}/1`);

  const goalGetterEntries =
    goalGetters.ok && Array.isArray(goalGetters.data) ? (goalGetters.data as unknown[]) : [];
  const msvGoalGetters = goalGetterEntries.filter((e) => {
    if (typeof e !== "object" || e === null) return false;
    const obj = e as Record<string, unknown>;
    const teamName = String(obj["TeamName"] ?? obj["teamName"] ?? "");
    return /msv|duisburg/i.test(teamName);
  });

  const matchSamples = matchdaySample.ok && Array.isArray(matchdaySample.data) ? (matchdaySample.data as unknown[]) : [];
  const viewerFieldSamples = matchSamples.slice(0, 3).map(extractPossibleViewerFields);
  const anyViewerFieldFound = viewerFieldSamples.some((s) => Object.keys(s).length > 0);

  return (
    <div style={{ background: "#0B0E13", color: "#F4F6FA", minHeight: "100vh", padding: 24, fontFamily: "monospace" }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>ZEBRA — Stats Sources Reality Check</h1>
      <p style={{ fontSize: 13, color: "#888", marginBottom: 24 }}>
        Temporäre Debug-Route. Prüft ausschließlich getgoalgetters (Torschützen) und ein mögliches
        Zuschauerfeld in rohen Matchdaten — beides zuvor nur aus Dokumentation angenommen, nie live geprüft.
      </p>

      <section style={{ marginBottom: 28, borderBottom: "1px solid #333", paddingBottom: 20 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>A) getgoalgetters/{leagueShortcut}/{season}</h2>
        {!goalGetters.ok ? (
          <p style={{ color: "#FF3B4E", fontSize: 13 }}>Fehler: {goalGetters.error}</p>
        ) : (
          <>
            <p style={{ fontSize: 13, marginBottom: 8 }}>
              HTTP {goalGetters.status} · {goalGetterEntries.length} Einträge insgesamt · {msvGoalGetters.length}{" "}
              MSV-Treffer.
            </p>
            {goalGetterEntries.length > 0 && (
              <div style={{ marginBottom: 10 }}>
                <strong style={{ fontSize: 12 }}>Rohe Keys des ersten Eintrags:</strong>{" "}
                <span style={{ fontSize: 12, color: "#8B93A3" }}>
                  {typeof goalGetterEntries[0] === "object" && goalGetterEntries[0] !== null
                    ? Object.keys(goalGetterEntries[0] as object).join(", ")
                    : "(kein Objekt)"}
                </span>
              </div>
            )}
            {msvGoalGetters.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {msvGoalGetters.slice(0, 10).map((e, i) => (
                  <div key={i} style={{ border: "1px solid #2a2a2a", padding: 6, fontSize: 12 }}>
                    {JSON.stringify(e)}
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: 12, color: "#888" }}>Keine MSV-Spieler in der Torschützenliste gefunden.</p>
            )}
          </>
        )}
      </section>

      <section>
        <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>
          B) Zuschauerfeld in getmatchdata/{leagueShortcut}/{season}/1
        </h2>
        {!matchdaySample.ok ? (
          <p style={{ color: "#FF3B4E", fontSize: 13 }}>Fehler: {matchdaySample.error}</p>
        ) : (
          <>
            <p style={{ fontSize: 13, marginBottom: 8 }}>
              {matchSamples.length} Spiele geprüft (erste 3 Stichproben) ·{" "}
              {anyViewerFieldFound ? "Zuschauerfeld gefunden!" : "Kein Zuschauerfeld gefunden."}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {viewerFieldSamples.map((s, i) => (
                <div key={i} style={{ border: "1px solid #2a2a2a", padding: 6, fontSize: 12 }}>
                  Spiel {i + 1}:{" "}
                  {Object.keys(s).length > 0 ? JSON.stringify(s) : "keines der geprüften Felder vorhanden"}
                </div>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
