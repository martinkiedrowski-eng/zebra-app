import { TableEntry } from "@/types/table";
import { Match } from "@/types/match";
import { MOCK_MATCH_REPORT } from "./matchCenter";

// ACHTUNG: Demo-Daten. Aus Aufwandsgründen eine auf 10 Teams reduzierte
// Liga statt der realen 20 Vereine der 3. Liga — für Tabellenberechnung,
// Spieltag-Multiplex und Live-Tabelle reicht das für die UX-Erprobung.
// Alle Werte frei erfunden, keine echten aktuellen Tabellenstände.

// Basistabelle VOR dem aktuellen (5.) Spieltag — jedes Team hat 4 Spiele.
export const MOCK_BASELINE_TABLE: TableEntry[] = [
  { position: 1, teamId: "demo-fci", teamName: "FC Ingolstadt 04", teamShortName: "FCI", played: 4, wins: 3, draws: 1, losses: 0, goalsFor: 9, goalsAgainst: 3, points: 10, isMsv: false, zone: "promotion" },
  { position: 2, teamId: "demo-opp-1", teamName: "SC Verl", teamShortName: "Verl", played: 4, wins: 3, draws: 0, losses: 1, goalsFor: 8, goalsAgainst: 4, points: 9, isMsv: false, zone: "promotion" },
  { position: 3, teamId: "demo-hal", teamName: "Hallescher FC", teamShortName: "HAL", played: 4, wins: 2, draws: 2, losses: 0, goalsFor: 7, goalsAgainst: 3, points: 8, isMsv: false, zone: "promotion" },
  { position: 4, teamId: "msv", teamName: "MSV Duisburg", teamShortName: "MSV", played: 4, wins: 2, draws: 1, losses: 1, goalsFor: 7, goalsAgainst: 5, points: 7, isMsv: true },
  { position: 5, teamId: "demo-t5", teamName: "TSV 1860 München", teamShortName: "1860", played: 4, wins: 2, draws: 0, losses: 2, goalsFor: 6, goalsAgainst: 6, points: 6, isMsv: false },
  { position: 6, teamId: "demo-t6", teamName: "Rot-Weiss Essen", teamShortName: "RWE", played: 4, wins: 2, draws: 0, losses: 2, goalsFor: 5, goalsAgainst: 5, points: 6, isMsv: false },
  { position: 7, teamId: "demo-sve", teamName: "SV Elversberg", teamShortName: "SVE", played: 4, wins: 1, draws: 2, losses: 1, goalsFor: 5, goalsAgainst: 5, points: 5, isMsv: false },
  { position: 8, teamId: "demo-sgd", teamName: "Dynamo Dresden", teamShortName: "SGD", played: 4, wins: 1, draws: 1, losses: 2, goalsFor: 4, goalsAgainst: 6, points: 4, isMsv: false },
  { position: 9, teamId: "demo-vik", teamName: "SV Viktoria Köln", teamShortName: "VIK", played: 4, wins: 1, draws: 0, losses: 3, goalsFor: 3, goalsAgainst: 7, points: 3, isMsv: false, zone: "relegation" },
  { position: 10, teamId: "demo-saa", teamName: "SV Saarbrücken", teamShortName: "SAA", played: 4, wins: 0, draws: 1, losses: 3, goalsFor: 2, goalsAgainst: 8, points: 1, isMsv: false, zone: "relegation" },
];

const TEAM = {
  fci: { id: "demo-fci", name: "FC Ingolstadt 04", shortName: "FCI" },
  verl: { id: "demo-opp-1", name: "SC Verl", shortName: "Verl" },
  hal: { id: "demo-hal", name: "Hallescher FC", shortName: "HAL" },
  msv: { id: "msv", name: "MSV Duisburg", shortName: "MSV" },
  t1860: { id: "demo-t5", name: "TSV 1860 München", shortName: "1860" },
  rwe: { id: "demo-t6", name: "Rot-Weiss Essen", shortName: "RWE" },
  sve: { id: "demo-sve", name: "SV Elversberg", shortName: "SVE" },
  sgd: { id: "demo-sgd", name: "Dynamo Dresden", shortName: "SGD" },
  vik: { id: "demo-vik", name: "SV Viktoria Köln", shortName: "VIK" },
  saa: { id: "demo-saa", name: "SV Saarbrücken", shortName: "SAA" },
};

// Der komplette 5. Spieltag im "Multiplex Live"-Demo-Zustand: mehrere
// gleichzeitig laufende Spiele (inkl. eines an der Halbzeitmarke), ein
// bereits beendetes Spiel und ein noch nicht angepfiffenes Spiel.
export const MOCK_MATCHDAY_MATCHES: Match[] = [
  {
    id: "demo-verl",
    competition: "3. Liga",
    matchday: 5,
    kickoff: "2026-08-16T13:30:00+02:00",
    venue: "Schauinsland-Reisen-Arena, Duisburg",
    homeTeam: TEAM.msv,
    awayTeam: TEAM.verl,
    homeScore: 1,
    awayScore: 1,
    status: "live",
    minute: 67,
    events: [],
    isMsvMatch: true,
  },
  {
    id: "demo-md-fci-saa",
    competition: "3. Liga",
    matchday: 5,
    kickoff: "2026-08-16T13:30:00+02:00",
    venue: "Audi Sportpark, Ingolstadt",
    homeTeam: TEAM.fci,
    awayTeam: TEAM.saa,
    homeScore: 3,
    awayScore: 0,
    status: "finished",
    minute: null,
    events: [],
    isMsvMatch: false,
  },
  {
    id: "demo-md-hal-1860",
    competition: "3. Liga",
    matchday: 5,
    kickoff: "2026-08-16T13:30:00+02:00",
    venue: "erdgas Sportpark, Halle",
    homeTeam: TEAM.hal,
    awayTeam: TEAM.t1860,
    homeScore: 1,
    awayScore: 0,
    status: "halftime",
    minute: 45,
    events: [],
    isMsvMatch: false,
  },
  {
    id: "demo-md-rwe-sgd",
    competition: "3. Liga",
    matchday: 5,
    kickoff: "2026-08-16T15:30:00+02:00",
    venue: "Stadion Essen",
    homeTeam: TEAM.rwe,
    awayTeam: TEAM.sgd,
    homeScore: null,
    awayScore: null,
    status: "scheduled",
    minute: null,
    events: [],
    isMsvMatch: false,
  },
  {
    id: "demo-md-sve-vik",
    competition: "3. Liga",
    matchday: 5,
    kickoff: "2026-08-16T13:30:00+02:00",
    venue: "URSAPHARM-Arena, Elversberg",
    homeTeam: TEAM.sve,
    awayTeam: TEAM.vik,
    homeScore: 1,
    awayScore: 1,
    status: "finished",
    minute: null,
    events: [],
    isMsvMatch: false,
  },
];

function toScheduled(match: Match): Match {
  return {
    ...match,
    status: "scheduled",
    homeScore: null,
    awayScore: null,
    halftimeScore: null,
    minute: null,
    events: [],
    stats: undefined,
    lineup: undefined,
  };
}

// "Normal"-Dev-Zustand: noch kein Spiel des Spieltags angepfiffen.
export const MOCK_MATCHDAY_SCHEDULED: Match[] = MOCK_MATCHDAY_MATCHES.map(toScheduled);

// Für den REPORT-Dev-Zustand von Match Center: derselbe Spieltag, aber das
// MSV-Spiel bereits mit Endstand (inkl. Events/Stats/Lineup aus dem
// bestehenden Match-Center-Mock).
export const MOCK_MATCHDAY_MSV_FINISHED: Match[] = MOCK_MATCHDAY_MATCHES.map((m) =>
  m.id === "demo-verl" ? MOCK_MATCH_REPORT : m
);

export const CURRENT_MATCHDAY = 5;
