import { AppShell } from "@/components/layout/AppShell";
import { BackLink } from "@/components/mehr/BackLink";
import { NewsFeedCard } from "@/components/news/NewsFeedCard";
import { fetchYoutubeNews } from "@/lib/newsFeed/sources/youtube";

// Nutzt ausschließlich den bereits bestehenden YouTube-Source-Adapter
// (lib/newsFeed/sources/youtube.ts) — keine zweite YouTube-Implementierung,
// kein neuer Feed, keine YouTube-spezifische Fetch-Logik hier in der UI.
// Rendering über die bereits bestehende NewsFeedCard-Komponente (variant
// "list"), dieselbe, die auch die News-Seite verwendet — kein neuer
// Card-Typ nötig.
//
// force-dynamic (ZEBRA-1.0-Regressionsfix): siehe app/news/page.tsx für
// die ausführliche Begründung — identisches Problem, identischer Fix.
export const dynamic = "force-dynamic";

export default async function ZebraTvPage() {
  const items = await fetchYoutubeNews();

  return (
    <AppShell>
      <BackLink />
      <header className="mb-4">
        <p className="font-text text-xs uppercase tracking-wide text-zebra-mute">ZEBRA</p>
        <h1 className="font-display text-2xl font-bold uppercase tracking-wide text-zebra-ice">ZebraTV</h1>
      </header>

      {items.length === 0 ? (
        <div className="rounded-card border border-zebra-border bg-zebra-surface p-6 text-center">
          <p className="font-text text-sm text-zebra-mute">Gerade sind keine Videos verfügbar.</p>
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
