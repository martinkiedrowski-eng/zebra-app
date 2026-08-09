import { MatchLineup, MatchPlayer } from "@/types/matchCenter";
import { TeamRef } from "@/types/match";

function PlayerRow({ player }: { player: MatchPlayer }) {
  return (
    <div className="flex items-center gap-3 px-4 py-2">
      <span className="w-6 font-mono text-xs text-zebra-mute">{player.number}</span>
      <span className="flex-1 font-text text-sm text-zebra-ice">{player.name}</span>
      <span className="font-text text-[11px] uppercase tracking-wide text-zebra-mute">{player.position}</span>
    </div>
  );
}

function TeamLineup({ team, formation, starting, bench }: {
  team: TeamRef;
  formation?: string;
  starting: MatchPlayer[];
  bench: MatchPlayer[];
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="font-display text-sm font-bold uppercase tracking-wide text-zebra-ice">
          {team.shortName}
        </span>
        {formation && <span className="font-mono text-xs text-zebra-mute">{formation}</span>}
      </div>
      <div className="divide-y divide-zebra-border rounded-card border border-zebra-border bg-zebra-surface">
        {starting.map((p) => (
          <PlayerRow key={p.id} player={p} />
        ))}
      </div>
      {bench.length > 0 && (
        <>
          <p className="mb-2 mt-3 font-text text-[11px] uppercase tracking-wide text-zebra-mute">Bank</p>
          <div className="divide-y divide-zebra-border rounded-card border border-zebra-border bg-zebra-surface">
            {bench.map((p) => (
              <PlayerRow key={p.id} player={p} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function LineupList({
  lineup,
  homeTeam,
  awayTeam,
}: {
  lineup: MatchLineup;
  homeTeam: TeamRef;
  awayTeam: TeamRef;
}) {
  return (
    <div className="space-y-5">
      <TeamLineup
        team={homeTeam}
        formation={lineup.formationHome}
        starting={lineup.startingHome}
        bench={lineup.benchHome}
      />
      <TeamLineup
        team={awayTeam}
        formation={lineup.formationAway}
        starting={lineup.startingAway}
        bench={lineup.benchAway}
      />
    </div>
  );
}
