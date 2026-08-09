import { NewsItem } from "@/types/news";

// ACHTUNG: Demo-Daten, frei erfunden — keine echten Meldungen.

export const MOCK_NEWS: NewsItem[] = [
  {
    id: "demo-news-1",
    headline: "Trainer äußert sich vor dem Spiel gegen Verl zur Personallage",
    teaser:
      "Vor dem Heimspiel gegen den SC Verl gibt der Trainer einen Ausblick auf die Startelf und die zuletzt angeschlagenen Spieler.",
    source: "Vereinsmitteilung",
    sourceUrl: "https://example.com/demo-news-1",
    publishedAt: "2026-08-09T09:15:00+02:00",
    category: "msv",
  },
  {
    id: "demo-news-2",
    headline: "Rückblick: Wichtiger Auswärtssieg bei 1860 München",
    teaser:
      "Der MSV entführt drei Punkte aus München. Die Analyse zum Spielverlauf und den zwei entscheidenden Szenen.",
    source: "Spielbericht",
    sourceUrl: "https://example.com/demo-news-2",
    publishedAt: "2026-08-09T16:40:00+02:00",
    category: "spieltag",
  },
  {
    id: "demo-news-3",
    headline: "3. Liga: Spitzenreiter verliert erstmals in dieser Saison",
    teaser:
      "Ein überraschendes Ergebnis an der Tabellenspitze sorgt für Bewegung im oberen Drittel der Liga.",
    source: "Liga-Übersicht",
    sourceUrl: "https://example.com/demo-news-3",
    publishedAt: "2026-08-09T18:05:00+02:00",
    category: "dritteliga",
  },
];
