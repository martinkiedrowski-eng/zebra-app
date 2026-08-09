import { MatchContentItem, MatchContentType } from "@/types/matchCenter";

const LABEL: Record<MatchContentType, string> = {
  vorbericht: "Vorbericht",
  pressekonferenz: "Pressekonferenz",
  interview: "Interview",
  spielbericht: "Spielbericht",
  highlights: "Highlights",
};

export function MatchContentList({ items }: { items: MatchContentItem[] }) {
  return (
    <div className="grid grid-cols-1 gap-2">
      {items.map((item) => (
        <a
          key={item.id}
          href={item.sourceUrl}
          className="flex items-center justify-between rounded-card border border-zebra-border bg-zebra-surface px-4 py-3 transition-colors hover:border-zebra-blue/50"
        >
          <div className="min-w-0">
            <span className="inline-block rounded-pill bg-zebra-blue-dim px-2 py-0.5 font-text text-[10px] font-medium uppercase tracking-wide text-zebra-blue">
              {LABEL[item.type]}
            </span>
            <p className="mt-1.5 truncate font-text text-sm text-zebra-ice">{item.title}</p>
          </div>
        </a>
      ))}
    </div>
  );
}
