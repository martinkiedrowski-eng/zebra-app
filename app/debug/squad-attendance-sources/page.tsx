import { Metadata } from "next";

// Temporäre, isolierte Debug-Route für den Kader-/Zuschauer-Reality-Check.
// TheSportsDB ist die EINZIGE der recherchierten Zusatzquellen, die ohne
// einen echten, persönlichen API-Key testbar ist — die Basis-URL nutzt
// TheSportsDBs eigenen, öffentlich dokumentierten kostenlosen Test-Schlüssel
// "3" (kein Secret, keine Registrierung, offizielles Free-Tier-Muster von
// TheSportsDB selbst). API-Football/Sportmonks/football-data.org bräuchten
// einen echten Account-Key, den dieser Probe nicht besitzt und den ein
// Debug-Probe laut Vorgabe ohnehin nicht ausgeben dürfte — deren Bewertung
// bleibt deshalb bei der Dokumentations-Recherche im Chat.
export const metadata: Metadata = {
  title: "ZEBRA — Squad/Attendance Sources Reality Check (Debug)",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const THESPORTSDB_BASE = "https://www.thesportsdb.com/api/v1/json/3";

async function fetchJson(url: string): Promise<{ ok: true; status: number; data: unknown } | { ok: false; error: string }> {
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };
    const data = await res.json();
    return { ok: true, status: res.status, data };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unbekannter Fehler" };
  }
}

function firstTeam(raw: unknown): Record<string, unknown> | null {
  if (typeof raw !== "object" || raw === null) return null;
  const obj = raw as Record<string, unknown>;
  const teams = obj["teams"];
  if (!Array.isArray(teams) || teams.length === 0) return null;
  const first = teams[0];
  return typeof first === "object" && first !== null ? (first as Record<string, unknown>) : null;
}

function playersList(raw: unknown): Record<string, unknown>[] {
  if (typeof raw !== "object" || raw === null) return [];
  const obj = raw as Record<string, unknown>;
  const players = obj["player"];
  if (!Array.isArray(players)) return [];
  return players.filter((p): p is Record<string, unknown> => typeof p === "object" && p !== null);
}

export default async function SquadAttendanceDebugPage() {
  const teamSearch = await fetchJson(`${THESPORTSDB_BASE}/searchteams.php?t=${encodeURIComponent("MSV Duisburg")}`);
  const team = teamSearch.ok ? firstTeam(teamSearch.data) : null;
  const teamId = team ? String(team["idTeam"] ?? "") : null;

  const playersResult = teamId
    ? await fetchJson(`${THESPORTSDB_BASE}/lookup_all_players.php?id=${teamId}`)
    : ({ ok: false, error: "Keine Team-ID gefunden" } as const);
  const players = playersResult.ok ? playersList(playersResult.data) : [];

  const squadFieldsOk = players.length > 0;
  const hasNumberField = players.some((p) => "strNumber" in p && p["strNumber"]);
  const hasPositionField = players.some((p) => "strPosition" in p && p["strPosition"]);
  const hasBirthdateField = players.some((p) => "dateBorn" in p && p["dateBorn"]);
  const hasNationalityField = players.some((p) => "strNationality" in p && p["strNationality"]);

  return (
    <div style={{ background: "#0B0E13", color: "#F4F6FA", minHeight: "100vh", padding: 24, fontFamily: "monospace" }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>ZEBRA — Squad/Attendance Sources Reality Check</h1>
      <p style={{ fontSize: 13, color: "#888", marginBottom: 24 }}>
        Temporäre Debug-Route. Prüft live TheSportsDB (freier Test-Key, keine Registrierung) auf MSV-Kaderdaten.
        API-Football/Sportmonks/football-data.org sind dokumentationsbasiert im Reality-Check-Bericht bewertet —
        ohne echten Account-Key hier nicht live testbar.
      </p>

      <section style={{ marginBottom: 28, borderBottom: "1px solid #333", paddingBottom: 20 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>A) TheSportsDB — Team-Suche "MSV Duisburg"</h2>
        {!teamSearch.ok ? (
          <p style={{ color: "#FF3B4E", fontSize: 13 }}>Fehler: {teamSearch.error}</p>
        ) : !team ? (
          <p style={{ fontSize: 12, color: "#888" }}>Kein Team gefunden.</p>
        ) : (
          <div style={{ fontSize: 12 }}>
            <div>idTeam: {String(team["idTeam"] ?? "–")}</div>
            <div>strTeam: {String(team["strTeam"] ?? "–")}</div>
            <div>strLeague: {String(team["strLeague"] ?? "–")}</div>
            <div>strStadium: {String(team["strStadium"] ?? "–")}</div>
          </div>
        )}
      </section>

      <section style={{ marginBottom: 28, borderBottom: "1px solid #333", paddingBottom: 20 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>B) Kader (lookup_all_players)</h2>
        {!playersResult.ok ? (
          <p style={{ color: "#FF3B4E", fontSize: 13 }}>Fehler: {playersResult.error}</p>
        ) : (
          <>
            <p style={{ fontSize: 13, marginBottom: 8 }}>{players.length} Spieler gefunden.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 500, overflowY: "auto" }}>
              {players.slice(0, 40).map((p, i) => (
                <div key={i} style={{ border: "1px solid #2a2a2a", padding: 6, fontSize: 12 }}>
                  {String(p["strPlayer"] ?? "–")} · Nr. {String(p["strNumber"] ?? "–")} · Pos:{" "}
                  {String(p["strPosition"] ?? "–")} · geb. {String(p["dateBorn"] ?? "–")} ·{" "}
                  {String(p["strNationality"] ?? "–")}
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      <section>
        <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>C) Technische Zusammenfassung</h2>
        <div style={{ fontSize: 13, display: "flex", flexDirection: "column", gap: 4 }}>
          <div>TheSportsDB liefert MSV-Kaderdaten: {squadFieldsOk ? "JA" : "NEIN"}</div>
          <div>Rückennummer-Feld befüllt (mind. 1 Spieler): {hasNumberField ? "JA" : "NEIN"}</div>
          <div>Positions-Feld befüllt: {hasPositionField ? "JA" : "NEIN"}</div>
          <div>Geburtsdatum-Feld befüllt: {hasBirthdateField ? "JA" : "NEIN"}</div>
          <div>Nationalitäts-Feld befüllt: {hasNationalityField ? "JA" : "NEIN"}</div>
          <div style={{ color: "#8B93A3", marginTop: 6 }}>
            Zuschauerdaten: TheSportsDB bietet für diese Liga-Ebene keinen dokumentierten Attendance-Endpunkt —
            hier bewusst nicht live getestet, siehe Reality-Check-Bericht.
          </div>
        </div>
      </section>
    </div>
  );
}
