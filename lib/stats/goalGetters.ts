import { FOOTBALL_CONFIG } from "@/config/football";
import { IS_MOCK_MODE } from "@/providers/registry";

/**
 * V1.1 Stats-Tab: Torjäger. Bewusst NICHT über FootballDataProvider
 * (kein sinnvolles Mock-Äquivalent, ähnlich lib/spiele/dfbPokal.ts als
 * eigenständiger, isolierter Client neben dem Hauptprovider) — aber
 * dieselben Konventionen: defensive PascalCase/camelCase-Feldsuche,
 * niemals werfen, im Fehlerfall/Mock-Modus leeres Array statt Absturz.
 *
 * KEINE Teamzuordnung: OpenLigaDB liefert laut vorherigem Reality Check
 * kein Team-Feld bei getgoalgetters — deshalb bewusst nur name+goals,
 * kein Namens-Fuzzy-Matching, keine MSV-Markierung an dieser Stelle.
 */
export interface GoalGetter {
  rank: number;
  name: string;
  goals: number;
}

function raw(obj: unknown, ...keys: string[]): unknown {
  if (typeof obj !== "object" || obj === null) return undefined;
  const o = obj as Record<string, unknown>;
  for (const k of keys) {
    if (k in o) return o[k];
  }
  return undefined;
}

function toNumber(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "" && !Number.isNaN(Number(v))) return Number(v);
  return null;
}

export async function fetchGoalGetters(): Promise<GoalGetter[]> {
  if (IS_MOCK_MODE) return [];

  try {
    const { leagueShortcut, season, baseUrl } = FOOTBALL_CONFIG;
    const res = await fetch(`${baseUrl}/getgoalgetters/${leagueShortcut}/${season}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];

    const data: unknown = await res.json();
    if (!Array.isArray(data)) return [];

    const parsed = data
      .map((entry) => {
        const name = raw(entry, "GoalGetterName", "goalGetterName");
        const goals = toNumber(raw(entry, "GoalCount", "goalCount"));
        if (typeof name !== "string" || !name.trim() || goals === null) return null;
        return { name: name.trim(), goals };
      })
      .filter((e): e is { name: string; goals: number } => e !== null)
      .sort((a, b) => b.goals - a.goals);

    return parsed.map((e, i) => ({ rank: i + 1, name: e.name, goals: e.goals }));
  } catch {
    return [];
  }
}
