import { MatchStats, MatchLineup } from "./matchCenter";

export type MatchStatus = "scheduled" | "live" | "halftime" | "finished" | "postponed";

export interface TeamRef {
  id: string;
  name: string;
  shortName: string;
  crestUrl?: string;
}

export interface MatchEvent {
  id: string;
  matchId: string;
  minute: number;
  type: "goal" | "yellow-card" | "red-card" | "substitution" | "halftime";
  team: "home" | "away";
  player: string;
  detail?: string;
}

export interface Match {
  id: string;
  competition: string;
  matchday: number;
  kickoff: string; // ISO-Datum
  venue: string;
  homeTeam: TeamRef;
  awayTeam: TeamRef;
  homeScore: number | null;
  awayScore: number | null;
  halftimeScore?: { home: number; away: number } | null;
  status: MatchStatus;
  minute: number | null;
  events: MatchEvent[];
  isMsvMatch: boolean;
  // Nur vorhanden, wenn eine Datenquelle diese Tiefe liefert — UI blendet
  // die jeweiligen Bereiche komplett aus, statt leere Platzhalter zu zeigen.
  stats?: MatchStats;
  lineup?: MatchLineup;
}
