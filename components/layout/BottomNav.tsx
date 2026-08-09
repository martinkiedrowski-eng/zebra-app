"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Newspaper, CalendarDays, ListOrdered, Menu } from "lucide-react";

const ITEMS = [
  { href: "/", label: "Heute", icon: Home },
  { href: "/news", label: "News", icon: Newspaper },
  { href: "/spiele", label: "Spiele", icon: CalendarDays },
  { href: "/3-liga", label: "3. Liga", icon: ListOrdered },
  { href: "/mehr", label: "Mehr", icon: Menu },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-20 border-t border-zebra-border bg-zebra-void/95 backdrop-blur"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Hauptnavigation"
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-between px-2">
        {ITEMS.map(({ href, label, icon: Icon }) => {
          // "/" darf nur bei exaktem Match aktiv sein, sonst wäre Heute
          // auch auf allen anderen Routen fälschlich aktiv.
          const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={isActive ? "page" : undefined}
                className="flex w-full flex-col items-center gap-1 py-2.5"
              >
                <span
                  className={`h-0.5 w-6 rounded-full ${isActive ? "bg-zebra-blue" : "bg-transparent"}`}
                  aria-hidden="true"
                />
                <Icon
                  size={22}
                  strokeWidth={2}
                  className={isActive ? "text-zebra-blue" : "text-zebra-mute"}
                />
                <span
                  className={`font-text text-[10px] font-medium ${
                    isActive ? "text-zebra-blue" : "text-zebra-mute"
                  }`}
                >
                  {label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
