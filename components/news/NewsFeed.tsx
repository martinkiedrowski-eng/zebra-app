"use client";

import { useState } from "react";
import { NewsFeedItem } from "@/types/newsFeed";
import { NewsFeedCard } from "./NewsFeedCard";
import { NewsFilterId, filterNewsFeed } from "@/lib/newsFeed/filters";

const FILTERS: { id: NewsFilterId; label: string }[] = [
  { id: "alle", label: "Alle" },
  { id: "msv", label: "MSV" },
  { id: "videos", label: "Videos" },
];

const EMPTY_MESSAGE: Record<NewsFilterId, string> = {
  alle: "Gerade sind keine News verfügbar. Schau bald wieder vorbei.",
  msv: "Keine MSV-News verfügbar.",
  videos: "Keine ZebraTV-Videos verfügbar.",
};

/**
 * Bekommt den kompletten, bereits aggregierten Feed EINMAL vom Server
 * (app/news/page.tsx::getAggregatedNews(), unverändert). Der Filter
 * arbeitet ausschließlich lokal auf diesem bereits geladenen Array —
 * kein erneuter Fetch, kein zweiter Aggregator-Aufruf, kein Query-
 * Parameter, kein persistierter Zustand. Beim erneuten Öffnen von /news
 * startet die Seite deshalb bewusst immer wieder bei "Alle".
 */
export function NewsFeed({ items }: { items: NewsFeedItem[] }) {
  const [filter, setFilter] = useState<NewsFilterId>("alle");
  const filtered = filterNewsFeed(items, filter);

  return (
    <>
      <div className="mb-4 flex gap-1 rounded-card border border-zebra-border bg-zebra-surface p-1">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`flex-1 rounded-control py-2 font-text text-sm font-medium ${
              filter === f.id ? "bg-zebra-blue text-zebra-ice" : "text-zebra-mute"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-card border border-zebra-border bg-zebra-surface p-6 text-center">
          <p className="font-text text-sm text-zebra-mute">{EMPTY_MESSAGE[filter]}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {filtered.map((item) => (
            <NewsFeedCard key={item.id} item={item} variant="list" />
          ))}
        </div>
      )}
    </>
  );
}
