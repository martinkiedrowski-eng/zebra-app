import { OpenLigaDbFootballProvider } from "./OpenLigaDbFootballProvider";

// Singleton, damit Football- und News-Provider im openligadb-Modus denselben
// In-Memory-Cache (siehe openligadb/client.ts) teilen, statt unabhängig
// doppelt zu pollen.
export const footballDataProviderReal = new OpenLigaDbFootballProvider();
