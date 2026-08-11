/**
 * Solange der OpenLigaDB-Einzel-Match-Endpunkt (`getmatchdata/{matchId}`)
 * nicht live verifiziert ist, verlinken wir nur dann ins Match Center,
 * wenn die ID wie eine echte, numerische OpenLigaDB-MatchID aussieht.
 * Synthetische Ersatz-IDs (z.B. "olb-12-olb-34-2026-08-16T...", gebaut aus
 * Team-IDs + Kickoff, siehe mapMatch.ts-Fallback) fallen damit sauber
 * heraus, statt zu einer Fehlerseite zu führen.
 *
 * Im Mock-Modus ignoriert getMatchById() die übergebene ID ohnehin und
 * löst immer auf — dort ist jede ID unbedenklich "vertrauenswürdig".
 */
export function hasReliableMatchId(matchId: string, isMockMode: boolean): boolean {
  if (isMockMode) return true;
  return /^\d+$/.test(matchId);
}
