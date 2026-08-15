import { Metadata } from "next";
import { splitBlocks } from "@/lib/newsFeed/xmlUtils";
import { fetchYoutubeNews } from "@/lib/newsFeed/sources/youtube";
import { getAggregatedNews } from "@/lib/newsFeed/aggregate";

// Temporäre, isolierte Debug-Route für den ZEBRA-1.0-Regressionsfehler
// "keine ZebraTV-Videos mehr sichtbar". Prüft vier Ebenen getrennt:
// A) roher Fetch der YouTube-Feed-URL (eigener, unabhängiger Fetch — nicht
//    fetchWithTimeout(), damit auch bei einem Fehlschlag der tatsächliche
//    HTTP-Status/Content-Type sichtbar bleibt, den die Produktionsfunktion
//    im Fehlerfall bewusst verschluckt),
// B) XML-Erkennung/Entry-Zahl auf dieser rohen Antwort,
// C) das tatsächliche Ergebnis der echten, unveränderten
//    fetchYoutubeNews() (Produktionsfunktion, nur aufgerufen, nicht
//    verändert),
// D) das Ergebnis der echten, unveränderten getAggregatedNews().
// Keine Secrets, keine Änderung an Produktionscode/-UI.
export const metadata: Metadata = {
  title: "ZEBRA — YouTube Feed Reality Check (Debug)",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const CHANNEL_ID = "UCY18b48CEK53zTARqNiN0ig";
const FEED_URL = `https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`;

async function rawFetchDiagnostic(): Promise<
  | { ok: true; status: number; contentType: string | null; length: number; text: string }
  | { ok: false; error: string }
> {
  try {
    const res = await fetch(FEED_URL, {
      redirect: "follow",
      cache: "no-store",
      headers: { "User-Agent": "Mozilla/5.0 (compatible; ZebraYoutubeProbe/0.1; debug-only)" },
    });
    const text = await res.text();
    return {
      ok: true,
      status: res.status,
      contentType: res.headers.get("content-type"),
      length: text.length,
      text,
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unbekannter Fehler" };
  }
}

function detectRootType(text: string): string {
  const head = text.slice(0, 300).trim();
  if (/<feed[\s>]/i.test(head)) return "Atom (<feed>)";
  if (/<rss[\s>]/i.test(head)) return "RSS (<rss>)";
  if (head.startsWith("<?xml")) return "XML-Deklaration erkannt, aber kein <feed>/<rss> im Kopf";
  if (head.startsWith("<!DOCTYPE html") || head.startsWith("<html")) return "HTML (vermutlich Fehler-/Consent-Seite, kein Feed)";
  return "Unbekannt";
}

export default async function YoutubeFeedDebugPage() {
  const raw = await rawFetchDiagnostic();
  const parserItems = await fetchYoutubeNews();
  const aggregated = await getAggregatedNews();
  const aggregatedVideoCount = aggregated.filter((i) => i.sourceType === "video").length;

  return (
    <div style={{ background: "#0B0E13", color: "#F4F6FA", minHeight: "100vh", padding: 24, fontFamily: "monospace" }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>ZEBRA — YouTube Feed Reality Check</h1>
      <p style={{ fontSize: 13, color: "#888", marginBottom: 24 }}>
        Temporäre Debug-Route. Trennt Fetch/XML/Parser/Aggregator, um zu zeigen, auf welcher Ebene die
        ZebraTV-Items verloren gehen.
      </p>

      <section style={{ marginBottom: 24, borderBottom: "1px solid #333", paddingBottom: 16 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>A) FETCH</h2>
        <div style={{ fontSize: 12 }}>
          <div>Feed-URL: {FEED_URL}</div>
          {!raw.ok ? (
            <div style={{ color: "#FF3B4E" }}>Fetch-Fehler: {raw.error}</div>
          ) : (
            <>
              <div>HTTP Status: {raw.status}</div>
              <div>Content-Type: {raw.contentType ?? "(keiner)"}</div>
              <div>Response-Länge: {raw.length.toLocaleString("de-DE")} Zeichen</div>
            </>
          )}
        </div>
      </section>

      <section style={{ marginBottom: 24, borderBottom: "1px solid #333", paddingBottom: 16 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>B) XML</h2>
        {!raw.ok ? (
          <p style={{ fontSize: 12, color: "#888" }}>Kein Text verfügbar (Fetch fehlgeschlagen).</p>
        ) : (
          <div style={{ fontSize: 12 }}>
            <div>Erkannter Root-/Feed-Typ: {detectRootType(raw.text)}</div>
            <div>Anzahl gefundener &lt;entry&gt;-Elemente: {splitBlocks(raw.text, "entry").length}</div>
            <div style={{ marginTop: 6, color: "#8B93A3" }}>
              Erste 300 Zeichen der Rohantwort (nur zur Struktur-Diagnose, kein voller Dump):
            </div>
            <div style={{ marginTop: 4, wordBreak: "break-all", color: "#8B93A3" }}>
              {raw.text.slice(0, 300)}
            </div>
          </div>
        )}
      </section>

      <section style={{ marginBottom: 24, borderBottom: "1px solid #333", paddingBottom: 16 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>
          C) PARSER — echte fetchYoutubeNews() (Produktionsfunktion, unverändert)
        </h2>
        <p style={{ fontSize: 13, marginBottom: 8 }}>{parserItems.length} Items erzeugt.</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {parserItems.slice(0, 5).map((item, i) => (
            <div key={i} style={{ border: "1px solid #2a2a2a", padding: 6, fontSize: 12 }}>
              <div>title: {item.title}</div>
              <div>publishedAt: {item.publishedAt || "(leer)"}</div>
              <div>url: {item.url}</div>
              <div>imageUrl: {item.imageUrl ?? "(keines)"}</div>
              <div>source: {item.source}</div>
              <div>sourceType: {item.sourceType}</div>
            </div>
          ))}
          {parserItems.length === 0 && <p style={{ fontSize: 12, color: "#888" }}>Keine Items.</p>}
        </div>
      </section>

      <section>
        <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>
          D) AGGREGATOR — echte getAggregatedNews() (Produktionsfunktion, unverändert)
        </h2>
        <div style={{ fontSize: 13 }}>
          <div>Gesamtzahl Items: {aggregated.length}</div>
          <div>Davon sourceType === "video": {aggregatedVideoCount}</div>
        </div>
      </section>
    </div>
  );
}
