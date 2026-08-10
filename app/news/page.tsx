import { AppShell } from "@/components/layout/AppShell";
import { NewsFeedCard } from "@/components/news/NewsFeedCard";
import { getAggregatedNews } from "@/lib/newsFeed/aggregate";

// Server Component: aggregiert MSV Duisburg (offiziell), ZebraTV/YouTube
// und liga3-online.de zu einem gemeinsamen, chronologischen Feed. Keine
// künstliche Auswahl "wichtiger" News, kein redaktionelles Ranking —
// neueste zuerst, das war's. Fällt eine Quelle aus, fehlen einfach ihre
// Einträge; technische Details dazu stehen ausschließlich unter
// /debug/content-sources, nicht hier.
export default async function NewsPage() {
  const items = await getAggregatedNews();

  return (
    <AppShell>
      <header className="mb-4">
        <p className="font-text text-xs uppercase tracking-wide text-zebra-mute">ZEBRA</p>
        <h1 className="font-display text-2xl font-bold uppercase tracking-wide text-zebra-ice">News</h1>
      </header>

      {items.length === 0 ? (
        <div className="rounded-card border border-zebra-border bg-zebra-surface p-6 text-center">
          <p className="font-text text-sm text-zebra-mute">
            Gerade sind keine News verfügbar. Schau bald wieder vorbei.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {items.map((item) => (
            <NewsFeedCard key={item.id} item={item} variant="list" />
          ))}
        </div>
      )}
    </AppShell>
  );
}
