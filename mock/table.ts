import { FormMatch } from "@/types/table";
import { MOCK_BASELINE_TABLE } from "./league";
import { MSV_TEAM_ID } from "@/lib/constants";

// Home zeigt einen kompakten Ausschnitt (±2 Plätze um den MSV) der
// EINEN Basistabelle aus mock/league.ts — keine eigenen, potenziell
// abweichenden Tabellendaten mehr.
const msvIndex = MOCK_BASELINE_TABLE.findIndex((e) => e.teamId === MSV_TEAM_ID);
const RANGE = 2;
export const MOCK_TABLE_EXCERPT = MOCK_BASELINE_TABLE.slice(
  Math.max(0, msvIndex - RANGE),
  msvIndex + RANGE + 1
);

// ACHTUNG: Demo-Daten, frei erfunden.
export const MOCK_MSV_FORM: FormMatch[] = [
  { matchId: "f1", opponentShortName: "1860", result: "win", scoreLabel: "2:1", home: false },
  { matchId: "f2", opponentShortName: "SVE", result: "draw", scoreLabel: "1:1", home: true },
  { matchId: "f3", opponentShortName: "RWE", result: "win", scoreLabel: "3:0", home: true },
  { matchId: "f4", opponentShortName: "VIK", result: "loss", scoreLabel: "0:1", home: false },
  { matchId: "f5", opponentShortName: "FCS", result: "win", scoreLabel: "2:0", home: true },
];
