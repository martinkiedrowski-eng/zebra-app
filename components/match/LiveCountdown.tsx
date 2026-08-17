"use client";

import { useEffect, useState } from "react";
import { formatCountdown } from "@/lib/format";

const ONE_HOUR_MS = 60 * 60 * 1000;

function formatMMSS(diffMs: number): string {
  const totalSeconds = Math.max(0, Math.floor(diffMs / 1000));
  const mm = Math.floor(totalSeconds / 60);
  const ss = totalSeconds % 60;
  return `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
}

/**
 * Countdown vor einem MSV-Spiel (Polish Sprint 01, Punkt 8).
 *
 * > 60 Min entfernt: die bestehende kompakte formatCountdown()-Anzeige
 * (Tg/Std/Min), unverändert.
 * <= 60 Min entfernt: echter, clientseitig sekündlich aktualisierter
 * Countdown (MM:SS) — rein clientseitig (lokale Date-Arithmetik), kein
 * zusätzlicher API-Request.
 *
 * Setzt NIEMALS selbst den Matchstatus auf LIVE — reine Anzeige. Ob ein
 * Spiel tatsächlich live ist, entscheidet ausschließlich die bestehende
 * Match-/Providerlogik (mapStatus.ts) an anderer Stelle, weil Anstoß sich
 * verspäten kann.
 */
export function LiveCountdown({ kickoffIso }: { kickoffIso: string }) {
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const diffMs = new Date(kickoffIso).getTime() - nowMs;

  if (!Number.isFinite(diffMs) || diffMs > ONE_HOUR_MS) {
    // suppressHydrationWarning: minimale, harmlose Abweichung zwischen
    // Server- und Client-"jetzt" bei einer reinen Live-Uhr ist erwartbar
    // und unschädlich (Standardmuster für tickende Countdowns in React).
    return <span suppressHydrationWarning>{formatCountdown(kickoffIso)}</span>;
  }

  return <span suppressHydrationWarning>{formatMMSS(diffMs)}</span>;
}
