import { FootballDataProvider } from "./football/FootballDataProvider";
import { MockFootballProvider } from "./football/MockFootballProvider";
import { footballDataProviderReal } from "./football/openligadbInstance";
import { NewsProvider } from "./news/NewsProvider";
import { MockNewsProvider } from "./news/MockNewsProvider";
import { OpenLigaDbNewsProvider } from "./news/OpenLigaDbNewsProvider";

/**
 * Einziger Ort, an dem entschieden wird, welche Provider-Implementierung
 * aktiv ist — gesteuert über die Umgebungsvariable FOOTBALL_DATA_SOURCE
 * (siehe .env.example). Kein Code außerhalb dieser Datei muss sich dafür
 * ändern.
 *
 * "mock"      -> komplette Demo-Sandbox für Design/Development (Standard,
 *                falls die Variable fehlt — kein versehentlicher
 *                Live-Betrieb ohne explizite Konfiguration).
 * "openligadb" -> erste echte Datenstufe. Fehlende Felder werden NICHT
 *                 durch Mock-Daten ersetzt (siehe OpenLigaDbFootballProvider
 *                 und OpenLigaDbNewsProvider) — Bereiche blenden sich
 *                 stattdessen selbst aus.
 */
const DATA_SOURCE = process.env.FOOTBALL_DATA_SOURCE === "openligadb" ? "openligadb" : "mock";

export const footballDataProvider: FootballDataProvider =
  DATA_SOURCE === "openligadb" ? footballDataProviderReal : new MockFootballProvider();

export const newsProvider: NewsProvider =
  DATA_SOURCE === "openligadb" ? new OpenLigaDbNewsProvider() : new MockNewsProvider();

/** Nur im Mock-Modus wahr — steuert den "Demo-Daten"-Badge. */
export const IS_DEMO_DATA = DATA_SOURCE === "mock";

/** Für den dezenten Hinweis im Mehr-Bereich, nicht prominent auf Home. */
export const DATA_SOURCE_LABEL = DATA_SOURCE === "openligadb" ? "OpenLigaDB" : "Demo-Daten";

/** Steuert, ob Dev-/Demo-Zustandsumschalter (Next-Up/Live, Preview/Live/Report, Normal/Multiplex) angezeigt werden. */
export const IS_MOCK_MODE = DATA_SOURCE === "mock";
