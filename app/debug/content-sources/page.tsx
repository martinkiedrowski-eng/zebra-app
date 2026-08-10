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

      {result.diagnostics && <MsvDiagnosticsBlock diagnostics={result.diagnostics} />}
    </section>
  );
}

function MsvDiagnosticsBlock({ diagnostics }: { diagnostics: NonNullable<ProbeResult["diagnostics"]> }) {
  return (
    <div style={{ marginTop: 20, borderTop: "1px dashed #444", paddingTop: 16 }}>
      <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 10 }}>Struktur-Diagnose (msv-duisburg.de)</h3>

      <h4 style={{ fontSize: 13, fontWeight: 700, margin: "12px 0 4px" }}>A) Page Info</h4>
      <div style={{ fontSize: 12 }}>
        <div>Finale URL: {diagnostics.pageInfo.finalUrl}</div>
        <div>HTTP Status: {diagnostics.pageInfo.httpStatus}</div>
        <div>Content-Type: {diagnostics.pageInfo.contentType ?? "—"}</div>
        <div>HTML-Länge: {diagnostics.pageInfo.htmlLength.toLocaleString("de-DE")} Zeichen</div>
      </div>

      <h4 style={{ fontSize: 13, fontWeight: 700, margin: "12px 0 4px" }}>F) Robots</h4>
      <div style={{ fontSize: 12 }}>{diagnostics.robotsAssessment}</div>

      <h4 style={{ fontSize: 13, fontWeight: 700, margin: "12px 0 4px" }}>B) Link Diagnostics</h4>
      <div style={{ fontSize: 12, marginBottom: 8 }}>
        <div>Gesamtzahl Links: {diagnostics.linkDiagnostics.totalLinks}</div>
        <div>Interne Links: {diagnostics.linkDiagnostics.internalLinks}</div>
        <div>News-artige Links: {diagnostics.linkDiagnostics.newsLikeLinks}</div>
        <div>Angezeigte Content-Link-Samples: {diagnostics.linkDiagnostics.samples.length}</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {diagnostics.linkDiagnostics.samples.map((s, i) => (
          <div key={i} style={{ border: "1px solid #2a2a2a", padding: 6, fontSize: 11 }}>
            <div>
              <strong>href:</strong> {s.href}
            </div>
            <div>
              <strong>text:</strong> {s.text ?? "—"}
            </div>
            <div>
              <strong>a.class:</strong> {s.linkClass ?? "—"}
            </div>
            <div>
              <strong>parent:</strong> {s.parentTag ?? "—"}.{s.parentClass ?? "(keine class)"}
            </div>
            <div>
              <strong>container:</strong> {s.containerTag ?? "—"}.{s.containerClass ?? "(keine class)"}
            </div>
          </div>
        ))}
      </div>

      <h4 style={{ fontSize: 13, fontWeight: 700, margin: "12px 0 4px" }}>C) Structure Diagnostics</h4>
      <div style={{ fontSize: 12, marginBottom: 6 }}>
        <strong>Häufige Klassennamen (Top 15):</strong>{" "}
        {diagnostics.structureDiagnostics.commonClassNames.length > 0
          ? diagnostics.structureDiagnostics.commonClassNames.map((c) => `${c.className} (${c.count})`).join(", ")
          : "keine gefunden"}
      </div>
      <div style={{ fontSize: 12, marginBottom: 6 }}>
        <strong>Mögliche wiederkehrende Container:</strong>{" "}
        {diagnostics.structureDiagnostics.possibleContainers.length > 0
          ? diagnostics.structureDiagnostics.possibleContainers.map((c) => `${c.tag}.${c.className}`).join(" | ")
          : "keine gefunden"}
      </div>
      <div style={{ fontSize: 12, marginBottom: 6 }}>
        <strong>Vorkommende Tags:</strong>{" "}
        {diagnostics.structureDiagnostics.tagsFound.length > 0
          ? diagnostics.structureDiagnostics.tagsFound.map((t) => `${t.tag} (${t.count})`).join(", ")
          : "keine der gesuchten Tags gefunden"}
      </div>
      <div style={{ fontSize: 12, marginBottom: 6 }}>
        <strong>datetime-Werte:</strong>{" "}
        {diagnostics.structureDiagnostics.datetimeValues.length > 0
          ? diagnostics.structureDiagnostics.datetimeValues.join(", ")
          : "keine gefunden"}
      </div>
      <div style={{ fontSize: 12, marginBottom: 10 }}>
        <strong>Bild-Attribute (bis 5 Teaser):</strong>
        <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 4 }}>
          {diagnostics.structureDiagnostics.imageSamples.length > 0 ? (
            diagnostics.structureDiagnostics.imageSamples.map((img, i) => (
              <div key={i}>
                src={img.src ?? "—"} · data-src={img.dataSrc ?? "—"} · srcset=
                {img.srcset ? "(vorhanden)" : "—"}
              </div>
            ))
          ) : (
            <div>keine gefunden</div>
          )}
        </div>
      </div>

      <h4 style={{ fontSize: 13, fontWeight: 700, margin: "12px 0 4px" }}>D) Text Samples</h4>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {diagnostics.textSamples.length > 0 ? (
          diagnostics.textSamples.map((t, i) => (
            <div key={i} style={{ border: "1px solid #2a2a2a", padding: 6, fontSize: 11 }}>
              <div>
                <strong>CONTAINER TAG:</strong> {t.containerTag ?? "—"}
              </div>
              <div>
                <strong>CONTAINER CLASS:</strong> {t.containerClass ?? "—"}
              </div>
              <div>
                <strong>HEADLINE:</strong> {t.headline ?? "—"}
              </div>
              <div>
                <strong>LINK:</strong> {t.link ?? "—"}
              </div>
              <div>
                <strong>DATE/TIME:</strong> {t.date ?? "—"}
              </div>
              <div>
                <strong>IMAGE ATTRIBUTE(S):</strong> {t.imageAttrs ?? "—"}
              </div>
              <div>
                <strong>CATEGORY/TAG:</strong> {t.category ?? "—"}
              </div>
              <div>
                <strong>TEXT SAMPLE:</strong> {t.textSample ?? "—"}
              </div>
            </div>
          ))
        ) : (
          <div style={{ fontSize: 12 }}>Keine Text-Samples ermittelbar.</div>
        )}
      </div>
    </div>
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
