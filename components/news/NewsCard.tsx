import { NewsItem } from "@/types/news";

const CATEGORY_LABEL: Record<NewsItem["category"], string> = {
  top: "Top",
  msv: "MSV",
  transfers: "Transfers",
  verletzungen: "Verletzungen",
  spieltag: "Spieltag",
  interviews: "Interviews",
  dritteliga: "3. Liga",
};

function timeAgo(iso: string): string {
  const diffMin = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (diffMin < 60) return `vor ${diffMin} Min`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return `vor ${diffH} Std`;
  return `vor ${Math.round(diffH / 24)} Tg`;
}

export function NewsCard({ item }: { item: NewsItem }) {
  return (
    <a
      href={item.sourceUrl}
      className="block w-64 flex-shrink-0 rounded-card border border-zebra-border bg-zebra-surface p-3.5 transition-colors hover:border-zebra-blue/50"
    >
      <span className="inline-flex items-center rounded-pill bg-zebra-blue-dim px-2 py-0.5 font-text text-[10px] font-medium uppercase tracking-wide text-zebra-blue">
        {CATEGORY_LABEL[item.category]}
      </span>
      <h3 className="mt-2 font-display text-sm font-bold leading-snug text-zebra-ice">
        {item.headline}
      </h3>
      <p className="mt-1.5 line-clamp-2 font-text text-xs leading-relaxed text-zebra-mute">
        {item.teaser}
      </p>
      <p className="mt-2 font-text text-[11px] text-zebra-mute-2">
        {item.source} · {timeAgo(item.publishedAt)}
      </p>
    </a>
  );
}
