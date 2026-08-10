import { Match, MatchEvent, TeamRef } from "@/types/match";
import { MSV_TEAM_ID } from "@/lib/constants";
import { normalizeTeamIdRaw } from "./teamIdMap";
import { deriveMatchStatus } from "./mapStatus";
import {
  isRawObject,
  pickString,
  pickNumber,
  pickBoolean,
  pickArray,
  pickNullableString,
  warnUnexpectedShape,
} from "./safe";

export interface RawResult {
  resultTypeId: number;
  pointsTeam1: number;
  pointsTeam2: number;
}

interface RawGoal {
  id: string;
  scoreTeam1: number;
  scoreTeam2: number;
  minute: number | null;
  scorerName: string | null;
  isPenalty: boolean;
  isOwnGoal: boolean;
}

export interface RawMatchFields {
  matchId: string;
  kickoff: string;
  kickoffUtc: string;
  isFinished: boolean;
  leagueName: string;
  groupOrderId: number;
  locationStadium: string | null;
}

/**
 * Extrahiert ein Team-Objekt defensiv aus rohen Match-Daten (Team1/Team2).
 * Auch für die Baseline-Rekonstruktion (alle Teams einer Saison) verwendet
 * — siehe OpenLigaDbFootballProvider.teamRefsFromMatches.
 */
export function extractTeam(raw: unknown, fallbackLabel: string): TeamRef {
  if (!isRawObject(raw)) {
    warnUnexpectedShape("match-team", raw);
    return { id: `olb-unknown-${fallbackLabel}`, name: "Unbekanntes Team", shortName: "—" };
  }
  const name = pickString(raw, ["TeamName", "teamName", "Name", "name"]);
  const shortName = pickString(raw, ["ShortName", "shortName", "TeamNameShort"]);
  const rawId = pickNumber(raw, ["TeamId", "teamId", "Id", "id"], NaN);

  if (!name) warnUnexpectedShape("match-team", raw);

  const { teamId } = normalizeTeamIdRaw(Number.isFinite(rawId) ? rawId : 0, name, shortName);
  const iconUrl = pickNullableString(raw, ["TeamIconUrl", "teamIconUrl", "IconUrl"]);

  return {
    id: teamId,
    name: name || `Team ${fallbackLabel}`,
    shortName: shortName || name || `Team ${fallbackLabel}`,
    crestUrl: iconUrl ?? undefined,
  };
}

function extractResults(raw: Record<string, unknown>): RawResult[] {
  const arr = pickArray(raw, ["MatchResults", "matchResults", "Results", "results"]);
  return arr.filter(isRawObject).map((r) => ({
    resultTypeId: pickNumber(r, ["ResultTypeID", "resultTypeID", "ResultTypeId", "resultTypeId"], -1),
    pointsTeam1: pickNumber(r, ["PointsTeam1", "pointsTeam1"]),
    pointsTeam2: pickNumber(r, ["PointsTeam2", "pointsTeam2"]),
  }));
}

function extractGoals(raw: Record<string, unknown>, matchId: string): RawGoal[] {
  const arr = pickArray(raw, ["Goals", "goals"]);
  return arr.filter(isRawObject).map((g, i) => {
    const minute = pickNumber(g, ["MatchMinute", "matchMinute"], NaN);
    return {
      id: pickString(g, ["GoalID", "goalID", "GoalId", "goalId"], `${matchId}-goal-${i}`),
      scoreTeam1: pickNumber(g, ["ScoreTeam1", "scoreTeam1"]),
      scoreTeam2: pickNumber(g, ["ScoreTeam2", "scoreTeam2"]),
      minute: Number.isFinite(minute) ? minute : null,
      scorerName: pickNullableString(g, ["GoalGetterName", "goalGetterName"]),
      isPenalty: pickBoolean(g, ["IsPenalty", "isPenalty"]),
      isOwnGoal: pickBoolean(g, ["IsOwnGoal", "isOwnGoal"]),
    };
  });
}

function extractMatchFields(raw: Record<string, unknown>): RawMatchFields {
  const matchId = pickString(raw, ["MatchID", "matchID", "MatchId", "matchId"]);
  const kickoff = pickString(raw, ["MatchDateTime", "matchDateTime"]);
  const kickoffUtc = pickString(raw, ["MatchDateTimeUTC", "matchDateTimeUTC"], kickoff);
  const isFinished = pickBoolean(raw, ["MatchIsFinished", "matchIsFinished"]);
  const leagueName = pickString(raw, ["LeagueName", "leagueName"], "3. Liga");

  const groupObj = raw["Group"] ?? raw["group"];
  const groupOrderId = isRawObject(groupObj)
    ? pickNumber(groupObj, ["GroupOrderID", "groupOrderID", "GroupOrderId", "groupOrderId"], 0)
    : 0;

  const locationObj = raw["Location"] ?? raw["location"];
  const locationStadium = isRawObject(locationObj)
    ? pickNullableString(locationObj, ["LocationStadium", "locationStadium"])
    : null;

  return { matchId, kickoff, kickoffUtc, isFinished, leagueName, groupOrderId, locationStadium };
}

/**
 * Aktueller Spielstand: Endergebnis, sonst letzter bekannter Torstand,
 * sonst Halbzeitergebnis, sonst kein Ergebnis (Spiel noch nicht
 * angepfiffen). Der `if (last)`-Guard hier ist einer der beiden bereits
 * beim ersten Deploy manuell gefixten TypeScript-Fehler — bewusst
 * erhalten.
 */
function currentScore(results: RawResult[], goals: RawGoal[]): { home: number | null; away: number | null } {
  const final = results.find((r) => r.resultTypeId === 2);
  if (final) return { home: final.pointsTeam1, away: final.pointsTeam2 };

  if (goals.length > 0) {
    const last = goals[goals.length - 1];
    if (last) return { home: last.scoreTeam1, away: last.scoreTeam2 };
  }

  const halftime = results.find((r) => r.resultTypeId === 1);
  if (halftime) return { home: halftime.pointsTeam1, away: halftime.pointsTeam2 };

  return { home: null, away: null };
}

function halftimeScore(results: RawResult[]): { home: number; away: number } | null {
  const halftime = results.find((r) => r.resultTypeId === 1);
  return halftime ? { home: halftime.pointsTeam1, away: halftime.pointsTeam2 } : null;
}

/**
 * Tore -> interne MatchEvents. Die Mannschaft eines Tors wird aus der
 * Differenz zum vorherigen kumulierten Spielstand abgeleitet. Keine
 * Karten/Wechsel — die liefert OpenLigaDB nicht.
 */
function toEvents(goals: RawGoal[], matchId: string): MatchEvent[] {
  let prevHome = 0;

  return goals.map((goal, i) => {
    const team: "home" | "away" = goal.scoreTeam1 > prevHome ? "home" : "away";
    prevHome = goal.scoreTeam1;

    return {
      id: `olb-goal-${matchId}-${goal.id}-${i}`,
      matchId,
      minute: goal.minute ?? 0,
      type: "goal",
      team,
      player: goal.scorerName ?? "Unbekannt",
      detail: `${goal.scoreTeam1}:${goal.scoreTeam2}${goal.isPenalty ? " (Elfmeter)" : ""}${
        goal.isOwnGoal ? " (Eigentor)" : ""
      }`,
    } satisfies MatchEvent;
  });
}

function fallbackMatch(): Match {
  return {
    id: "unknown",
    competition: "3. Liga",
    matchday: 0,
    kickoff: new Date().toISOString(),
    venue: "",
    homeTeam: { id: "olb-unknown-home", name: "Unbekannt", shortName: "—" },
    awayTeam: { id: "olb-unknown-away", name: "Unbekannt", shortName: "—" },
    homeScore: null,
    awayScore: null,
    status: "scheduled",
    minute: null,
    events: [],
    isMsvMatch: false,
  };
}

export function mapOldbMatch(raw: unknown): Match {
  if (!isRawObject(raw)) {
    warnUnexpectedShape("match-object", raw);
    return fallbackMatch();
  }

  const fields = extractMatchFields(raw);
  const homeTeam = extractTeam(raw["Team1"] ?? raw["team1"], "Heim");
  const awayTeam = extractTeam(raw["Team2"] ?? raw["team2"], "Auswärts");
  const results = extractResults(raw);
  const goals = extractGoals(raw, fields.matchId || "match");
  const status = deriveMatchStatus(fields, results);
  const score = currentScore(results, goals);

  return {
    id: fields.matchId || `${homeTeam.id}-${awayTeam.id}-${fields.kickoff}`,
    competition: fields.leagueName,
    matchday: fields.groupOrderId,
    kickoff: fields.kickoff,
    venue: fields.locationStadium ?? "",
    homeTeam,
    awayTeam,
    homeScore: score.home,
    awayScore: score.away,
    halftimeScore: halftimeScore(results),
    status,
    minute: null,
    events: toEvents(goals, fields.matchId || "match"),
    isMsvMatch: homeTeam.id === MSV_TEAM_ID || awayTeam.id === MSV_TEAM_ID,
  };
}
