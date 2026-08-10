import { Video, Newspaper, Building2 } from "lucide-react";
import { NewsFeedItem } from "@/types/newsFeed";
import { formatNewsTime } from "@/lib/newsFeed/format";

const SOURCE_ICON = {
  official: Building2,
  video: Video,
  editorial: Newspaper,
} as const;

/**
 * Reiner Anzeige-Polish — keine Änderung an NewsFeedItem, an den
 * Adaptern oder am Aggregator. Zwei Layouts über `variant`:
 *
 * - "row": sehr kompakt, feste Breite, optionales quadratisches
 *   Thumbnail links — für die horizontale Reihe auf Home. Kein Teaser,
 *   keine Kategorie-Pille (weniger textlastig, schneller scanbar),
 *   Headline auf 2 Zeilen begrenzt.
 * - "list": volle Breite, mit Teaser und größerem Bild — für die
 *   vollständige News-Seite. Headline auf 3 Zeilen begrenzt, damit ein
 *   einzelner sehr langer Titel das Layout nicht sprengt.
 *
 * Fehlt ein Bild, wird kein Platzhalter gezeigt — die Karte funktioniert
 * bewusst auch rein textuell gut.
 */
export function NewsFeedCard({ item, variant = "list" }: { item: NewsFeedItem; variant?: "row" | "list" }) {
  const Icon = SOURCE_ICON[item.sourceType];
  const isRow = variant === "row";

  if (isRow) {
    return (
      <a
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex w-56 flex-shrink-0 items-start gap-2.5 rounded-card border border-zebra-border bg-zebra-surface p-2.5 transition-colors hover:border-zebra-blue/50"
      >
        {item.imageUrl && (
          <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-control bg-zebra-surface-raised">
            {/* eslint-disable-next-line @next/next/no-img-element -- externe, wechselnde Quellen-Domains */}
            <img src={item.imageUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-1">
            <Icon size={10} className="flex-shrink-0 text-zebra-blue" aria-hidden="true" />
            <span className="truncate font-text text-[10px] font-medium uppercase tracking-wide text-zebra-blue">
              {item.source}
            </span>
          </div>
          <h3 className="line-clamp-2 break-words font-display text-xs font-bold leading-snug text-zebra-ice">
            {item.title}
          </h3>
          <p className="mt-1 font-text text-[10px] text-zebra-mute-2">{formatNewsTime(item.publishedAt)}</p>
        </div>
      </a>
    );
  }

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block w-full rounded-card border border-zebra-border bg-zebra-surface p-4 transition-colors hover:border-zebra-blue/50"
    >
      {item.imageUrl && (
        <div className="-mx-4 -mt-4 mb-3 aspect-[16/9] overflow-hidden rounded-t-card bg-zebra-surface-raised">
          {/* eslint-disable-next-line @next/next/no-img-element -- externe, wechselnde Quellen-Domains */}
          <img src={item.imageUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
        </div>
      )}

      <div className="flex items-center gap-1.5">
        <Icon size={12} className="flex-shrink-0 text-zebra-blue" aria-hidden="true" />
        <span className="truncate font-text text-[11px] font-medium uppercase tracking-wide text-zebra-blue">
          {item.source}
        </span>
        {item.category && (
          <span className="flex-shrink-0 rounded-pill bg-zebra-blue-dim px-2 py-0.5 font-text text-[10px] font-medium uppercase tracking-wide text-zebra-blue">
            {item.category}
          </span>
        )}
      </div>

      <h3 className="mt-2 line-clamp-3 break-words font-display text-base font-bold leading-snug text-zebra-ice">
        {item.title}
      </h3>

      {item.teaser && (
        <p className="mt-1.5 line-clamp-2 font-text text-xs leading-relaxed text-zebra-mute">{item.teaser}</p>
      )}

      <p className="mt-2 font-text text-[11px] text-zebra-mute-2">{formatNewsTime(item.publishedAt)}</p>
    </a>
  );
}
