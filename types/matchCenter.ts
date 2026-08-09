export interface MatchStats {
  possession: { home: number; away: number };
  shots: { home: number; away: number };
  shotsOnTarget: { home: number; away: number };
  corners: { home: number; away: number };
}

export interface MatchPlayer {
  id: string;
  name: string;
  number: number;
  position: string;
}

export interface MatchLineup {
  formationHome?: string;
  formationAway?: string;
  startingHome: MatchPlayer[];
  benchHome: MatchPlayer[];
  startingAway: MatchPlayer[];
  benchAway: MatchPlayer[];
}

export interface MatchAvailability {
  out: string[];
  doubtful: string[];
  returning: string[];
}

export type MatchContextDirection = "up" | "down" | "neutral";

export interface MatchContext {
  headline: string;
  direction: MatchContextDirection;
}

export type MatchContentType =
  | "vorbericht"
  | "pressekonferenz"
  | "interview"
  | "spielbericht"
  | "highlights";

export interface MatchContentItem {
  id: string;
  matchId: string;
  type: MatchContentType;
  title: string;
  source: string;
  sourceUrl: string;
  publishedAt: string;
}
