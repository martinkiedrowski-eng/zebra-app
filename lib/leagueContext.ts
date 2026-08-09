import { TeamLiveContext } from "./tableEngine";

export type ContextDirection = "up" | "down" | "neutral";

export interface LeagueContext {
  headline: string;
  direction: ContextDirection;
}

function direction(context: TeamLiveContext): ContextDirection {
  if (context.currentPosition < context.previousPosition) return "up";
  if (context.currentPosition > context.previousPosition) return "down";
  return "neutral";
}

/**
 * Für Match Center (Live/Report): bezieht sich auf ein konkretes Spiel und
 * darf den Gegnernamen nennen. Beispiele siehe Aufgabenstellung:
 * "Mit diesem Stand steigt Duisburg von Platz 4 auf Platz 3."
 * "MSV bleibt auf Platz 4 · noch 2 Punkte bis Platz 3."
 * "Duisburg fällt aktuell auf Platz 6 zurück."
 */
export function buildMatchLiveContext(context: TeamLiveContext): LeagueContext {
  const dir = direction(context);

  if (dir === "up") {
    return {
      headline: `Mit diesem Stand steigt Duisburg von Platz ${context.previousPosition} auf Platz ${context.currentPosition}.`,
      direction: dir,
    };
  }

  if (dir === "down") {
    return {
      headline: `Duisburg fällt aktuell auf Platz ${context.currentPosition} zurück.`,
      direction: dir,
    };
  }

  if (context.pointsToAbove !== null && context.pointsToAbove > 0) {
    return {
      headline: `MSV bleibt auf Platz ${context.currentPosition} · noch ${context.pointsToAbove} ${
        context.pointsToAbove === 1 ? "Punkt" : "Punkte"
      } bis Platz ${context.currentPosition - 1}.`,
      direction: dir,
    };
  }

  return { headline: `MSV bleibt auf Platz ${context.currentPosition}.`, direction: dir };
}

/**
 * Für die 3.-Liga-Seite ("MSV Lage" / "Was bedeutet der Spieltag für den
 * MSV?"): kein Bezug auf ein einzelnes Spiel, sondern der Gesamtstand.
 */
export function buildMsvLageContext(context: TeamLiveContext): LeagueContext {
  const dir = direction(context);
  const parts: string[] = [`Platz ${context.currentPosition}`];

  if (context.pointsToAbove !== null && context.pointsToAbove > 0) {
    parts.push(
      `${context.pointsToAbove} ${context.pointsToAbove === 1 ? "Punkt" : "Punkte"} bis Platz ${
        context.currentPosition - 1
      }`
    );
  } else if (context.pointsToAbove === 0) {
    parts.push(`punktgleich mit Platz ${context.currentPosition - 1}`);
  }

  if (context.pointsToBelow !== null && context.pointsToBelow > 0) {
    parts.push(
      `${context.pointsToBelow} ${context.pointsToBelow === 1 ? "Punkt" : "Punkte"} Vorsprung auf Platz ${
        context.currentPosition + 1
      }`
    );
  }

  return { headline: parts.join(" · "), direction: dir };
}
