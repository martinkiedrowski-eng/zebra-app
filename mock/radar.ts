import { RadarEvent } from "@/types/radar";

// ACHTUNG: Demo-Daten, frei erfunden.

export const MOCK_RADAR_EVENTS: RadarEvent[] = [
  {
    id: "demo-radar-1",
    type: "statement",
    headline: "Trainer äußert sich zur Startelf gegen Verl",
    timestamp: "2026-08-09T09:15:00+02:00",
    relevance: "high",
    linkedNewsId: "demo-news-1",
  },
  {
    id: "demo-radar-2",
    type: "lineup",
    headline: "Zwei Rückkehrer im Kader für das Training am Montag gemeldet",
    timestamp: "2026-08-09T08:00:00+02:00",
    relevance: "medium",
  },
  {
    id: "demo-radar-3",
    type: "table-shift",
    headline: "MSV rückt nach dem Wochenende auf Platz 4 vor",
    timestamp: "2026-08-09T18:30:00+02:00",
    relevance: "medium",
  },
];
