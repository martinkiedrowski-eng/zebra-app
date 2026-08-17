import { Metadata } from "next";

// Temporäre, isolierte Debug-Route für den V1.1-Data-Reality-Check
// (Thema: MSV-Kader). Nutzt TheSportsDBs offiziell dokumentierten,
// öffentlichen Test-Key "123" (kein Secret, keine Registrierung nötig —
// siehe TheSportsDB-Dokumentation). Frühere Recherche in diesem Projekt
// hatte fälschlich den Key "3" verwendet; aktuelle Recherche zeigt, dass
// "123" der offiziell dokumentierte, aber laut Drittquellen ggf. auf
// Beispiel-Teams beschränkte Test-Key ist — dieser Probe klärt das live.
// Keine Secrets, kein Produktionscode betroffen.
export const metadata: Metadata = {
  title: "ZEBRA — V1.1 Squad Reality Check (Debug)",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const TEST_KEY = "123";
const BASE = `https://www.thesportsdb.com/api/v1/json/${TEST_KEY}`;

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
  const teams = (raw as Record<string, unknown>)["teams"];
  if (!Array.isArray(teams) || teams.length === 0) return null;
  const t = teams[0];
  return typeof t === "object" && t !== null ? (t as Record<string, unknown>) : null;
}

function playersList(raw: unknown): Record<string, unknown>[] {
  if (typeof raw !== "object" || raw === null) return [];
  const players = (raw as Record<string, unknown>)["player"];
  if (!Array.isArray(players)) return [];
  return players.filter((p): p is Record<string, unknown> => typeof p === "object" && p !== null);
}

export default async function V11SquadDebugPage() {
  const teamSearch = await fetchJson(`${BASE}/searchteams.php?t=${encodeURIComponent("MSV Duisburg")}`);
  const team = teamSearch.ok ? firstTeam(teamSearch.data) : null;
  const teamId = team ? String(team["idTeam"] ?? "") : null;

  const playersResult = teamId
    ? await fetchJson(`${BASE}/lookup_all_players.php?id=${teamId}`)
    : ({ ok: false, error: "Keine Team-ID gefunden — Suche selbst bereits leer/eingeschränkt" } as const);
  const players = playersResult.ok ? playersList(playersResult.data) : [];

  const withNumber = players.filter((p) => p["strNumber"]);
  const withPosition = players.filter((p) => p["strPosition"]);
  const withBirthdate = players.filter((p) => p["dateBorn"]);
  const withNationality = players.filter((p) => p["strNationality"]);
  const withPhoto = players.filter((p) => p["strCutout"] || p["strThumb"]);

  return (
    <div style={{ background: "#0B0E13", color: "#F4F6FA", minHeight: "100vh", padding: 20, fontFamily: "monospace", fontSize: 13 }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>ZEBRA — V1.1 Squad Reality Check</h1>
      <p style={{ fontSize: 13, color: "#888", marginBottom: 20 }}>
        TheSportsDB, offizieller Test-Key "123" (kein persönlicher Key, kein Secret).
      </p>

      <section style={{ marginBottom: 20, borderBottom: "1px solid #333", paddingBottom: 14 }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>A) Team-Suche</h2>
        {!teamSearch.ok ? (
          <p style={{ color: "#FF3B4E" }}>Fehler: {teamSearch.error}</p>
        ) : !team ? (
          <p style={{ color: "#FF3B4E" }}>
            Kein Team gefunden — spricht dafür, dass der Test-Key "123" auf Beispiel-Teams (z.B. "Arsenal")
            beschränkt ist und MSV Duisburg damit NICHT frei abrufbar ist.
          </p>
        ) : (
          <div>
            <div>idTeam: {String(team["idTeam"] ?? "–")}</div>
            <div>strTeam: {String(team["strTeam"] ?? "–")}</div>
            <div>strLeague: {String(team["strLeague"] ?? "–")}</div>
          </div>
        )}
      </section>

      <section style={{ marginBottom: 20, borderBottom: "1px solid #333", paddingBottom: 14 }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>B) Kader (lookup_all_players)</h2>
        {!playersResult.ok ? (
          <p style={{ color: "#FF3B4E" }}>Fehler: {playersResult.error}</p>
        ) : (
          <>
            <p style={{ marginBottom: 8 }}>{players.length} Spieler gefunden.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 500, overflowY: "auto" }}>
              {players.map((p, i) => (
                <div key={i} style={{ border: "1px solid #2a2a2a", padding: 6, fontSize: 12 }}>
                  {String(p["strPlayer"] ?? "–")} · Nr. {String(p["strNumber"] ?? "–")} · Pos:{" "}
                  {String(p["strPosition"] ?? "–")} · geb. {String(p["dateBorn"] ?? "–")} ·{" "}
                  {String(p["strNationality"] ?? "–")} · Foto: {p["strCutout"] || p["strThumb"] ? "ja" : "nein"}
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      <section>
        <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>C) Vollständigkeit</h2>
        <div>Spieler gesamt: {players.length}</div>
        <div>mit Rückennummer: {withNumber.length}</div>
        <div>mit Position: {withPosition.length}</div>
        <div>mit Geburtsdatum: {withBirthdate.length}</div>
        <div>mit Nationalität: {withNationality.length}</div>
        <div>mit Foto: {withPhoto.length}</div>
      </section>
    </div>
  );
}
