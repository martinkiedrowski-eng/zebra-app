import { Match } from "@/types/match";
import { MSV_TEAM_ID } from "@/lib/constants";
import { IS_MOCK_MODE } from "@/providers/registry";
import { fetchCupSeasonMatches } from "@/providers/football/openligadb/cupClient";
import { mapOldbMatch } from "@/providers/football/openligadb/mapMatch";

export interface CupMsvMatches {
  upcoming: Match[];
  results: Match[];
}

const EMPTY: CupMsvMatches = { upcoming: [], results: [] };

/**
 * Nur für /spiele — keine andere Seite importiert dies. Nutzt
 * ausschließlich den isolierten cupClient.ts (nicht client.ts) und den
 * bereits bestehenden, kompetitionsunabhängigen mapOldbMatch(). Kein
 * neues Mapping, keine Berührung von tableEngine/leagueContext/
 * multiplex — diese Datei kennt sie nicht einmal.
 *
 * Im Mock-Modus bewusst keine echten Netzwerkaufrufe: liefert leer statt
 * erfundener Pokal-Mock-Daten (die es aktuell nicht gibt) oder eines
 * versehentlichen Live-Fetches aus der Demo-Sandbox heraus.
 */
export async function getCupMsvMatches(upcomingCount: number, resultsCount: number): Promise<CupMsvMatches> {
  if (IS_MOCK_MODE) return EMPTY;

  let raw: unknown[];
  try {
    raw = await fetchCupSeasonMatches();
  } catch {
    return EMPTY; // Ein Pokal-Fehler darf /spiele nie zum Absturz bringen.
  }

  const matches = raw.map(mapOldbMatch).filter((m) => m.homeTeam.id === MSV_TEAM_ID || m.awayTeam.id === MSV_TEAM_ID);
  const now = Date.now();

  const upcoming = matches
    .filter((m) => m.status === "scheduled" && new Date(m.kickoff).getTime() > now)
    .sort((a, b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime())
    .slice(0, upcomingCount);

  const results = matches
    .filter((m) => m.status === "finished")
    .sort((a, b) => new Date(b.kickoff).getTime() - new Date(a.kickoff).getTime())
    .slice(0, resultsCount);

  return { upcoming, results };
}
