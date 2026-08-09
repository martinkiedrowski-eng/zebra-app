import { Match, MatchEvent, TeamRef } from "@/types/match";
import { OldbMatch, RESULT_TYPE_HALFTIME, RESULT_TYPE_FINAL } from "@/types/openligadb";
import { normalizeTeamId } from "./teamIdMap";
import { deriveMatchStatus } from "./mapStatus";
import { MSV_TEAM_ID } from "@/lib/constants";

function toTeamRef(team: OldbMatch["Team1"]): TeamRef {
  return {
    id: normalizeTeamId(team),
    name: team.TeamName,
    shortName: team.ShortName || team.TeamName,
    crestUrl: team.TeamIconUrl ?? undefined,
  };
}

function currentScore(match: OldbMatch): { home: number | null; away: number | null } {
  const final = match.MatchResults.find((r) => r.ResultTypeID === RESULT_TYPE_FINAL);
  if (final) return { home: final.PointsTeam1, away: final.PointsTeam2 };

  if (match.Goals.length > 0) {
    const last = match.Goals[match.Goals.length - 1];
    return { home: last.ScoreTeam1, away: last.ScoreTeam2 };
  }

  const halftime = match.MatchResults.find((r) => r.ResultTypeID === RESULT_TYPE_HALFTIME);
  if (halftime) return { home: halftime.PointsTeam1, away: halftime.PointsTeam2 };

  return { home: null, away: null };
}

function halftimeScore(match: OldbMatch): { home: number; away: number } | null {
  const halftime = match.MatchResults.find((r) => r.ResultTypeID === RESULT_TYPE_HALFTIME);
  return halftime ? { home: halftime.PointsTeam1, away: halftime.PointsTeam2 } : null;
}

/**
 * Tore -> interne MatchEvents. Die Mannschaft eines Tors wird aus der
 * Differenz zum vorherigen kumulierten Spielstand abgeleitet (OpenLigaDB
 * liefert pro Tor den Spielstand NACH dem Tor, kein explizites Team-Flag).
 * Keine Karten/Wechsel — die liefert OpenLigaDB nicht, also werden auch
 * keine erzeugt.
 */
function toEvents(match: OldbMatch): MatchEvent[] {
  let prevHome = 0;
  let prevAway = 0;

  return match.Goals.map((goal, i) => {
    const team: "home" | "away" = goal.ScoreTeam1 > prevHome ? "home" : "away";
    prevHome = goal.ScoreTeam1;
    prevAway = goal.ScoreTeam2;

    return {
      id: `olb-goal-${match.MatchID}-${goal.GoalID ?? i}`,
      matchId: String(match.MatchID),
      minute: goal.MatchMinute ?? 0,
      type: "goal",
      team,
      player: goal.GoalGetterName ?? "Unbekannt",
      detail: `${goal.ScoreTeam1}:${goal.ScoreTeam2}${goal.IsPenalty ? " (Elfmeter)" : ""}${
        goal.IsOwnGoal ? " (Eigentor)" : ""
      }`,
    } satisfies MatchEvent;
  });
}

export function mapOldbMatch(match: OldbMatch): Match {
  const homeTeam = toTeamRef(match.Team1);
  const awayTeam = toTeamRef(match.Team2);
  const status = deriveMatchStatus(match);
  const score = currentScore(match);

  return {
    id: String(match.MatchID),
    competition: match.LeagueName,
    matchday: match.Group?.GroupOrderID ?? 0,
    kickoff: match.MatchDateTime,
    venue: match.Location?.LocationStadium ?? "",
    homeTeam,
    awayTeam,
    homeScore: score.home,
    awayScore: score.away,
    halftimeScore: halftimeScore(match),
    status,
    // Bewusst KEINE Minute — OpenLigaDB liefert keine verlässliche aktuelle
    // Spielminute. Wir täuschen keine Pseudo-Präzision vor (siehe Punkt 7).
    minute: null,
    events: toEvents(match),
    isMsvMatch: homeTeam.id === MSV_TEAM_ID || awayTeam.id === MSV_TEAM_ID,
    // stats/lineup bewusst nicht gesetzt (undefined) — OpenLigaDB liefert
    // beides nicht. Die UI blendet die entsprechenden Bereiche dadurch
    // automatisch aus.
  };
}
