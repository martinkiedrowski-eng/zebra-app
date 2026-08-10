import { Metadata } from "next";
import { probeYoutube } from "./_probe/fetchYoutube";
import { probeLiga3 } from "./_probe/fetchLiga3";
import { probeReviersport } from "./_probe/fetchReviersport";
import { probeMsv } from "./_probe/fetchMsv";
import { ProbeResult, emptyResult } from "./_probe/types";

// Temporäre Debug-Route — bewusst nicht indexierbar und nicht in der
// Bottom Navigation verlinkt. Vollständig isoliert unter app/debug/ +
// _probe/: kann später durch Löschen dieses einen Ordners rückstandsfrei
// entfernt werden. Keine bestehende Datei wurde dafür verändert.
export const metadata: Metadata = {
  title: "ZEBRA — Content Source Probe (Debug)",
  robots: { index: false, follow: false },
};

// Nie cachen — jeder Aufruf soll den aktuellen Live-Zustand zeigen.
export const dynamic = "force-dynamic";

async function runProbe(fn: () => Promise<ProbeResult>, label: string): Promise<ProbeResult> {
  try {
    return await fn();
  } catch (err) {
    const fallback = emptyResult(label);
    fallback.status = "Unerwarteter Fehler im Probe selbst";
    fallback.errorMessage = err instanceof Error ? err.message : "Unbekannter Fehler";
    return fallback;
  }
}

function StatusBadge({ ok }: { ok: boolean }) {
  return (
    <span style={{ color: ok ? "#2FBF71" : "#FF3B4E", fontWeight: 700 }}>{ok ? "✓" : "✗"}</span>
  );
}

function ResultBlock({ result }: { result: ProbeResult }) {
  return (
    <section style={{ marginBottom: 32, borderBottom: "1px solid #333", paddingBottom: 24 }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{result.source}</h2>
      <table style={{ fontSize: 13, borderCollapse: "collapse", marginBottom: 12 }}>
        <tbody>
          <tr>
            <td style={{ paddingRight: 16, color: "#888" }}>STATUS</td>
            <td>{result.status}</td>
          </tr>
          <tr>
            <td style={{ paddingRight: 16, color: "#888" }}>HTTP STATUS</td>
            <td>{result.httpStatus ?? "—"}</td>
          </tr>
          <tr>
            <td style={{ paddingRight: 16, color: "#888" }}>CONTENT TYPE</td>
            <td>{result.contentType ?? "—"}</td>
          </tr>
          <tr>
            <td style={{ paddingRight: 16, color: "#888" }}>FETCH SUCCESS</td>
            <td>
              <StatusBadge ok={result.fetchSuccess} />
            </td>
          </tr>
          <tr>
            <td style={{ paddingRight: 16, color: "#888" }}>PARSE SUCCESS</td>
            <td>
              <StatusBadge ok={result.parseSuccess} />
            </td>
          </tr>
          <tr>
            <td style={{ paddingRight: 16, color: "#888" }}>ITEM COUNT</td>
            <td>{result.itemCount ?? "—"}</td>
          </tr>
        </tbody>
      </table>

      {result.errorMessage && (
        <p style={{ color: "#FF3B4E", fontSize: 13, marginBottom: 12 }}>
          Fehler: {result.errorMessage}
        </p>
      )}

      {result.notes.length > 0 && (
        <div style={{ fontSize: 12, color: "#aaa", marginBottom: 12, whiteSpace: "pre-wrap" }}>
          {result.notes.map((note, i) => (
            <div key={i}>{note}</div>
          ))}
        </div>
      )}

      {result.items.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {result.items.map((item, i) => (
            <div key={i} style={{ border: "1px solid #333", padding: 8, fontSize: 12 }}>
              <div>
                <strong>Titel:</strong> {item.title ?? "—"}
              </div>
              <div>
                <strong>Datum:</strong> {item.date ?? "—"}
              </div>
              <div>
                <strong>URL:</strong> {item.url ?? "—"}
              </div>
              <div>
                <strong>Teaser:</strong> {item.teaser ?? "—"}
              </div>
              <div>
                <strong>Bild:</strong> {item.image ?? "—"}
              </div>
              {item.extra &&
                Object.entries(item.extra).map(([key, value]) => (
                  <div key={key}>
                    <strong>{key}:</strong> {value ?? "—"}
                  </div>
                ))}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default async function ContentSourcesDebugPage() {
  const [youtube, liga3, reviersport, msv] = await Promise.all([
    runProbe(probeYoutube, "YouTube / ZebraTV"),
    runProbe(probeLiga3, "liga3-online.de"),
    runProbe(probeReviersport, "RevierSport"),
    runProbe(probeMsv, "msv-duisburg.de"),
  ]);

  return (
    <div style={{ background: "#0B0E13", color: "#F4F6FA", minHeight: "100vh", padding: 24, fontFamily: "monospace" }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>ZEBRA — Content Source Probe</h1>
      <p style={{ fontSize: 13, color: "#888", marginBottom: 24 }}>
        Temporäre Debug-Route. Zeigt reale serverseitige Fetch-/Parse-Ergebnisse der vier geplanten
        Content-Quellen — keine erfundenen Felder, nur was tatsächlich ankommt.
      </p>

      <ResultBlock result={youtube} />
      <ResultBlock result={liga3} />
      <ResultBlock result={reviersport} />
      <ResultBlock result={msv} />
    </div>
  );
}
