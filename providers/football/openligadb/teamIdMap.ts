import { MSV_TEAM_ID } from "@/lib/constants";

/**
 * OpenLigaDB-TeamIds sind numerisch und provider-spezifisch. Nur der MSV
 * bekommt intern die feste, providerunabhängige MSV_TEAM_ID — alle anderen
 * Teams bekommen eine stabile, provider-namespacte ID ("olb-<id>"). So
 * bleibt ein Wechsel des Football-Providers folgenlos für UI-Links und
 * Business-Regeln.
 *
 * WICHTIG (ehrlich dokumentierter Kompromiss): Die exakte numerische
 * OpenLigaDB-TeamId für den MSV konnte in dieser Umgebung nicht live
 * verifiziert werden (kein Netzwerkzugriff aus der Entwicklungssandbox
 * heraus, siehe Reality-Check- und Debug-Dokument). Eine geratene Zahl
 * hier fest zu verdrahten wäre genau die Art von "erfundener
 * Daten-Faktenlage", die ausdrücklich vermieden werden soll. Stattdessen
 * wird der MSV robust über den Vereinsnamen erkannt.
 *
 * Nimmt bewusst nur primitive Strings entgegen (keinen typisierten
 * OldbTeam mehr) — die gesamte Mapping-Schicht arbeitet seit dem
 * Production-Debug defensiv auf `unknown`, siehe safe.ts/mapMatch.ts.
 */
const MSV_NAME_PATTERN = /msv\s*duisburg|^msv$/i;

function isMsvTeam(name: string, shortName: string): boolean {
  return MSV_NAME_PATTERN.test(name) || MSV_NAME_PATTERN.test(shortName);
}

export function normalizeTeamIdRaw(
  rawTeamId: number,
  teamName: string,
  shortName: string
): { teamId: string; isMsv: boolean } {
  const isMsv = isMsvTeam(teamName, shortName);
  return { teamId: isMsv ? MSV_TEAM_ID : `olb-${rawTeamId}`, isMsv };
}
