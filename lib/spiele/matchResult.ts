import { Match } from "@/types/match";
import { MSV_TEAM_ID } from "@/lib/constants";

export type MsvResultLabel = "S" | "U" | "N";

/**
 * Leitet aus einem abgeschlossenen Match das Ergebnis aus MSV-Sicht ab.
 * `null`, wenn kein vollständiges Ergebnis vorliegt (z.B. Score fehlt) —
 * dann zeigt die UI bewusst nichts an, statt zu raten.
 */
export function computeMsvResultLabel(match: Match): MsvResultLabel | null {
  if (match.homeScore === null || match.awayScore === null) return null;

  const isHome = match.homeTeam.id === MSV_TEAM_ID;
  const own = isHome ? match.homeScore : match.awayScore;
  const opp = isHome ? match.awayScore : match.homeScore;

  if (own > opp) return "S";
  if (own < opp) return "N";
  return "U";
}
