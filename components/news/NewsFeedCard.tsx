import { Video, Newspaper, Building2 } from "lucide-react";
import { NewsFeedItem } from "@/types/newsFeed";
import { formatNewsTime } from "@/lib/newsFeed/format";

const SOURCE_ICON = {
  official: Building2,
  video: Video,
  editorial: Newspaper,
} as const;

/**
 * Eine Karte, zwei Layouts über `variant`:
 * - "row": kompakt, feste Breite — für die horizontale Reihe auf Home
 * - "list": volle Breite, mit Teaser — für die vollständige News-Seite
 *
 * Fehlt ein Bild, wird kein Platzhalter gezeigt — die Karte funktioniert
 * bewusst auch rein textuell gut (siehe Vorgabe: kein kaputtes Bild, kein
 * generischer Fake-Placeholder).
 */
export function NewsFeedCard({ item, variant = "list" }: { item: NewsFeedItem; variant?: "row" | "list" }) {
  const Icon = SOURCE_ICON[item.sourceType];
  const isRow = variant === "row";

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`block rounded-card border border-zebra-border bg-zebra-surface transition-colors hover:border-zebra-blue/50 ${
        isRow ? "w-64 flex-shrink-0 p-3.5" : "w-full p-4"
      }`}
    >
      {!isRow && item.imageUrl && (
        <div className="-mx-4 -mt-4 mb-3 aspect-[16/9] overflow-hidden rounded-t-card">
          {/* eslint-disable-next-line @next/next/no-img-element -- externe, wechselnde Quellen-Domains */}
          <img src={item.imageUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
        </div>
      )}

      <div className="flex items-center gap-1.5">
        <Icon size={12} className="text-zebra-blue" aria-hidden="true" />
        <span className="font-text text-[11px] font-medium uppercase tracking-wide text-zebra-blue">
          {item.source}
        </span>
        {item.category && (
          <span className="rounded-pill bg-zebra-blue-dim px-2 py-0.5 font-text text-[10px] font-medium uppercase tracking-wide text-zebra-blue">
            {item.category}
          </span>
        )}
      </div>

      <h3
        className={`mt-2 font-display font-bold leading-snug text-zebra-ice ${isRow ? "text-sm" : "text-base"}`}
      >
        {item.title}
      </h3>

      {!isRow && item.teaser && (
        <p className="mt-1.5 line-clamp-2 font-text text-xs leading-relaxed text-zebra-mute">{item.teaser}</p>
      )}

      <p className="mt-2 font-text text-[11px] text-zebra-mute-2">{formatNewsTime(item.publishedAt)}</p>
    </a>
  );
}
