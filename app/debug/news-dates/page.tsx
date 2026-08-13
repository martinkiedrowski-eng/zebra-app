import { Metadata } from "next";
import * as cheerio from "cheerio";
import { formatNewsTime } from "@/lib/newsFeed/format";

// Temporäre, isolierte Debug-Route für den News-Timestamp-Bugfix. Nutzt
// eine EIGENE, rein diagnostische DOM-Auswertung (dupliziert absichtlich
// einen kleinen Teil der Struktur-Logik) statt den produktiven Parser
// (lib/newsFeed/parsers/msvParser.ts) zu erweitern — der bleibt dadurch
// exakt unverändert und bleibt die einzige Wahrheit für die echte
// Produktions-Extraktion. Dieser Probe zeigt zusätzlich die ROHEN
// Zwischenwerte (datetime-Attribut, sichtbarer <time>-Text,
// DD.MM.YYYY-Texttreffer einzeln), die der Parser selbst nicht mehr nach
// außen gibt, da er nur das fertige publishedAt zurückliefert.
export const metadata: Metadata = {
  title: "ZEBRA — News Dates Reality Check (Debug)",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const NEWS_URL = "https://www.msv-duisburg.de/aktuelles/newsuebersicht/";

interface DiagnosticRow {
  title: string;
  category: string | null;
  rawDatetimeAttr: string | null;
  rawTimeText: string | null;
  rawDateTextMatch: string | null;
  computedPublishedAt: string | null;
  formatted: string;
}

function collapseWhitespace(value: string | null | undefined): string {
  if (!value) return "";
  return value.replace(/\s+/g, " ").trim();
}

function splitCategoryAndTitle(rawText: string): { category: string | null; headline: string } {
  const text = collapseWhitespace(rawText);
  const idx = text.indexOf("|");
  if (idx === -1) return { category: null, headline: text };
  const category = text.slice(0, idx).trim();
  const headline = text.slice(idx + 1).trim();
  if (!category || !headline) return { category: null, headline: text };
  return { category, headline };
}

export default async function NewsDatesDebugPage() {
  let fetchError: string | null = null;
  const rows: DiagnosticRow[] = [];

  try {
    const res = await fetch(NEWS_URL, {
      cache: "no-store",
      headers: { "User-Agent": "Mozilla/5.0 (compatible; ZebraNewsDatesProbe/0.1; debug-only)" },
    });
    if (!res.ok) {
      fetchError = `HTTP ${res.status}`;
    } else {
      const html = await res.text();
      const $ = cheerio.load(html);
      const list = $("ul.news-list");
      const items = list.length > 0 ? list.find("li") : $();

      items.each((_i: number, el: any) => {
        const $item = $(el);
        const $link = $item.find('a[href*="/aktuelles/artikel/"]').first();
        if ($link.length === 0) return;

        const rawTitleSource = $link.attr("title") || $link.text() || $item.find("h2, h3, h4").first().text();
        const { category, headline } = splitCategoryAndTitle(
          collapseWhitespace(rawTitleSource).replace(/^\d{2}\.\d{2}\.\d{4}\s*/, "")
        );

        const $time = $item.find("time").first();
        const rawDatetimeAttr = $time.attr("datetime") ?? null;
        const rawTimeText = collapseWhitespace($time.text()) || null;
        const dateTextMatch = $item.text().match(/\b\d{2}\.\d{2}\.\d{4}\b/);
        const rawDateTextMatch = dateTextMatch?.[0] ?? null;

        const computedPublishedAt = rawDatetimeAttr || rawTimeText || rawDateTextMatch || null;

        rows.push({
          title: headline || "(kein Titel erkannt)",
          category,
          rawDatetimeAttr,
          rawTimeText,
          rawDateTextMatch,
          computedPublishedAt,
          formatted: formatNewsTime(computedPublishedAt ?? ""),
        });
      });
    }
  } catch (err) {
    fetchError = err instanceof Error ? err.message : "Unbekannter Fehler";
  }

  const hashtagRows = rows.filter((r) => r.category?.startsWith("#"));
  const normalRows = rows.filter((r) => !r.category?.startsWith("#"));

  return (
    <div style={{ background: "#0B0E13", color: "#F4F6FA", minHeight: "100vh", padding: 24, fontFamily: "monospace" }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>ZEBRA — News Dates Reality Check</h1>
      <p style={{ fontSize: 13, color: "#888", marginBottom: 24 }}>
        Temporäre Debug-Route. Zeigt für jeden MSV-Artikel die rohen Datumssignale getrennt neben dem
        normalisierten publishedAt und dem tatsächlichen formatNewsTime()-Ergebnis.
      </p>

      {fetchError ? (
        <p style={{ color: "#FF3B4E", fontSize: 13 }}>Fehler: {fetchError}</p>
      ) : (
        <>
          <section style={{ marginBottom: 28, borderBottom: "1px solid #333", paddingBottom: 20 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>
              A) Hashtag-Kategorie-Items ({hashtagRows.length}) — insbesondere #fcwmsv / #msvvereint
            </h2>
            {hashtagRows.length === 0 ? (
              <p style={{ fontSize: 12, color: "#888" }}>Keine Items mit "#"-Kategorie-Präfix gefunden.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {hashtagRows.map((r, i) => (
                  <RowCard key={i} row={r} />
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>
              B) Normale Items zum Vergleich ({normalRows.length}, erste 5 gezeigt)
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {normalRows.slice(0, 5).map((r, i) => (
                <RowCard key={i} row={r} />
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function RowCard({ row }: { row: DiagnosticRow }) {
  return (
    <div style={{ border: "1px solid #2a2a2a", padding: 8, fontSize: 12 }}>
      <div>
        <strong>Titel:</strong> {row.title}
      </div>
      <div>
        <strong>Kategorie:</strong> {row.category ?? "–"}
      </div>
      <div style={{ marginTop: 4, color: "#8B93A3" }}>Rohe Signale (unabhängig voneinander):</div>
      <div>
        <strong>&lt;time datetime&gt;:</strong> {row.rawDatetimeAttr ?? "(nicht vorhanden)"}
      </div>
      <div>
        <strong>sichtbarer &lt;time&gt;-Text:</strong> {row.rawTimeText ?? "(nicht vorhanden)"}
      </div>
      <div>
        <strong>DD.MM.YYYY-Texttreffer im Item:</strong> {row.rawDateTextMatch ?? "(nicht gefunden)"}
      </div>
      <div style={{ marginTop: 4 }}>
        <strong>→ computed publishedAt:</strong> {row.computedPublishedAt ?? "null"}
      </div>
      <div>
        <strong>→ formatNewsTime():</strong> {row.formatted || "(leer — kein Zeitstempel)"}
      </div>
    </div>
  );
}
