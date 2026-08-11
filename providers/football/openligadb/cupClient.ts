import { FOOTBALL_CONFIG, DFB_POKAL_CONFIG } from "@/config/football";
import { warnUnexpectedShape } from "./safe";

/**
 * Bewusst NICHT client.ts wiederverwendet: client.ts ist strukturell an
 * FOOTBALL_CONFIG (3. Liga) gebunden (jede Funktion liest
 * leagueShortcut/season von dort) und wird von tableEngine-relevanten
 * Methoden (getBaselineTable, getCurrentMatchday, getTable) verwendet.
 * Eine gemeinsame Funktion hätte bedeutet, entweder client.ts anzufassen
 * (Liga-Pipeline berühren) oder Liga-Parameter durchzureichen (Risiko,
 * versehentlich Pokal-Daten in einen Liga-Aufruf zu mischen). Eine
 * separate, kleine, komplett eigenständige Funktion mit eigenem Cache ist
 * hier die sicherere Wahl — "harte Trennung" wird dadurch strukturell
 * erzwungen, nicht nur durch Konvention.
 */

interface CupCacheEntry {
  data: unknown[];
  fetchedAt: number;
}

const cupCache = new Map<string, CupCacheEntry>();
const CUP_CACHE_MS = 5 * 60 * 1000; // Pokalspiele sind selten, 5 Minuten reichen bei Weitem.

export async function fetchCupSeasonMatches(): Promise<unknown[]> {
  const { leagueShortcut, season } = DFB_POKAL_CONFIG;
  const key = `${leagueShortcut}/${season}`;
  const cached = cupCache.get(key);

  if (cached && Date.now() - cached.fetchedAt < CUP_CACHE_MS) {
    return cached.data;
  }

  const res = await fetch(`${FOOTBALL_CONFIG.baseUrl}/getmatchdata/${leagueShortcut}/${season}`, {
    cache: "no-store",
    headers: { "User-Agent": "Mozilla/5.0 (compatible; ZebraCupProvider/0.1)" },
  });
  if (!res.ok) {
    throw new Error(`OpenLigaDB (DFB-Pokal) antwortete mit Status ${res.status}`);
  }

  const raw = await res.json();
  const data = Array.isArray(raw) ? raw : [];
  if (!Array.isArray(raw)) warnUnexpectedShape("dfb-pokal-getmatchdata-response", raw);

  cupCache.set(key, { data, fetchedAt: Date.now() });
  return data;
}
