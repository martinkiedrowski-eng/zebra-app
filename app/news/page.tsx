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
// force-dynamic (ZEBRA-1.0-Regressionsfix): diese Route nutzt keine
// dynamischen APIs, wäre also für Next.js' Full Route Cache/statische
// Generierung berechtigt gewesen — die Seite hätte dann nur EINMAL (beim
// Build bzw. ersten Request) gerendert und dieses Ergebnis gecacht werden
// können. Landete dabei ein leerer/fehlgeschlagener YouTube-Fetch im
// Snapshot, blieb "keine Videos" dauerhaft hängen, obwohl der eigentliche
// Adapter (lib/newsFeed/sources/youtube.ts, unverändert) live nachweislich
// funktioniert (siehe /debug/youtube-feed). force-dynamic erzwingt echtes
// Server-Rendering bei jedem Request — die einzelnen fetch()-Aufrufe in
// den Source-Adaptern behalten ihr eigenes `next: { revalidate: 300 }`
// (Next.js Data Cache), das bleibt unverändert.
//
// Filter (Product Polish 2B): der komplette Feed wird weiterhin genau
// einmal hier geladen und unverändert an die Client-Komponente NewsFeed
// durchgereicht — Alle/MSV/Videos filtern rein lokal auf diesem bereits
// vorhandenen Array, kein zweiter Aggregator-Aufruf, kein erneuter Fetch
// beim Tabwechsel.
export const dynamic = "force-dynamic";

export default async function NewsPage() {
  const items = await getAggregatedNews();

  return (
    <AppShell>
      <header className="mb-4 flex items-start justify-between">
        <div>
          <p className="font-text text-xs uppercase tracking-wide text-zebra-mute">ZEBRA</p>
          <h1 className="font-display text-2xl font-bold uppercase tracking-wide text-zebra-ice">News</h1>
        </div>
        <span className="font-display text-base font-bold leading-none tracking-[0.18em] text-zebra-blue">
          1902
        </span>
      </header>

      <NewsFeed items={items} />
    </AppShell>
  );
}
