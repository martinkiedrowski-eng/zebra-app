import { Metadata } from "next";

// Temporäre, isolierte Debug-Route für den V1.1-Kader-Reality-Check.
// Ruft TheSportsDB serverseitig DIREKT auf — aus der echten Vercel-
// Umgebung, nicht aus einer Recherche-Sandbox, die zuvor wiederholt
// Arsenal-Beispieldaten statt MSV zurückgab. Fest verdrahtete Team-ID
// (133877), fester öffentlicher Test-Key (123), KEINE Suche, KEIN
// Fallback, KEINE Mock-/Platzhalterdaten — jeder Fehler-/Blockzustand
// wird 1:1 angezeigt, nicht kompensiert. Keine produktive Logik
// importiert diese Datei, keine bestehende Seite verändert.
export const metadata: Metadata = {
  title: "ZEBRA — TheSportsDB MSV Reality Check (Debug)",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const API_KEY = "123";
const TEAM_ID = "133877"; // MSV Duisburg — fest, keine Suche, kein Fallback
const BASE_URL = `https://www.thesportsdb.com/api/v1/json/${API_KEY}`;

interface FetchDiagnostic {
  url: string;
  ok: boolean;
  status: number | null;
  contentType: string | null;
  isJson: boolean;
  raw: string | null;
  parsed: unknown;
  error: string | null;
}

async function diagnosticFetch(url: string): Promise<FetchDiagnostic> {
  try {
    const res = await fetch(url, { cache: "no-store" });
    const contentType = res.headers.get("content-type");
    const raw = await res.text();
    let parsed: unknown = null;
    let isJson = false;
    try {
      parsed = JSON.parse(raw);
      isJson = true;
    } catch {
      isJson = false;
    }
    return { url, ok: res.ok, status: res.status, contentType, isJson, raw, parsed, error: null };
  } catch (err) {
    return {
      url,
      ok: false,
      status: null,
      contentType: null,
      isJson: false,
      raw: null,
      parsed: null,
      error: err instanceof Error ? err.message : "Unbekannter Fehler",
    };
  }
}

function fmt(v: unknown): string {
  if (v === undefined) return "(Feld nicht vorhanden)";
  if (v === null) return "null";
  return String(v);
}

interface RawPlayer {
  idPlayer?: string;
  strPlayer?: string;
  strNumber?: string;
  strPosition?: string;
  strNationality?: string;
  dateBorn?: string;
  strStatus?: string;
  strThumb?: string;
  strCutout?: string;
  idTeam?: string;
}

export default async function TheSportsDbMsvDebugPage() {
  const teamUrl = `${BASE_URL}/lookupteam.php?id=${TEAM_ID}`;
  const playersUrl = `${BASE_URL}/lookup_all_players.php?id=${TEAM_ID}`;

  const [teamRes, playersRes] = await Promise.all([diagnosticFetch(teamUrl), diagnosticFetch(playersUrl)]);

  const teamObj =
    teamRes.isJson && teamRes.parsed && typeof teamRes.parsed === "object" && "teams" in (teamRes.parsed as object)
      ? ((teamRes.parsed as { teams: unknown }).teams as unknown[])?.[0]
      : null;
  const returnedTeamId =
    teamObj && typeof teamObj === "object" && "idTeam" in teamObj ? String((teamObj as { idTeam: unknown }).idTeam) : null;

  const players: RawPlayer[] =
    playersRes.isJson && playersRes.parsed && typeof playersRes.parsed === "object" && "player" in (playersRes.parsed as object)
      ? (((playersRes.parsed as { player: unknown }).player as RawPlayer[]) ?? [])
      : [];

  const activeCount = players.filter((p) => p.strStatus === "Active").length;
  const otherStatusCount = players.length - activeCount;
  const firstPlayer = players[0] ?? null;
  const lastPlayer = players.length > 0 ? players[players.length - 1] : null;

  return (
    <div style={{ background: "#0B0E13", color: "#F4F6FA", minHeight: "100vh", padding: 20, fontFamily: "monospace", fontSize: 13 }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>ZEBRA — TheSportsDB MSV Reality Check</h1>
      <p style={{ fontSize: 12, color: "#888", marginBottom: 20 }}>
        Fest verdrahtete Team-ID {TEAM_ID}, kein Suchendpunkt, kein Fallback, keine Mock-Daten. Jeder Fehlerzustand
        wird unverändert angezeigt.
      </p>

      {/* A) REQUEST — Team */}
      <section style={{ marginBottom: 20, borderBottom: "1px solid #333", paddingBottom: 12 }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>A) REQUEST — lookupteam.php</h2>
        <div>Aufgerufener Endpoint: {teamRes.url}</div>
        <div>Angeforderte Team-ID: {TEAM_ID}</div>
        <div>HTTP Status: {fmt(teamRes.status)}</div>
        <div>Content-Type: {fmt(teamRes.contentType)}</div>
        <div>Fetch erfolgreich: {teamRes.error ? "NEIN" : "JA"}</div>
        <div>Antwort ist valides JSON: {teamRes.isJson ? "JA" : "NEIN"}</div>
        {teamRes.error && <div style={{ color: "#FF3B4E" }}>Fehler: {teamRes.error}</div>}
      </section>

      {/* B) TEAM */}
      <section style={{ marginBottom: 20, borderBottom: "1px solid #333", paddingBottom: 12 }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>B) TEAM</h2>
        {!teamObj ? (
          <p style={{ color: "#FF3B4E" }}>Kein Team-Objekt in der Antwort — siehe Raw-Ausschnitt unten.</p>
        ) : (
          <div style={{ border: "1px solid #2a2a2a", padding: 8 }}>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>
              REQUESTED TEAM ID: {TEAM_ID} · RETURNED TEAM ID: {fmt(returnedTeamId)}{" "}
              {returnedTeamId === TEAM_ID ? "✅ STIMMT ÜBEREIN" : "❌ WEICHT AB"}
            </div>
            <div>Teamname: {fmt((teamObj as Record<string, unknown>)["strTeam"])}</div>
            <div>Liga: {fmt((teamObj as Record<string, unknown>)["strLeague"])}</div>
            <div>Stadion: {fmt((teamObj as Record<string, unknown>)["strStadium"])}</div>
            <div>Land: {fmt((teamObj as Record<string, unknown>)["strCountry"])}</div>
            <div>Sport: {fmt((teamObj as Record<string, unknown>)["strSport"])}</div>
          </div>
        )}
      </section>

      {/* A) REQUEST — Players */}
      <section style={{ marginBottom: 20, borderBottom: "1px solid #333", paddingBottom: 12 }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>A) REQUEST — lookup_all_players.php</h2>
        <div>Aufgerufener Endpoint: {playersRes.url}</div>
        <div>Angeforderte Team-ID: {TEAM_ID}</div>
        <div>HTTP Status: {fmt(playersRes.status)}</div>
        <div>Content-Type: {fmt(playersRes.contentType)}</div>
        <div>Fetch erfolgreich: {playersRes.error ? "NEIN" : "JA"}</div>
        <div>Antwort ist valides JSON: {playersRes.isJson ? "JA" : "NEIN"}</div>
        {playersRes.error && <div style={{ color: "#FF3B4E" }}>Fehler: {playersRes.error}</div>}
      </section>

      {/* C) PLAYERS */}
      <section style={{ marginBottom: 20, borderBottom: "1px solid #333", paddingBottom: 12 }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>C) PLAYERS — PLAYER COUNT: {players.length}</h2>
        {players.length === 0 ? (
          <p style={{ color: "#FF3B4E" }}>Keine Spieler in der Antwort — siehe Raw-Ausschnitt unten.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 700, overflowY: "auto" }}>
            {players.map((p, i) => (
              <div key={i} style={{ border: "1px solid #2a2a2a", padding: 6 }}>
                <div>
                  idPlayer: {fmt(p.idPlayer)} · idTeam (Rückkontrolle): {fmt(p.idTeam)}{" "}
                  {p.idTeam !== undefined && p.idTeam !== TEAM_ID ? "❌ WEICHT AB" : ""}
                </div>
                <div>strPlayer: {fmt(p.strPlayer)}</div>
                <div>
                  Nr. {fmt(p.strNumber)} · Position: {fmt(p.strPosition)} · Nationalität: {fmt(p.strNationality)}
                </div>
                <div>
                  geb. {fmt(p.dateBorn)} · Status: {fmt(p.strStatus)}
                </div>
                <div>
                  strThumb vorhanden: {p.strThumb ? "JA" : "NEIN"} · strCutout vorhanden: {p.strCutout ? "JA" : "NEIN"}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* D) RAW CHECK */}
      <section style={{ marginBottom: 20, borderBottom: "1px solid #333", paddingBottom: 12 }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>D) RAW CHECK</h2>
        <div>Erster Spieler: {firstPlayer ? fmt(firstPlayer.strPlayer) : "(keiner)"}</div>
        <div>Letzter Spieler: {lastPlayer ? fmt(lastPlayer.strPlayer) : "(keiner)"}</div>
        <div>Anzahl Status "Active": {activeCount}</div>
        <div>Anzahl Status Coaching/sonstige: {otherStatusCount}</div>
      </section>

      {/* Roher JSON-Ausschnitt zur Diagnose */}
      <section>
        <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>Roher Antwort-Ausschnitt (gekürzt)</h2>
        <div style={{ color: "#8B93A3", marginBottom: 4 }}>lookupteam.php (erste 500 Zeichen):</div>
        <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-all", fontSize: 11, color: "#8B93A3" }}>
          {teamRes.raw ? teamRes.raw.slice(0, 500) : "(kein Body)"}
        </pre>
        <div style={{ color: "#8B93A3", marginTop: 10, marginBottom: 4 }}>
          lookup_all_players.php (erste 500 Zeichen):
        </div>
        <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-all", fontSize: 11, color: "#8B93A3" }}>
          {playersRes.raw ? playersRes.raw.slice(0, 500) : "(kein Body)"}
        </pre>
      </section>
    </div>
  );
}
