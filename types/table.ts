export interface TableEntry {
  position: number;
  teamId: string;
  teamName: string;
  teamShortName: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
  isMsv: boolean;
  zone?: "promotion" | "relegation-playoff" | "relegation";
}

export type FormResult = "win" | "draw" | "loss";

export interface FormMatch {
  matchId: string;
  opponentShortName: string;
  result: FormResult;
  scoreLabel: string; // z.B. "2:1"
  home: boolean;
}
