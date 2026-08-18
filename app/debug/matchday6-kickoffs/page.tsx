import { Metadata } from "next";
import { FOOTBALL_CONFIG } from "@/config/football";
import { mapOldbMatch } from "@/providers/football/openligadb/mapMatch";
import { formatKickoffTime, formatDayGroupLabel } from "@/lib/format";

// Temporäre, isolierte Debug-Route für den Spieltag-6-Kickoff-Reality-
// Check (Duisburg–Havelse: ZEBRA zeigt Mi. 16.09., extern gemeldet Di.
// 15.09.). Ruft OpenLigaDB komplett unabhängig ab und stellt die rohen
// Werte direkt neben das Ergebnis der ECHTEN produktiven
// Normalisierungsfunktion (mapOldbMatch, read-only importiert, nicht
// verändert) — so wird sichtbar, ob RAW schon falsch ist oder erst unser
// Mapping den Fehler erzeugt. Keine produktive Datei verändert, keine
// Komponente importiert diese Route.
export const metadata: Metadata = {
  title: "ZEBRA — Spieltag 6 Kickoff Reality Check (Debug)",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const { leagueShortcut, season, baseUrl } = FOOTBALL_CONFIG;
const MATCHDAY = 6;
const ENDPOINT = `${baseUrl}/getmatchdata/${leagueShortcut}/${season}/${MATCHDAY}`;

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
  return String(v);
}

function teamName(m: unknown, side: "Team1" | "Team2"): string {
  const t = rawObj(m, side, side.toLowerCase());
  const name = t ? raw(t, "TeamName", "teamName") : undefined;
  return typeof name === "string" ? name : "?";
}

export default async function Matchday6KickoffsDebugPage() {
  let httpStatus: number | null = null;
  let fetchError: string | null = null;
  let rawMatches: unknown[] = [];

  try {
    const res = await fetch(ENDPOINT, { cache: "no-store" });
    httpStatus = res.status;
    if (res.ok) {
      const data = await res.json();
      rawMatches = Array.isArray(data) ? data : [];
    } else {
      fetchError = `HTTP ${res.status}`;
    }
  } catch (err) {
    fetchError = err instanceof Error ? err.message : "Unbekannter Fehler";
  }

  // Echte produktive Normalisierung, read-only, unverändert.
  const normalized = rawMatches.map((m) => ({ raw: m, match: mapOldbMatch(m) }));

  const havelseEntry = normalized.find(
    ({ match }) =>
      /duisburg/i.test(match.homeTeam.shortName + match.homeTeam.name) ||
      /havelse/i.test(match.awayTeam.shortName + match.awayTeam.name)
  );

  const mismatchCount = normalized.filter(({ raw: r, match }) => {
    const rawKickoff = fmt(raw(r, "MatchDateTime", "matchDateTime"));
    return rawKickoff !== match.kickoff;
  }).length;

  return (
    <div style={{ background: "#0B0E13", color: "#F4F6FA", minHeight: "100vh", padding: 20, fontFamily: "monospace", fontSize: 13 }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>ZEBRA — Spieltag 6 Kickoff Reality Check</h1>
      <p style={{ fontSize: 12, color: "#888", marginBottom: 20 }}>
        RAW OpenLigaDB direkt neben der echten produktiven Normalisierung (mapOldbMatch, unverändert importiert).
      </p>

      <section style={{ marginBottom: 20, borderBottom: "1px solid #333", paddingBottom: 12 }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>A) FETCH</h2>
        <div>Endpoint: {ENDPOINT}</div>
        <div>HTTP Status: {fmt(httpStatus)}</div>
        <div>Anzahl gelieferter Matches: {rawMatches.length}</div>
        {fetchError && <div style={{ color: "#FF3B4E" }}>Fehler: {fetchError}</div>}
      </section>

      {havelseEntry && (
        <section style={{ marginBottom: 20, borderBottom: "1px solid #1E5FD9", paddingBottom: 12 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>DUISBURG – TSV HAVELSE (Kontrollfall)</h2>
          <div>Match-ID: {fmt(raw(havelseEntry.raw, "MatchID", "matchID"))}</div>
          <div style={{ marginTop: 6, fontWeight: 700 }}>
            RAW OPENLIGADB: {fmt(raw(havelseEntry.raw, "MatchDateTime", "matchDateTime"))}
          </div>
          <div>MatchDateTimeUTC: {fmt(raw(havelseEntry.raw, "MatchDateTimeUTC", "matchDateTimeUTC"))}</div>
          <div>TimeZoneID: {fmt(raw(havelseEntry.raw, "TimeZoneID", "timeZoneID", "TimeZoneId", "timeZoneId"))}</div>
          <div style={{ marginTop: 6, fontWeight: 700 }}>ZEBRA NORMALISIERT: {havelseEntry.match.kickoff}</div>
          <div>
            ZEBRA DISPLAY: {formatDayGroupLabel(havelseEntry.match.kickoff)} ·{" "}
            {formatKickoffTime(havelseEntry.match.kickoff)}
          </div>
          <div style={{ marginTop: 6 }}>
            RAW = ZEBRA?{" "}
            {fmt(raw(havelseEntry.raw, "MatchDateTime", "matchDateTime")) === havelseEntry.match.kickoff
              ? "JA (identisch)"
              : "NEIN (unterschiedlich)"}
          </div>
        </section>
      )}

      <section style={{ marginBottom: 20, borderBottom: "1px solid #333", paddingBottom: 12 }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>
          B) ALLE {normalized.length} SPIELE — RAW vs. ZEBRA
        </h2>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>
          Unterschiedliche Kickoffs zwischen RAW und ZEBRA: {mismatchCount} von {normalized.length}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {normalized.map(({ raw: r, match }, i) => {
            const rawKickoff = fmt(raw(r, "MatchDateTime", "matchDateTime"));
            const identical = rawKickoff === match.kickoff;
            return (
              <div
                key={i}
                style={{ border: `1px solid ${identical ? "#2a2a2a" : "#FF3B4E"}`, padding: 6 }}
              >
                <div>
                  {teamName(r, "Team1")} – {teamName(r, "Team2")}
                </div>
                <div>RAW: {rawKickoff}</div>
                <div>ZEBRA: {match.kickoff}</div>
                <div>IDENTISCH: {identical ? "JA" : "NEIN"}</div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
