import { FOOTBALL_CONFIG, POLLING_CONFIG } from "@/config/football";
import { isRawObject, pickNumber, warnUnexpectedShape } from "./safe";

/**
 * Alles, was tatsächlich HTTP gegen OpenLigaDB spricht, lebt hier — und
 * nirgendwo sonst. Route Handler, Provider-Klasse und UI wissen nichts von
 * fetch(), Endpunkten oder Response-Shapes.
 *
 * WICHTIG: Alle Fetch-Funktionen liefern bewusst `unknown`/`unknown[]`
 * zurück, nicht die (unverifizierten) OldbMatch/OldbTableEntry-Typen. Die
 * Mapping-Schicht (mapMatch.ts, mapTable.ts) greift ausschließlich über
 * safe.ts (pickString/pickNumber/...) defensiv auf die Felder zu, statt
 * blind einer möglicherweise falschen Feldbenennung zu vertrauen — genau
 * dieses blinde Vertrauen war die wahrscheinliche Ursache für leere
 * Teamnamen/NaN im ersten Production-Deploy.
 *
 * Caching-Strategie:
 * 1. Zuerst getlastchangedate abfragen (billig).
 * 2. Nur wenn sich der Zeitstempel gegenüber dem letzten bekannten Stand
 *    geändert hat, die eigentlichen Matchdaten neu laden.
 * 3. Zwischen zwei Prüfungen liegt mindestens POLLING_CONFIG.idleMs bzw.
 *    .liveMs, je nachdem ob der zuletzt bekannte Stand ein laufendes
 *    Spiel enthielt.
 *
 * Hinweis: Der In-Memory-Cache lebt nur für die Lebensdauer des Node-
 * Prozesses. Auf klassischem Node-Hosting funktioniert das wie
 * beschrieben. Auf einer Serverless-Plattform mit vielen kurzlebigen
 * Funktionsinstanzen (z.B. Vercel Serverless Functions) ist der Cache
 * nicht prozessübergreifend garantiert — dort müsste der Cache in einen
 * externen Store (z.B. KV/Redis) wandern. Für die aktuelle Stufe ist der
 * In-Memory-Cache eine bewusste, dokumentierte Vereinfachung.
 */

interface CacheEntry<T> {
  data: T;
  lastChangeDate: string | null;
  fetchedAt: number;
}

const matchdayCache = new Map<string, CacheEntry<unknown[]>>();
const tableCache = new Map<string, CacheEntry<unknown[]>>();

function hasLiveMatch(matches: unknown[]): boolean {
  const now = Date.now();
  return matches.some((raw) => {
    if (!isRawObject(raw)) return false;
    const isFinished = raw["MatchIsFinished"] === true || raw["matchIsFinished"] === true;
    if (isFinished) return false;
    const kickoffRaw = raw["MatchDateTimeUTC"] ?? raw["MatchDateTime"] ?? raw["matchDateTime"];
    if (typeof kickoffRaw !== "string") return false;
    const kickoff = new Date(kickoffRaw).getTime();
    return Number.isFinite(kickoff) && kickoff <= now;
  });
}

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(`${FOOTBALL_CONFIG.baseUrl}${path}`, {
    // Next.js Fetch-Cache explizit deaktivieren — die eigene
    // getlastchangedate-Logik übernimmt die Cache-Entscheidung.
    cache: "no-store",
  });
  if (!res.ok) {
    throw new OpenLigaDbError(`OpenLigaDB antwortete mit Status ${res.status} für ${path}`);
  }
  return res.json() as Promise<T>;
}

export class OpenLigaDbError extends Error {}

async function getLastChangeDate(leagueShortcut: string, season: number, group?: number): Promise<string> {
  const path =
    group !== undefined
      ? `/getlastchangedate/${leagueShortcut}/${season}/${group}`
      : `/getlastchangedate/${leagueShortcut}/${season}`;
  return fetchJson<string>(path);
}

function cacheKey(leagueShortcut: string, season: number, group?: number): string {
  return `${leagueShortcut}/${season}/${group ?? "all"}`;
}

/**
 * Lädt die Spiele eines Spieltags (oder der ganzen Saison, wenn kein
 * `group` angegeben ist) — nutzt getlastchangedate, um unnötige Requests
 * zu vermeiden, und wählt die Poll-Frequenz danach, ob der zuletzt
 * bekannte Stand ein laufendes Spiel enthielt.
 */
export async function fetchMatchday(group?: number): Promise<unknown[]> {
  const { leagueShortcut, season } = FOOTBALL_CONFIG;
  const key = cacheKey(leagueShortcut, season, group);
  const cached = matchdayCache.get(key);

  if (cached) {
    const pollInterval = hasLiveMatch(cached.data) ? POLLING_CONFIG.liveMs : POLLING_CONFIG.idleMs;
    const isFresh = Date.now() - cached.fetchedAt < pollInterval;
    if (isFresh) return cached.data;

    try {
      const latestChange = await getLastChangeDate(leagueShortcut, season, group);
      if (latestChange === cached.lastChangeDate) {
        matchdayCache.set(key, { ...cached, fetchedAt: Date.now() });
        return cached.data;
      }
    } catch {
      // getlastchangedate fehlgeschlagen: konservativ neu laden statt zu blockieren.
    }
  }

  const path =
    group !== undefined
      ? `/getmatchdata/${leagueShortcut}/${season}/${group}`
      : `/getmatchdata/${leagueShortcut}/${season}`;
  const raw = await fetchJson<unknown>(path);
  const data = Array.isArray(raw) ? raw : [];
  if (!Array.isArray(raw)) warnUnexpectedShape("getmatchdata-response", raw);

  let lastChangeDate: string | null = null;
  try {
    lastChangeDate = await getLastChangeDate(leagueShortcut, season, group);
  } catch {
    // Nicht kritisch — Cache funktioniert dann nur zeitbasiert weiter.
  }
  matchdayCache.set(key, { data, lastChangeDate, fetchedAt: Date.now() });
  return data;
}

export async function fetchTable(): Promise<unknown[]> {
  const { leagueShortcut, season } = FOOTBALL_CONFIG;
  const key = cacheKey(leagueShortcut, season);
  const cached = tableCache.get(key);

  if (cached && Date.now() - cached.fetchedAt < POLLING_CONFIG.idleMs) {
    return cached.data;
  }

  const raw = await fetchJson<unknown>(`/getbltable/${leagueShortcut}/${season}`);
  const data = Array.isArray(raw) ? raw : [];
  if (!Array.isArray(raw)) warnUnexpectedShape("getbltable-response", raw);

  tableCache.set(key, { data, lastChangeDate: null, fetchedAt: Date.now() });
  return data;
}

export async function fetchCurrentGroupOrderId(): Promise<number> {
  const { leagueShortcut } = FOOTBALL_CONFIG;
  const raw = await fetchJson<unknown>(`/getcurrentgroup/${leagueShortcut}`);
  if (!isRawObject(raw)) {
    warnUnexpectedShape("getcurrentgroup-response", raw);
    return 1;
  }
  const orderId = pickNumber(raw, ["GroupOrderID", "groupOrderID", "GroupOrderId", "groupOrderId"], NaN);
  if (!Number.isFinite(orderId)) {
    warnUnexpectedShape("getcurrentgroup-response", raw);
    return 1;
  }
  return orderId;
}

/**
 * Lädt ein einzelnes Match über seine OpenLigaDB-MatchID.
 * HINWEIS: Dieser Endpunkt-Pfad basiert auf dem dokumentierten
 * `getmatchdata`-Namensschema, konnte in dieser Umgebung mangels
 * Netzwerkzugriff aber nicht live verifiziert werden. Vor dem ersten
 * echten Deploy bitte einmal manuell gegenprüfen.
 */
export async function fetchMatchById(matchId: string): Promise<unknown> {
  return fetchJson<unknown>(`/getmatchdata/${matchId}`);
}
