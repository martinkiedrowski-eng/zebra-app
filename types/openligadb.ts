/**
 * HINWEIS (nach Production-Debug): Diese Datei bildete die ursprünglich
 * ANGENOMMENE (dokumentationsbasierte, nie live verifizierte) JSON-Struktur
 * von OpenLigaDB ab. Der erste Production-Deploy zeigte leere Teamnamen
 * und NaN-Werte — vermutlich weil diese Annahme an mindestens einer Stelle
 * nicht zur echten Response passte. Die Mapping-Schicht
 * (providers/football/openligadb/{mapMatch,mapTable,safe}.ts) verlässt
 * sich seitdem NICHT mehr auf diese festen Typen, sondern liest Felder
 * defensiv über mehrere plausible Namens-Kandidaten aus `unknown`-Werten
 * aus. Diese Datei wird von keinem Mapper mehr importiert — sie bleibt nur
 * als Referenz/Dokumentation der ursprünglichen Annahme stehen.
 */

export interface OldbTeam {
  TeamId: number;
  TeamName: string;
  ShortName: string | null;
  TeamIconUrl: string | null;
  TeamGroupName: string | null;
}

export interface OldbGroup {
  GroupName: string;
  GroupOrderID: number;
  GroupID: number;
}

export interface OldbMatchResult {
  ResultID: number;
  ResultName: string;
  PointsTeam1: number;
  PointsTeam2: number;
  ResultOrderID: number;
  /** 1 = Halbzeitergebnis, 2 = Endergebnis (Konvention laut OpenLigaDB-Doku) */
  ResultTypeID: number;
  ResultDescription: string;
}

export interface OldbGoal {
  GoalID: number;
  ScoreTeam1: number;
  ScoreTeam2: number;
  MatchMinute: number | null;
  GoalGetterID: number | null;
  GoalGetterName: string | null;
  IsPenalty: boolean;
  IsOwnGoal: boolean;
  IsOvertimeGoal: boolean;
  Comment: string | null;
}

export interface OldbLocation {
  LocationID: number;
  LocationCity: string | null;
  LocationStadium: string | null;
}

export interface OldbMatch {
  MatchID: number;
  MatchDateTime: string;
  MatchDateTimeUTC: string;
  TimeZoneID: string;
  LeagueId: number;
  LeagueName: string;
  LeagueSeason: number;
  LeagueShortcut: string;
  Group: OldbGroup;
  Team1: OldbTeam;
  Team2: OldbTeam;
  LastUpdateDateTime: string;
  MatchIsFinished: boolean;
  MatchResults: OldbMatchResult[];
  Goals: OldbGoal[];
  Location: OldbLocation | null;
  NumberOfViewers: number | null;
}

export interface OldbTableEntry {
  TeamInfoId: number;
  TeamName: string;
  ShortName: string | null;
  TeamIconUrl: string | null;
  Points: number;
  OpponentGoals: number;
  Goals: number;
  Matches: number;
  Won: number;
  Draw: number;
  Lost: number;
  GoalDiff: number;
}

export const RESULT_TYPE_HALFTIME = 1;
export const RESULT_TYPE_FINAL = 2;
