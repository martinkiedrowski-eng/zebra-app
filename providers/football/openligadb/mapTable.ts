import { TableEntry } from "@/types/table";
import { isRawObject, pickString, pickNumber, warnUnexpectedShape } from "./safe";
import { normalizeTeamIdRaw } from "./teamIdMap";

/**
 * Nimmt bewusst `unknown` statt eines vertrauten OldbTableEntry-Typs an —
 * genau dieses blinde Vertrauen in eine unverifizierte Typannahme war
 * mutmaßlich die Ursache für leere Teamnamen und NaN im ersten
 * Production-Deploy. Jedes Feld wird über mehrere plausible Kandidaten-
 * Keys defensiv extrahiert (siehe safe.ts).
 */
export function mapOldbTableEntry(raw: unknown, position: number): TableEntry {
  if (!isRawObject(raw)) {
    warnUnexpectedShape("getbltable-entry", raw);
    return {
      position,
      teamId: `olb-unknown-${position}`,
      teamName: "Unbekanntes Team",
      teamShortName: "—",
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      points: 0,
      isMsv: false,
    };
  }

  const teamName = pickString(raw, ["TeamName", "teamName", "Name", "name"]);
  const shortName = pickString(raw, ["ShortName", "shortName", "TeamNameShort", "teamShortName"]);
  const rawTeamId = pickNumber(raw, ["TeamInfoId", "TeamId", "teamInfoId", "teamId", "Id", "id"], NaN);

  if (!teamName) {
    warnUnexpectedShape("getbltable-entry", raw);
  }

  const { teamId, isMsv } = normalizeTeamIdRaw(
    Number.isFinite(rawTeamId) ? rawTeamId : position,
    teamName,
    shortName
  );

  const goalsFor = pickNumber(raw, ["Goals", "goals", "GoalsFor", "goalsFor", "ScoredGoals"]);
  const goalsAgainst = pickNumber(raw, ["OpponentGoals", "opponentGoals", "GoalsAgainst", "goalsAgainst"]);

  return {
    position,
    teamId,
    teamName: teamName || `Team ${position}`,
    teamShortName: shortName || teamName || `Team ${position}`,
    played: pickNumber(raw, ["Matches", "matches", "Played", "played"]),
    wins: pickNumber(raw, ["Won", "won", "Wins", "wins"]),
    draws: pickNumber(raw, ["Draw", "draw", "Draws", "draws"]),
    losses: pickNumber(raw, ["Lost", "lost", "Losses", "losses"]),
    goalsFor,
    goalsAgainst,
    points: pickNumber(raw, ["Points", "points"]),
    isMsv,
  };
}
