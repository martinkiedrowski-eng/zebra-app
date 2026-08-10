import { NewsFeedItem } from "@/types/newsFeed";
import { NewsFeedCard } from "./NewsFeedCard";

export function NewsFeedRow({ items }: { items: NewsFeedItem[] }) {
  return (
    <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
      {items.map((item) => (
        <NewsFeedCard key={item.id} item={item} variant="row" />
      ))}
    </div>
  );
}
