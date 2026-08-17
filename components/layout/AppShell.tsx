import { Suspense } from "react";
import { BottomNav } from "./BottomNav";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zebra-void">
      {/* Content-Breite bewusst wie eine Karten-App begrenzt, kein
          erzwungenes Multi-Spalten-Dashboard-Raster auf Desktop (siehe
          Phase-2-Design-System, Abschnitt Spacing/Grid). */}
      <main className="mx-auto max-w-lg px-4 pb-24 pt-6 md:max-w-xl md:pt-10">{children}</main>
      {/* Suspense ist hier Next.js-Pflicht, seit BottomNav useSearchParams()
          nutzt (Polish Sprint 01, Punkt 5 — Navigationskontext), nicht
          optional. */}
      <Suspense fallback={null}>
        <BottomNav />
      </Suspense>
    </div>
  );
}
