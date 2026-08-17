import { NewsFeedItem } from "@/types/newsFeed";
import { fetchMsvNews } from "./sources/msv";
import { fetchYoutubeNews } from "./sources/youtube";
import { fetchLiga3News } from "./sources/liga3";
import { fetchSportschauNews } from "./sources/sportschau";
import { parseGermanDateOnly } from "./format";

/**
 * Führt alle vier Quellen zusammen. Jede Quelle läuft unabhängig über
 * Promise.allSettled — eine ausgefallene Quelle liefert einfach keine
 * Items, die anderen beiden erscheinen trotzdem. Es gibt bewusst keinen
 * Pfad, auf dem ein Fehler einer Quelle den gesamten Aggregator zum
 * Absturz bringt (jeder Adapter fängt seine eigenen Fehler bereits ab
 * und gibt im Zweifel `[]` zurück — Promise.allSettled ist hier die
 * zweite Sicherheitsebene, nicht die einzige).
 */
export async function getAggregatedNews(): Promise<NewsFeedItem[]> {
  const results = await Promise.allSettled([
    fetchMsvNews(),
    fetchYoutubeNews(),
    fetchLiga3News(),
    fetchSportschauNews(),
  ]);

  const items: NewsFeedItem[] = [];
  for (const result of results) {
    if (result.status === "fulfilled") {
      items.push(...result.value);
    }
    // result.status === "rejected": diese Quelle liefert für diesen
    // Aufruf nichts. Keine Fehlermeldung im Produkt — technische Details
    // gehören ausschließlich in /debug/content-sources.
  }

  const deduped = deduplicate(items);
  deduped.sort((a, b) => toTimestamp(b.publishedAt) - toTimestamp(a.publishedAt));
  return deduped;
}

/**
 * Konservativ: nur EXAKT identische URL oder EXAKT identischer
 * normalisierter Titel gelten als Duplikat. Nur ähnliche Titel werden
 * bewusst NICHT zusammengeführt — lieber zwei ähnliche Meldungen zeigen
 * als versehentlich unterschiedliche Artikel entfernen.
 */
function deduplicate(items: NewsFeedItem[]): NewsFeedItem[] {
  const seenUrls = new Set<string>();
  const seenTitles = new Set<string>();
  const result: NewsFeedItem[] = [];

  for (const item of items) {
    const urlKey = item.url.trim();
    const titleKey = normalizeTitle(item.title);
    if (seenUrls.has(urlKey) || (titleKey && seenTitles.has(titleKey))) continue;
    seenUrls.add(urlKey);
    if (titleKey) seenTitles.add(titleKey);
    result.push(item);
  }

  return result;
}

function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[„“"'’.,!?:;–—-]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Robuste Zeitstempel-Ableitung für die Sortierung — nie erfundene Werte,
 * nur geparst.
 *
 * Derselbe Root-Cause-Bug wie in lib/newsFeed/format.ts (siehe dortiger
 * Kommentar): `Date.parse("11.08.2026")` liefert in der echten
 * Laufzeitumgebung KEIN NaN, sondern einen falsch interpretierten, nah-
 * aktuellen Wert. Das eindeutige DD.MM.YYYY-Muster wird deshalb jetzt
 * IMMER zuerst über den gemeinsamen, deterministischen Parser behandelt
 * (parseGermanDateOnly aus format.ts) — der generische Date.parse()-Pfad
 * kommt für dieses Format gar nicht mehr zum Zug. Dadurch kann ein
 * DD.MM.YYYY-Artikel nicht mehr fälschlich wie gerade veröffentlicht
 * einsortiert werden.
 */
function toTimestamp(value: string): number {
  if (!value) return 0;

  const dateOnlyMs = parseGermanDateOnly(value);
  if (dateOnlyMs !== null) return dateOnlyMs;

  const iso = Date.parse(value);
  return Number.isNaN(iso) ? 0 : iso;
}
