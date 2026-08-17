import { Metadata } from "next";

// Temporäre, isolierte Debug-Route für den V1.1-Data-Reality-Check
// (Thema: ClubPlatform/ZebraTicker). Prüft ausschließlich, ob die
// offizielle MSV-Spielplanseite (msv-duisburg.de) im HTML/Script-Code
// bereits eine ClubPlatform-Match-ID für das nächste Spiel eingebettet
// hat — das wäre der einzige gefundene, potenziell verlässliche Weg, die
// Match-ID dynamisch zu bestimmen (die IDs selbst sind nachweislich
// fortlaufende, cross-club interne Datenbank-IDs ohne erkennbare Formel
// aus Datum/Gegner, siehe Reality-Check-Bericht). Keine Secrets, kein
// Produktionscode betroffen.
export const metadata: Metadata = {
  title: "ZEBRA — V1.1 ClubPlatform Reality Check (Debug)",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const MSV_SPIELPLAN_URL = "https://www.msv-duisburg.de/aktuelles/spielplan/";

async function fetchText(url: string): Promise<{ ok: boolean; status: number | null; text: string }> {
  try {
    const res = await fetch(url, {
      cache: "no-store",
      headers: { "User-Agent": "Mozilla/5.0 (compatible; ZebraV11Probe/0.1; debug-only)" },
    });
    const text = await res.text();
    return { ok: res.ok, status: res.status, text };
  } catch (err) {
    return { ok: false, status: null, text: err instanceof Error ? err.message : "Unbekannter Fehler" };
  }
}

export default async function V11ClubplatformDebugPage() {
  const res = await fetchText(MSV_SPIELPLAN_URL);

  const mentionsClubplatform = res.text.toLowerCase().includes("clubplatform");
  const mentionsZebraFm = res.text.toLowerCase().includes("zebrafm");

  // Alle Fundstellen mit etwas Kontext extrahieren, statt die ganze Seite zu dumpen.
  const contexts: string[] = [];
  if (mentionsClubplatform) {
    const lower = res.text.toLowerCase();
    let idx = lower.indexOf("clubplatform");
    let guard = 0;
    while (idx !== -1 && guard < 5) {
      contexts.push(res.text.slice(Math.max(0, idx - 80), idx + 120));
      idx = lower.indexOf("clubplatform", idx + 1);
      guard++;
    }
  }

  return (
    <div style={{ background: "#0B0E13", color: "#F4F6FA", minHeight: "100vh", padding: 20, fontFamily: "monospace", fontSize: 13 }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>ZEBRA — V1.1 ClubPlatform Reality Check</h1>
      <p style={{ fontSize: 13, color: "#888", marginBottom: 20 }}>
        Prüft die offizielle MSV-Spielplanseite auf eingebettete ClubPlatform-Hinweise.
      </p>

      <div style={{ marginBottom: 8 }}>URL: {MSV_SPIELPLAN_URL}</div>
      <div style={{ marginBottom: 8 }}>HTTP Status: {res.status ?? "—"}</div>
      <div style={{ marginBottom: 16 }}>HTML-Länge: {res.text.length.toLocaleString("de-DE")} Zeichen</div>

      <section style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>
          "clubplatform" im HTML gefunden: {mentionsClubplatform ? "JA" : "NEIN"}
        </h2>
        {contexts.map((c, i) => (
          <div key={i} style={{ border: "1px solid #2a2a2a", padding: 6, fontSize: 11, marginBottom: 6, wordBreak: "break-all" }}>
            …{c}…
          </div>
        ))}
      </section>

      <section>
        <h2 style={{ fontSize: 14, fontWeight: 700 }}>"zebrafm" im HTML gefunden: {mentionsZebraFm ? "JA" : "NEIN"}</h2>
      </section>
    </div>
  );
}
