/**
 * Einzige Stelle, an der Liga/Saison für die echte Datenquelle feststehen.
 * Umstellung auf eine neue Saison bedeutet: SEASON hier ändern, sonst
 * nichts. Keine Komponente und kein Provider-Code kennt "bl3" oder "2026"
 * direkt — nur diese Datei.
 */
export const FOOTBALL_CONFIG = {
  /** OpenLigaDB-LeagueShortcut für die 3. Liga */
  leagueShortcut: "bl3",
  /** Saison-Startjahr, z.B. 2026 = Saison 2026/27 */
  season: 2026,
  /** Menschenlesbarer Name für UI-Texte, die die Liga benennen müssen */
  competitionName: "3. Liga",
  baseUrl: "https://api.openligadb.de",
  /**
   * Anzahl Auf-/Abstiegsplätze für die Zonen-Markierung in der Tabelle.
   * Stand: gängige 3.-Liga-Regularien (3 direkte Aufsteiger, 4 Absteiger).
   * OpenLigaDB liefert diese Information nicht mit — bitte vor Saisonstart
   * gegen die aktuellen DFB-/DFL-Regularien der jeweiligen Saison prüfen,
   * falls sich das Format ändert.
   */
  promotionSpots: 3,
  relegationSpots: 4,
} as const;

/**
 * Polling-Frequenzen (Millisekunden) für die getlastchangedate-basierte
 * Aktualisierung. Zentral konfigurierbar statt in Komponenten verstreut.
 */
export const POLLING_CONFIG = {
  /** Kein Spiel läuft: seltene Aktualisierung reicht. */
  idleMs: 5 * 60 * 1000, // 5 Minuten
  /** Mindestens ein Spiel läuft: konservatives Live-Polling. */
  liveMs: 30 * 1000, // 30 Sekunden
} as const;
