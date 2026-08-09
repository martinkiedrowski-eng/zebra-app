import { AppShell } from "@/components/layout/AppShell";
import { MatchCenterView } from "@/components/matchcenter/MatchCenterView";
import { footballDataProvider, newsProvider, IS_MOCK_MODE } from "@/providers/registry";
import { MOCK_MATCH_LIVE, MOCK_MATCH_REPORT } from "@/mock/matchCenter";
import { MOCK_MATCHDAY_MATCHES, MOCK_MATCHDAY_MSV_FINISHED } from "@/mock/league";

interface MatchPageProps {
  params: { matchId: string };
}

// Server Component. Die Route kennt an keiner Stelle, wer der Gegner ist —
// sie löst zuerst das Match auf und lädt alle weiteren Daten ausschließlich
// anhand von match.homeTeam.id / match.awayTeam.id nach. Das funktioniert
// identisch für Mock und OpenLigaDB, weil beide Provider dasselbe Interface
// bedienen.
//
// Im Mock-Modus werden MOCK_MATCH_LIVE/MOCK_MATCH_REPORT sowie die
// Spieltag-Varianten weiterhin direkt importiert — ausschließlich für den
// Dev-Zustand-Umschalter in MatchCenterView. Im openligadb-Modus gibt es
// keine separaten Varianten: das reale Match und der reale aktuelle
// Spieltag sind bereits der einzige Zustand, den es gibt.
export default async function MatchCenterPage({ params }: MatchPageProps) {
  const { matchId } = params;

  const previewMatch = await footballDataProvider.getMatchById(matchId);

  if (!previewMatch) {
    return (
      <AppShell>
        <p className="font-text text-sm text-zebra-mute">Dieses Spiel wurde nicht gefunden.</p>
      </AppShell>
    );
  }

  const homeTeamId = previewMatch.homeTeam.id;
  const awayTeamId = previewMatch.awayTeam.id;

  const [homeTableEntry, awayTableEntry, homeForm, awayForm, availability, content, baselineTable, matchdayReal] =
    await Promise.all([
      footballDataProvider.getTeamTableEntry(homeTeamId),
      footballDataProvider.getTeamTableEntry(awayTeamId),
      footballDataProvider.getTeamForm(homeTeamId, 5),
      footballDataProvider.getTeamForm(awayTeamId, 5),
      footballDataProvider.getMatchAvailability(matchId),
      newsProvider.getMatchContent(matchId),
      footballDataProvider.getBaselineTable(),
      IS_MOCK_MODE ? Promise.resolve(null) : footballDataProvider.getCurrentMatchday(),
    ]);

  const liveMatch = IS_MOCK_MODE ? MOCK_MATCH_LIVE : previewMatch;
  const reportMatch = IS_MOCK_MODE ? MOCK_MATCH_REPORT : previewMatch;
  const matchdayLive = IS_MOCK_MODE ? MOCK_MATCHDAY_MATCHES : matchdayReal!.matches;
  const matchdayReport = IS_MOCK_MODE ? MOCK_MATCHDAY_MSV_FINISHED : matchdayReal!.matches;

  return (
    <AppShell>
      <MatchCenterView
        isMockMode={IS_MOCK_MODE}
        previewMatch={previewMatch}
        liveMatch={liveMatch}
        reportMatch={reportMatch}
        homeForm={homeForm}
        awayForm={awayForm}
        homeTableEntry={homeTableEntry}
        awayTableEntry={awayTableEntry}
        availability={availability}
        content={content}
        baselineTable={baselineTable}
        matchdayLive={matchdayLive}
        matchdayReport={matchdayReport}
      />
    </AppShell>
  );
}
