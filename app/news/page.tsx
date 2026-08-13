import { AppShell } from "@/components/layout/AppShell";
import { NewsFeed } from "@/components/news/NewsFeed";
import { getAggregatedNews } from "@/lib/newsFeed/aggregate";

// Server Component: aggregiert MSV Duisburg (offiziell), ZebraTV/YouTube
// und liga3-online.de zu einem gemeinsamen, chronologischen Feed. Keine
// künstliche Auswahl "wichtiger" News, kein redaktionelles Ranking —
// neueste zuerst, das war's. Fällt eine Quelle aus, fehlen einfach ihre
// Einträge; technische Details dazu stehen ausschließlich unter
// /debug/content-sources, nicht hier.
//
// Filter (Product Polish 2B): der komplette Feed wird weiterhin genau
// einmal hier geladen und unverändert an die Client-Komponente NewsFeed
// durchgereicht — Alle/MSV/Videos filtern rein lokal auf diesem bereits
// vorhandenen Array, kein zweiter Aggregator-Aufruf, kein erneuter Fetch
// beim Tabwechsel.
export default async function NewsPage() {
  const items = await getAggregatedNews();

  return (
    <AppShell>
      <header className="mb-4">
        <p className="font-text text-xs uppercase tracking-wide text-zebra-mute">ZEBRA</p>
        <h1 className="font-display text-2xl font-bold uppercase tracking-wide text-zebra-ice">News</h1>
      </header>

      <NewsFeed items={items} />
    </AppShell>
  );
}
