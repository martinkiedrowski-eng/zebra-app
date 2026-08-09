export type RadarEventType =
  | "transfer"
  | "injury"
  | "lineup"
  | "statement"
  | "schedule-change"
  | "rumor"
  | "table-shift"
  | "goal";

export type RadarRelevance = "high" | "medium";

export interface RadarEvent {
  id: string;
  type: RadarEventType;
  headline: string;
  timestamp: string; // ISO
  relevance: RadarRelevance;
  linkedNewsId?: string;
}
