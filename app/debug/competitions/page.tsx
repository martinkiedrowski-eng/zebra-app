import { Metadata } from "next";
import { FOOTBALL_CONFIG } from "@/config/football";

// Temporäre, isolierte Debug-Route. Schritt 2: Nachdem getavailableleagues
// mehrere "Pokal"/"DFB"-Treffer geliefert hat, fragt dieser Probe gezielt
// die Matchdaten der wahrscheinlichsten Kandidaten (Saison-Feld enthält
// "2026") ab — mit DEREN EIGENEM, echten Shortcut/Season-Wert aus der
// vorherigen Response, nicht geraten — und prüft, ob dort tatsächlich
// "MSV"/"Duisburg" als Team vorkommt. Verändert keine bestehende Seite,
// keine Produktionslogik, keine Integration in /spiele.
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

interface MsvMatchHit {
  matchId: string;
  kickoff: string;
  round: string;
  opponent: string;
  isHome: boolean;
}

interface CandidateCheck {
  entry: LeagueEntry;
  status: "ok" | "http-error" | "not-array" | "fetch-error";
  httpStatus?: number;
  totalMatches?: number;
  msvHits: MsvMatchHit[];
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

function looksLike2026(entry: LeagueEntry): boolean {
  return String(entry.leagueSeason).includes("2026") || String(entry.leagueName).includes("2026");
}

function extractTeamName(raw: unknown): string {
  if (typeof raw !== "object" || raw === null) return "";
  const obj = raw as Record<string, unknown>;
  const name = obj["TeamName"] ?? obj["teamName"] ?? "";
  return typeof name === "string" ? name : "";
}

/** Prüft EINEN Kandidaten mit dessen eigenem, echtem Shortcut/Season — keine Konstruktion, kein Raten. */
async function checkCandidateForMsv(entry: LeagueEntry): Promise<CandidateCheck> {
  const shortcut = typeof entry.leagueShortcut === "string" ? entry.leagueShortcut : null;
  const season = entry.leagueSeason;

  if (!shortcut || season === undefined || season === null) {
    return { entry, status: "not-array", msvHits: [] };
  }

  try {
    const res = await fetch(`${FOOTBALL_CONFIG.baseUrl}/getmatchdata/${shortcut}/${season}`, {
      cache: "no-store",
      headers: { "User-Agent": "Mozilla/5.0 (compatible; ZebraCompetitionsProbe/0.1; debug-only)" },
    });
    if (!res.ok) return { entry, status: "http-error", httpStatus: res.status, msvHits: [] };
    const raw = await res.json();
    if (!Array.isArray(raw)) return { entry, status: "not-array", msvHits: [] };

    const msvHits: MsvMatchHit[] = [];
    for (const m of raw) {
      if (typeof m !== "object" || m === null) continue;
      const obj = m as Record<string, unknown>;
      const team1 = extractTeamName(obj["Team1"] ?? obj["team1"]);
      const team2 = extractTeamName(obj["Team2"] ?? obj["team2"]);
      const isHome = /msv|duisburg/i.test(team1);
      const isAway = /msv|duisburg/i.test(team2);
      if (!isHome && !isAway) continue;

      const matchId = obj["MatchID"] ?? obj["matchID"] ?? obj["MatchId"] ?? obj["matchId"];
      const kickoff = obj["MatchDateTime"] ?? obj["matchDateTime"];
      const groupObj = obj["Group"] ?? obj["group"];
      const round =
        typeof groupObj === "object" && groupObj !== null
          ? String(
              (groupObj as Record<string, unknown>)["GroupName"] ??
                (groupObj as Record<string, unknown>)["groupName"] ??
                ""
            )
          : "";

      msvHits.push({
        matchId: String(matchId),
        kickoff: String(kickoff),
        round,
        opponent: isHome ? team2 : team1,
        isHome,
      });
    }

    return { entry, status: "ok", httpStatus: res.status, totalMatches: raw.length, msvHits };
  } catch {
    return { entry, status: "fetch-error", msvHits: [] };
  }
}

export default async function CompetitionsDebugPage() {
  const result = await fetchAvailableLeagues();

  const dfbMatches = result.ok
    ? result.entries.filter((e) => matchesKeyword(e, "pokal") || matchesKeyword(e, "dfb"))
    : [];
  const niederrheinMatches = result.ok ? result.entries.filter((e) => matchesKeyword(e, "niederrhein")) : [];

  // Kandidaten für den gezielten Match-Check: zuerst alle, deren Saison
  // nach 2026 aussieht, sonst (falls keiner passt) die ersten paar der
  // Gesamtliste — insgesamt hart auf 6 Requests gedeckelt, um die Vercel-
  // Function nicht mit potenziell "zahlreichen Treffern" zu überlasten.
  const prioritized = [...dfbMatches.filter(looksLike2026), ...dfbMatches.filter((e) => !looksLike2026(e))].slice(
    0,
    6
  );

  const candidateChecks = result.ok ? await Promise.all(prioritized.map(checkCandidateForMsv)) : [];

  return (
    <div style={{ background: "#0B0E13", color: "#F4F6FA", minHeight: "100vh", padding: 24, fontFamily: "monospace" }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>ZEBRA — Competitions Reality Check</h1>
      <p style={{ fontSize: 13, color: "#888", marginBottom: 24 }}>
        Temporäre Debug-Route. Schritt 2: prüft die wahrscheinlichsten DFB-Pokal-Kandidaten gezielt auf echte
        MSV-Spiele — jeweils mit deren eigenem, echtem Shortcut/Season aus getavailableleagues.
      </p>

      {!result.ok ? (
        <p style={{ color: "#FF3B4E", fontSize: 13 }}>Fehler beim Abruf von getavailableleagues: {result.error}</p>
      ) : (
        <>
          <p style={{ fontSize: 13, marginBottom: 16 }}>
            HTTP {result.status} · {result.total} Ligen/Wettbewerbe insgesamt · {dfbMatches.length} Treffer für
            "Pokal"/"DFB".
          </p>

          <section style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>
              B) MSV-Check für {candidateChecks.length} priorisierte Kandidaten
            </h2>
            {candidateChecks.length === 0 && (
              <p style={{ fontSize: 12, color: "#888" }}>Keine Pokal/DFB-Kandidaten zum Prüfen gefunden.</p>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {candidateChecks.map((c, i) => (
                <div key={i} style={{ border: "1px solid #2a2a2a", padding: 8, fontSize: 12 }}>
                  <div>
                    <strong>Name:</strong> {String(c.entry.leagueName)}
                  </div>
                  <div>
                    <strong>Shortcut:</strong> {String(c.entry.leagueShortcut)} · <strong>Season:</strong>{" "}
                    {String(c.entry.leagueSeason)} · <strong>LeagueId:</strong> {String(c.entry.leagueId)}
                  </div>
                  <div>
                    <strong>Abruf-Status:</strong> {c.status}
                    {c.httpStatus ? ` (HTTP ${c.httpStatus})` : ""}
                    {c.totalMatches !== undefined ? ` · ${c.totalMatches} Spiele insgesamt` : ""}
                  </div>
                  {c.msvHits.length === 0 ? (
                    <div style={{ color: "#8B93A3" }}>Kein MSV-Team in diesem Wettbewerb gefunden.</div>
                  ) : (
                    <div style={{ marginTop: 6 }}>
                      <strong style={{ color: "#2FBF71" }}>{c.msvHits.length} MSV-Spiel(e) gefunden:</strong>
                      {c.msvHits.map((hit, j) => (
                        <div key={j} style={{ marginTop: 4, paddingLeft: 8, borderLeft: "2px solid #1E5FD9" }}>
                          <div>MatchID: {hit.matchId}</div>
                          <div>
                            {hit.isHome ? "MSV" : hit.opponent} vs {hit.isHome ? hit.opponent : "MSV"}
                          </div>
                          <div>Kickoff: {hit.kickoff}</div>
                          <div>Runde: {hit.round || "(kein Group-Name geliefert)"}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          <section style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>
              A) Alle "Pokal"/"DFB"-Treffer in getavailableleagues ({dfbMatches.length})
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {dfbMatches.map((e, i) => (
                <div key={i} style={{ border: "1px solid #2a2a2a", padding: 6, fontSize: 11, color: "#8B93A3" }}>
                  {String(e.leagueName)} · Shortcut: {String(e.leagueShortcut)} · Season: {String(e.leagueSeason)}
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>
              Niederrhein-Treffer ({niederrheinMatches.length}) — bewusst nicht weiter verfolgt
            </h2>
            <p style={{ fontSize: 11, color: "#8B93A3" }}>
              Unverändert aus dem vorherigen Probe-Stand, nur zur Referenz.
            </p>
          </section>
        </>
      )}
    </div>
  );
}
