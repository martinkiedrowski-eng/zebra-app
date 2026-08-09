import { MSV_TEAM_ID } from "@/lib/constants";
import { OldbTeam } from "@/types/openligadb";

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
 * heraus, siehe Reality-Check-Dokument). Eine geratene Zahl hier fest zu
 * verdrahten wäre genau die Art von "erfundener Daten-Faktenlage", die
 * ausdrücklich vermieden werden soll. Stattdessen wird der MSV robust über
 * den Vereinsnamen erkannt — das funktioniert unabhängig von der
 * tatsächlichen numerischen ID und lässt sich jederzeit gegen
 * `getavailableteams/bl3/<season>` verifizieren, sobald echter
 * Netzwerkzugriff besteht. Danach kann optional zusätzlich/stattdessen auf
 * eine feste ID umgestellt werden.
 */
const MSV_NAME_PATTERN = /msv\s*duisburg|^msv$/i;

function isMsvTeam(team: Pick<OldbTeam, "TeamName" | "ShortName">): boolean {
  return MSV_NAME_PATTERN.test(team.TeamName) || (!!team.ShortName && MSV_NAME_PATTERN.test(team.ShortName));
}

export function normalizeTeamId(team: Pick<OldbTeam, "TeamId" | "TeamName" | "ShortName">): string {
  return isMsvTeam(team) ? MSV_TEAM_ID : `olb-${team.TeamId}`;
}

export function isMsvOldbTeam(team: Pick<OldbTeam, "TeamName" | "ShortName">): boolean {
  return isMsvTeam(team);
}
