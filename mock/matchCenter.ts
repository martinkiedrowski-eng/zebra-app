import { Match } from "@/types/match";
import { MatchStats, MatchLineup, MatchAvailability, MatchContentItem } from "@/types/matchCenter";
import { FormMatch } from "@/types/table";

// ACHTUNG: Demo-Daten, frei erfunden. Alle drei Varianten teilen bewusst
// dieselbe matchId ("demo-verl") — sie stellen dieselbe fiktive Begegnung
// MSV gegen Verl zu drei verschiedenen Zeitpunkten dar, damit sich der
// komplette Preview/Live/Report-Flow an einem Spiel durchspielen lässt.

const HOME = { id: "msv", name: "MSV Duisburg", shortName: "MSV" };
const AWAY = { id: "demo-opp-1", name: "SC Verl", shortName: "Verl" };

export const MOCK_MATCH_PREVIEW: Match = {
  id: "demo-verl",
  competition: "3. Liga",
  matchday: 5,
  kickoff: "2026-08-16T13:30:00+02:00",
  venue: "Schauinsland-Reisen-Arena, Duisburg",
  homeTeam: HOME,
  awayTeam: AWAY,
  homeScore: null,
  awayScore: null,
  status: "scheduled",
  minute: null,
  events: [],
  isMsvMatch: true,
};

const LIVE_EVENTS = [
  {
    id: "ev-1",
    matchId: "demo-verl",
    minute: 67,
    type: "substitution" as const,
    team: "home" as const,
    player: "K. Bouhaddouz",
    detail: "kommt für J. Vermeij",
  },
  {
    id: "ev-2",
    matchId: "demo-verl",
    minute: 54,
    type: "goal" as const,
    team: "away" as const,
    player: "T. Rothe",
    detail: "Ausgleich zum 1:1",
  },
  {
    id: "ev-3",
    matchId: "demo-verl",
    minute: 45,
    type: "halftime" as const,
    team: "home" as const,
    player: "",
    detail: "Halbzeit 1:0",
  },
  {
    id: "ev-4",
    matchId: "demo-verl",
    minute: 38,
    type: "yellow-card" as const,
    team: "home" as const,
    player: "V. Rankel",
  },
  {
    id: "ev-5",
    matchId: "demo-verl",
    minute: 22,
    type: "goal" as const,
    team: "home" as const,
    player: "J. Vermeij",
    detail: "Führung zum 1:0",
  },
];

const LIVE_STATS: MatchStats = {
  possession: { home: 54, away: 46 },
  shots: { home: 9, away: 6 },
  shotsOnTarget: { home: 4, away: 3 },
  corners: { home: 5, away: 2 },
};

const LIVE_LINEUP: MatchLineup = {
  formationHome: "4-2-3-1",
  formationAway: "4-4-2",
  startingHome: [
    { id: "p1", name: "V. Ortag", number: 1, position: "TW" },
    { id: "p2", name: "M. Pape", number: 4, position: "IV" },
    { id: "p3", name: "T. Bell", number: 5, position: "IV" },
    { id: "p4", name: "V. Rankel", number: 21, position: "RV" },
    { id: "p5", name: "D. Kyerewaa", number: 16, position: "LV" },
    { id: "p6", name: "A. Berger", number: 6, position: "ZM" },
    { id: "p7", name: "S. Bormuth", number: 8, position: "ZM" },
    { id: "p8", name: "S. Kefkir", number: 10, position: "OM" },
    { id: "p9", name: "T. Kammerbauer", number: 17, position: "OM" },
    { id: "p10", name: "F. Sunny Dorn", number: 19, position: "OM" },
    { id: "p11", name: "J. Vermeij", number: 9, position: "ST" },
  ],
  benchHome: [
    { id: "b1", name: "K. Bouhaddouz", number: 29, position: "ST" },
    { id: "b2", name: "A. Wittek", number: 14, position: "RV" },
    { id: "b3", name: "L. Meyer", number: 23, position: "IV" },
  ],
  startingAway: [
    { id: "a1", name: "L. Pauli", number: 1, position: "TW" },
    { id: "a2", name: "T. Rothe", number: 7, position: "ST" },
  ],
  benchAway: [{ id: "ab1", name: "N. Iuhaniwa", number: 24, position: "ST" }],
};

export const MOCK_MATCH_LIVE: Match = {
  ...MOCK_MATCH_PREVIEW,
  homeScore: 1,
  awayScore: 1,
  halftimeScore: { home: 1, away: 0 },
  status: "live",
  minute: 67,
  events: LIVE_EVENTS,
  stats: LIVE_STATS,
  lineup: LIVE_LINEUP,
};

export const MOCK_MATCH_REPORT: Match = {
  ...MOCK_MATCH_PREVIEW,
  homeScore: 2,
  awayScore: 1,
  halftimeScore: { home: 1, away: 0 },
  status: "finished",
  minute: null,
  events: [
    ...LIVE_EVENTS,
    {
      id: "ev-6",
      matchId: "demo-verl",
      minute: 84,
      type: "goal",
      team: "home",
      player: "K. Bouhaddouz",
      detail: "Entscheidung zum 2:1",
    },
  ],
  stats: {
    possession: { home: 55, away: 45 },
    shots: { home: 14, away: 8 },
    shotsOnTarget: { home: 6, away: 4 },
    corners: { home: 7, away: 3 },
  },
  lineup: LIVE_LINEUP,
};

export const MOCK_AVAILABILITY: MatchAvailability = {
  out: ["T. Wolze (Muskelverletzung)"],
  doubtful: ["A. Berger (Erkältung)"],
  returning: ["D. Kyerewaa (nach Sperre)"],
};

export const MOCK_OPPONENT_FORM: FormMatch[] = [
  { matchId: "of1", opponentShortName: "FCS", result: "win", scoreLabel: "2:0", home: true },
  { matchId: "of2", opponentShortName: "RWE", result: "win", scoreLabel: "1:0", home: false },
  { matchId: "of3", opponentShortName: "VIK", result: "draw", scoreLabel: "1:1", home: true },
  { matchId: "of4", opponentShortName: "1860", result: "win", scoreLabel: "3:1", home: false },
  { matchId: "of5", opponentShortName: "SVE", result: "loss", scoreLabel: "0:2", home: true },
];

export const MOCK_MATCH_CONTENT: MatchContentItem[] = [
  {
    id: "mc-1",
    matchId: "demo-verl",
    type: "vorbericht",
    title: "Vorbericht: Was vor dem Spiel gegen Verl wichtig ist",
    source: "Vereinsmitteilung",
    sourceUrl: "https://example.com/demo-vorbericht",
    publishedAt: "2026-08-14T10:00:00+02:00",
  },
  {
    id: "mc-2",
    matchId: "demo-verl",
    type: "pressekonferenz",
    title: "Pressekonferenz vor dem Spieltag",
    source: "ZEBRA TV",
    sourceUrl: "https://example.com/demo-pk",
    publishedAt: "2026-08-14T13:00:00+02:00",
  },
  {
    id: "mc-3",
    matchId: "demo-verl",
    type: "interview",
    title: "Interview: Kapitän spricht über die Ausgangslage",
    source: "ZEBRA TV",
    sourceUrl: "https://example.com/demo-interview",
    publishedAt: "2026-08-15T09:00:00+02:00",
  },
  {
    id: "mc-4",
    matchId: "demo-verl",
    type: "spielbericht",
    title: "Spielbericht: MSV dreht das Spiel in Halbzeit zwei",
    source: "Spielbericht",
    sourceUrl: "https://example.com/demo-spielbericht",
    publishedAt: "2026-08-16T15:45:00+02:00",
  },
  {
    id: "mc-5",
    matchId: "demo-verl",
    type: "highlights",
    title: "Highlights: Alle Tore im Video",
    source: "ZEBRA TV",
    sourceUrl: "https://example.com/demo-highlights",
    publishedAt: "2026-08-16T16:00:00+02:00",
  },
];
