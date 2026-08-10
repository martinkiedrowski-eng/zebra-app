import { NewsFeedItem } from "@/types/newsFeed";
import { fetchWithTimeout } from "../fetchUtils";
import { parseMsvNewsList } from "../parsers/msvParser";

const NEWS_URL = "https://www.msv-duisburg.de/aktuelles/newsuebersicht/";

/**
 * Nutzt die live validierte Parser-Logik unverändert. Ein Fehler hier
 * (Netzwerk, Struktur-Änderung) führt zu einer leeren Liste, nie zu einer
 * Exception — der Aggregator behandelt das als "diese Quelle liefert
 * gerade nichts", nicht als Totalausfall des News Hub.
 */
export async function fetchMsvNews(): Promise<NewsFeedItem[]> {
  const res = await fetchWithTimeout(NEWS_URL);
  if (!res) return [];

  let parsed;
  try {
    parsed = parseMsvNewsList(res.text, res.finalUrl);
  } catch {
    return [];
  }
  if (!parsed.containerFound) return [];

  return parsed.articles.map(
    (a): NewsFeedItem => ({
      id: `msv:${a.url}`,
      title: a.title,
      url: a.url,
      publishedAt: a.publishedAt ?? "",
      source: "MSV Duisburg",
      sourceType: "official",
      category: a.category,
      teaser: null,
      // Live bestätigt: aktuell keine verwertbare Bild-URL im DOM.
      // Bleibt bewusst null statt etwas zu konstruieren — siehe
      // findRealImageUrl() im Parser.
      imageUrl: a.image,
    })
  );
}
