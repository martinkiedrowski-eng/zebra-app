import { MatchStats } from "@/types/matchCenter";

function StatRow({ label, home, away, suffix = "" }: { label: string; home: number; away: number; suffix?: string }) {
  const total = home + away || 1;
  const homePct = Math.round((home / total) * 100);

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between font-mono text-xs text-zebra-ice">
        <span>
          {home}
          {suffix}
        </span>
        <span className="font-text text-[11px] uppercase tracking-wide text-zebra-mute">{label}</span>
        <span>
          {away}
          {suffix}
        </span>
      </div>
      <div className="flex h-1.5 overflow-hidden rounded-pill bg-zebra-border">
        <div className="bg-zebra-blue" style={{ width: `${homePct}%` }} />
        <div className="flex-1 bg-zebra-mute-2" />
      </div>
    </div>
  );
}

export function MatchFactsGrid({ stats }: { stats: MatchStats }) {
  return (
    <div className="space-y-3 rounded-card border border-zebra-border bg-zebra-surface p-4">
      <StatRow label="Ballbesitz" home={stats.possession.home} away={stats.possession.away} suffix="%" />
      <StatRow label="Schüsse" home={stats.shots.home} away={stats.shots.away} />
      <StatRow label="Aufs Tor" home={stats.shotsOnTarget.home} away={stats.shotsOnTarget.away} />
      <StatRow label="Ecken" home={stats.corners.home} away={stats.corners.away} />
    </div>
  );
}
