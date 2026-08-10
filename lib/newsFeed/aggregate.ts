import { NewsFeedItem } from "@/types/newsFeed";
import { fetchMsvNews } from "./sources/msv";
import { fetchYoutubeNews } from "./sources/youtube";
import { fetchLiga3News } from "./sources/liga3";

/**
 * Führt alle drei Quellen zusammen. Jede Quelle läuft unabhängig über
 * Promise.allSettled — eine ausgefallene Quelle liefert einfach keine
 * Items, die anderen beiden erscheinen trotzdem. Es gibt bewusst keinen
 * Pfad, auf dem ein Fehler einer Quelle den gesamten Aggregator zum
 * Absturz bringt (jeder Adapter fängt seine eigenen Fehler bereits ab
 * und gibt im Zweifel `[]` zurück — Promise.allSettled ist hier die
 * zweite Sicherheitsebene, nicht die einzige).
 */
export async function getAggregatedNews(): Promise<NewsFeedItem[]> {
  const results = await Promise.allSettled([fetchMsvNews(), fetchYoutubeNews(), fetchLiga3News()]);

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

/** Robuste Zeitstempel-Ableitung für die Sortierung — nie erfundene Werte, nur geparst. */
function toTimestamp(value: string): number {
  if (!value) return 0;

  const iso = Date.parse(value);
  if (!Number.isNaN(iso)) return iso;

  // Fallback: "DD.MM.YYYY" (msv-duisburg.de-Textmuster ohne datetime-Attribut)
  const match = value.match(/^(\d{2})\.(\d{2})\.(\d{4})/);
  if (match) {
    const dd = match[1];
    const mm = match[2];
    const yyyy = match[3];
    if (dd && mm && yyyy) {
      const parsed = Date.parse(`${yyyy}-${mm}-${dd}T00:00:00`);
      if (!Number.isNaN(parsed)) return parsed;
    }
  }

  return 0;
}
