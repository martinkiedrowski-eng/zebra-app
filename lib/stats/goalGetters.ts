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

/**
 * Explicit aliases for verified OpenLigaDB duplicate goalgetter records.
 * Do not add fuzzy matching here.
 *
 * Live-Debug (V1.1) hat bestätigt: OpenLigaDB liefert für denselben
 * realen Spieler teils zwei unterschiedliche Datensätze mit
 * unterschiedlicher goalGetterId (bestätigter Fall: "A. Voglsammer"
 * (ID 18686, 2 Tore) und "Andreas Voglsammer" (ID 17333, 1 Tor) — real
 * derselbe Spieler, zusammen 3 Tore). Eine ID-basierte Aggregation würde
 * das NICHT lösen, da die IDs selbst schon unterschiedlich sind — daher
 * bewusst eine kleine, manuell kontrollierte Namens-Alias-Liste statt
 * automatischer Erkennung. Nur nachweislich bestätigte Dubletten
 * ergänzen, niemals generisch nach Nachnamen zusammenführen (z.B.
 * "Müller"/"Schmidt"/"Wagner" könnten echte unterschiedliche Spieler
 * sein).
 */
const GOAL_GETTER_ALIASES: Record<string, string> = {
  "A. Voglsammer": "Andreas Voglsammer",
  "Andreas Voglsammer": "Andreas Voglsammer",
};

function canonicalGoalGetterName(name: string): string {
  return GOAL_GETTER_ALIASES[name] ?? name;
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
      .filter((e): e is { name: string; goals: number } => e !== null);

    // Bestätigte OpenLigaDB-Dubletten vor Sortierung/Ausgabe zu einem
    // Spieler zusammenführen (siehe GOAL_GETTER_ALIASES oben). Reihenfolge
    // der zuerst gesehenen Schreibweise bleibt für die Ausgabe irrelevant —
    // der kanonische Name ist immer derselbe.
    const merged = new Map<string, number>();
    for (const entry of parsed) {
      const canonical = canonicalGoalGetterName(entry.name);
      merged.set(canonical, (merged.get(canonical) ?? 0) + entry.goals);
    }

    const sorted = Array.from(merged.entries())
      .map(([name, goals]) => ({ name, goals }))
      .sort((a, b) => b.goals - a.goals);

    return sorted.map((e, i) => ({ rank: i + 1, name: e.name, goals: e.goals }));
  } catch {
    return [];
  }
}
