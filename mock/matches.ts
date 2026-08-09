import { Match } from "@/types/match";

// ACHTUNG: Demo-Daten. Realistisch strukturiert, aber frei erfunden.
// Wird ausschließlich über MockFootballProvider ausgeliefert und ist so
// 1:1 durch einen echten Provider (z.B. OpenLigaDB) ersetzbar.

export const MOCK_NEXT_MATCH: Match = {
  id: "demo-match-next",
  competition: "3. Liga",
  matchday: 5,
  kickoff: "2026-08-16T13:30:00+02:00",
  venue: "Schauinsland-Reisen-Arena, Duisburg",
  homeTeam: { id: "msv", name: "MSV Duisburg", shortName: "MSV" },
  awayTeam: { id: "demo-opp-1", name: "SC Verl", shortName: "Verl" },
  homeScore: null,
  awayScore: null,
  status: "scheduled",
  minute: null,
  events: [],
  isMsvMatch: true,
};

export const MOCK_LIVE_MATCH: Match = {
  id: "demo-match-live",
  competition: "3. Liga",
  matchday: 5,
  kickoff: "2026-08-16T13:30:00+02:00",
  venue: "Schauinsland-Reisen-Arena, Duisburg",
  homeTeam: { id: "msv", name: "MSV Duisburg", shortName: "MSV" },
  awayTeam: { id: "demo-opp-1", name: "SC Verl", shortName: "Verl" },
  homeScore: 1,
  awayScore: 1,
  status: "live",
  minute: 67,
  isMsvMatch: true,
  events: [
    {
      id: "ev-1",
      matchId: "demo-match-live",
      minute: 67,
      type: "substitution",
      team: "home",
      player: "K. Bouhaddouz",
      detail: "kommt für J. Vermeij",
    },
    {
      id: "ev-2",
      matchId: "demo-match-live",
      minute: 54,
      type: "goal",
      team: "away",
      player: "T. Rothe",
      detail: "Ausgleich zum 1:1",
    },
    {
      id: "ev-3",
      matchId: "demo-match-live",
      minute: 38,
      type: "yellow-card",
      team: "home",
      player: "V. Rankel",
    },
    {
      id: "ev-4",
      matchId: "demo-match-live",
      minute: 22,
      type: "goal",
      team: "home",
      player: "J. Vermeij",
      detail: "Führung zum 1:0",
    },
  ],
};

export const MOCK_LAST_MATCH: Match = {
  id: "demo-match-last",
  competition: "3. Liga",
  matchday: 4,
  kickoff: "2026-08-09T13:00:00+02:00",
  venue: "Auswärts",
  homeTeam: { id: "demo-opp-2", name: "TSV 1860 München", shortName: "1860" },
  awayTeam: { id: "msv", name: "MSV Duisburg", shortName: "MSV" },
  homeScore: 1,
  awayScore: 2,
  status: "finished",
  minute: null,
  events: [],
  isMsvMatch: true,
};
