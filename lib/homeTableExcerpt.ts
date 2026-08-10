import { TableEntry } from "@/types/table";

/**
 * Wählt einen kompakten Ausschnitt (Standard: 5 Einträge) aus einer
 * bereits vollständig sortierten Tabelle für die Home-Vorschau aus.
 *
 * Bewusst NUR eine Auswahl/Slice — es werden keine Positionen neu
 * berechnet oder verändert. Jeder zurückgegebene TableEntry behält exakt
 * die `position`, die er in der übergebenen `table` hatte (wichtig bei
 * punkt-/torgleichen Teams mit identischer OpenLigaDB-Positionsnummer).
 *
 * Regel:
 * - Steht der Zielteam (z.B. MSV) innerhalb der ersten `windowSize`
 *   Tabellenplätze, wird die Tabellenspitze gezeigt (Index 0..windowSize-1)
 *   statt eines künstlich zentrierten Fensters, das die Spitze abschneiden
 *   würde.
 * - Andernfalls wird ein auf das Zielteam zentriertes Fenster gezeigt,
 *   das am Tabellenende so weit nach oben verschoben wird, dass trotzdem
 *   `windowSize` Einträge sichtbar sind (sofern die Tabelle lang genug ist).
 * - Ist das Zielteam nicht in der Tabelle enthalten, wird einfach die
 *   Tabellenspitze gezeigt.
 * - Hat die Tabelle insgesamt weniger als `windowSize` Einträge, wird sie
 *   vollständig zurückgegeben.
 */
export function selectHomeTableExcerpt(
  table: TableEntry[],
  targetTeamId: string,
  windowSize = 5
): TableEntry[] {
  if (table.length <= windowSize) return table;

  const targetIndex = table.findIndex((entry) => entry.teamId === targetTeamId);

  if (targetIndex === -1 || targetIndex < windowSize) {
    return table.slice(0, windowSize);
  }

  const maxStart = table.length - windowSize;
  const centeredStart = targetIndex - Math.floor(windowSize / 2);
  const start = Math.min(Math.max(centeredStart, 0), maxStart);

  return table.slice(start, start + windowSize);
}
