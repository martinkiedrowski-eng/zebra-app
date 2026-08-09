import { NewsItem } from "@/types/news";
import { NewsCard } from "./NewsCard";

export function TopNews({ items }: { items: NewsItem[] }) {
  return (
    <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
      {items.map((item) => (
        <NewsCard key={item.id} item={item} />
      ))}
    </div>
  );
}
