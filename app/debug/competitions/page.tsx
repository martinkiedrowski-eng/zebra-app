import { Metadata } from "next";
import { FOOTBALL_CONFIG } from "@/config/football";

// Temporäre, isolierte Debug-Route. Beantwortet NUR eine Frage: Führt
// OpenLigaDB den DFB-Pokal 2026/27 bzw. den Niederrheinpokal unter einem
// auffindbaren Shortcut, und taucht dort MSV Duisburg auf? Kein Raten von
// Shortcuts — ruft stattdessen den echten getavailableleagues-Endpunkt ab
// und filtert die tatsächliche Antwort. Verändert keine bestehende Seite,
// keine Produktionslogik.
export const metadata: Metadata = {
  title: "ZEBRA — Competitions Reality Check (Debug)",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

interface LeagueEntry {
  leagueId: unknown;
  leagueName: unknown;
  leagueShortcut: unknown;
  leagueSeason: unknown;
}

function extractLeagueEntry(raw: unknown): LeagueEntry | null {
  if (typeof raw !== "object" || raw === null) return null;
  const obj = raw as Record<string, unknown>;
  return {
    leagueId: obj["LeagueId"] ?? obj["leagueId"],
    leagueName: obj["LeagueName"] ?? obj["leagueName"],
    leagueShortcut: obj["LeagueShortcut"] ?? obj["leagueShortcut"],
    leagueSeason: obj["LeagueSeason"] ?? obj["leagueSeason"],
  };
}

async function fetchAvailableLeagues(): Promise<
  { ok: true; status: number; entries: LeagueEntry[]; total: number } | { ok: false; error: string }
> {
  try {
    const res = await fetch(`${FOOTBALL_CONFIG.baseUrl}/getavailableleagues`, {
      cache: "no-store",
      headers: { "User-Agent": "Mozilla/5.0 (compatible; ZebraCompetitionsProbe/0.1; debug-only)" },
    });
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };
    const raw = await res.json();
    if (!Array.isArray(raw)) return { ok: false, error: "Antwort ist kein Array" };
    const entries = raw.map(extractLeagueEntry).filter((e): e is LeagueEntry => e !== null);
    return { ok: true, status: res.status, entries, total: entries.length };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unbekannter Fehler" };
  }
}

function matchesKeyword(entry: LeagueEntry, keyword: string): boolean {
  const name = typeof entry.leagueName === "string" ? entry.leagueName.toLowerCase() : "";
  const shortcut = typeof entry.leagueShortcut === "string" ? entry.leagueShortcut.toLowerCase() : "";
  return name.includes(keyword) || shortcut.includes(keyword);
}

export default async function CompetitionsDebugPage() {
  const result = await fetchAvailableLeagues();

  const dfbMatches = result.ok
    ? result.entries.filter((e) => matchesKeyword(e, "pokal") || matchesKeyword(e, "dfb"))
    : [];
  const niederrheinMatches = result.ok ? result.entries.filter((e) => matchesKeyword(e, "niederrhein")) : [];

  return (
    <div style={{ background: "#0B0E13", color: "#F4F6FA", minHeight: "100vh", padding: 24, fontFamily: "monospace" }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>ZEBRA — Competitions Reality Check</h1>
      <p style={{ fontSize: 13, color: "#888", marginBottom: 24 }}>
        Temporäre Debug-Route. Prüft ausschließlich, ob OpenLigaDB DFB-Pokal/Niederrheinpokal unter einem
        auffindbaren Shortcut führt — kein geratener Shortcut, keine erfundene Saison.
      </p>

      {!result.ok ? (
        <p style={{ color: "#FF3B4E", fontSize: 13 }}>Fehler beim Abruf von getavailableleagues: {result.error}</p>
      ) : (
        <>
          <p style={{ fontSize: 13, marginBottom: 16 }}>
            HTTP {result.status} · {result.total} Ligen/Wettbewerbe insgesamt gefunden.
          </p>

          <section style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>
              Treffer für "Pokal"/"DFB" ({dfbMatches.length})
            </h2>
            {dfbMatches.length === 0 ? (
              <p style={{ fontSize: 12, color: "#888" }}>Keine Treffer in der Ligenliste.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {dfbMatches.map((e, i) => (
                  <div key={i} style={{ border: "1px solid #2a2a2a", padding: 6, fontSize: 12 }}>
                    <div>Name: {String(e.leagueName)}</div>
                    <div>Shortcut: {String(e.leagueShortcut)}</div>
                    <div>Season: {String(e.leagueSeason)}</div>
                    <div>LeagueId: {String(e.leagueId)}</div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>
              Treffer für "Niederrhein" ({niederrheinMatches.length})
            </h2>
            {niederrheinMatches.length === 0 ? (
              <p style={{ fontSize: 12, color: "#888" }}>
                Keine Treffer — spricht dafür, dass der Niederrheinpokal in OpenLigaDB nicht geführt wird.
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {niederrheinMatches.map((e, i) => (
                  <div key={i} style={{ border: "1px solid #2a2a2a", padding: 6, fontSize: 12 }}>
                    <div>Name: {String(e.leagueName)}</div>
                    <div>Shortcut: {String(e.leagueShortcut)}</div>
                    <div>Season: {String(e.leagueSeason)}</div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <p style={{ fontSize: 11, color: "#8B93A3" }}>
            Nächster Schritt bei einem DFB-Pokal-Treffer: mit dem gefundenen Shortcut/Season
            `/getmatchdata/&lt;shortcut&gt;/&lt;season&gt;` abrufen und dort gezielt nach "MSV Duisburg"
            suchen — noch nicht Teil dieses Probes.
          </p>
        </>
      )}
    </div>
  );
}
