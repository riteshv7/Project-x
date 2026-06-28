import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { LeagueBadge } from "@/app/components/league-badge";
import { MatchCard } from "@/app/components/match-card";
import { BackLink, HeroCard, PageFrame, StatPill } from "@/app/components/section-shell";
import { TableCard } from "@/app/components/table-card";
import { getAllMatches } from "@/lib/data";
import { getLeagueBySlug } from "@/lib/league";
import { getAllLeagues, getLeagueMetadata, getLeagueStats } from "@/lib/match-aggregator";
import { formatAverage, formatLeagueLabel, formatPercentage } from "@/lib/utils";

export const dynamicParams = false;

export async function generateStaticParams() {
  const matches = await getAllMatches();
  return getAllLeagues(matches).map((league) => ({ league: getLeagueMetadata(league).slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ league: string }>;
}): Promise<Metadata> {
  const { league } = await params;
  const leagueCode = getLeagueBySlug(league);

  if (!leagueCode) {
    return { title: "League not found" };
  }

  const metadata = getLeagueMetadata(leagueCode);
  return {
    title: metadata.name,
    description: metadata.description,
  };
}

export default async function LeagueDetailPage({
  params,
}: {
  params: Promise<{ league: string }>;
}) {
  const { league } = await params;
  const matches = await getAllMatches();
  const leagueCode = getLeagueBySlug(league);

  if (!leagueCode) {
    notFound();
  }

  const stats = getLeagueStats(leagueCode, matches);

  return (
    <PageFrame>
      <BackLink href="/leagues">← Back to leagues</BackLink>
      <HeroCard
        eyebrow="League Detail"
        title={stats.metadata.name}
        description={
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <LeagueBadge league={leagueCode} />
              <span className="text-sm font-medium text-muted">{formatLeagueLabel(leagueCode)}</span>
            </div>
            <p>{stats.metadata.description}</p>
          </div>
        }
        aside={
          <>
            <StatPill label="Matches" value={stats.matchesPlayed} />
            <StatPill label="Teams" value={stats.teams.length} />
            <StatPill label="Seasons" value={stats.seasons.length} />
            <StatPill label="Coverage" value={`${stats.seasons.at(-1)}-${stats.seasons[0]}`} />
          </>
        }
      />

      <section className="mt-8">
        <TableCard title="All-Time Leaderboard" subtitle="One row per team">
          <table className="min-w-full divide-y divide-card-border text-sm">
            <thead className="bg-white/80 text-left text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Team</th>
                <th className="px-4 py-3 font-medium">Matches</th>
                <th className="px-4 py-3 font-medium">Wins</th>
                <th className="px-4 py-3 font-medium">Losses</th>
                <th className="px-4 py-3 font-medium">Win %</th>
                <th className="px-4 py-3 font-medium">Avg Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-card-border bg-white/55">
              {stats.leaderboard.map((team) => (
                <tr key={team.slug}>
                  <td className="px-4 py-3 font-medium text-foreground">
                    <Link href={`/teams/${team.slug}`} className="transition hover:text-accent-ink">
                      {team.teamName}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-foreground">{team.matchesPlayed}</td>
                  <td className="px-4 py-3 text-foreground">{team.wins}</td>
                  <td className="px-4 py-3 text-foreground">{team.losses}</td>
                  <td className="px-4 py-3 text-foreground">{formatPercentage(team.winPct)}</td>
                  <td className="px-4 py-3 text-foreground">{formatAverage(team.avgScore)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableCard>
      </section>

      <section className="mt-8">
        <TableCard title="Season Breakdown" subtitle="League coverage by season">
          <table className="min-w-full divide-y divide-card-border text-sm">
            <thead className="bg-white/80 text-left text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Season</th>
                <th className="px-4 py-3 font-medium">Matches</th>
                <th className="px-4 py-3 font-medium">Teams</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-card-border bg-white/55">
              {stats.seasonBreakdown.map((seasonRow) => (
                <tr key={seasonRow.season}>
                  <td className="px-4 py-3 font-medium text-foreground">
                    <Link
                      href={`/seasons/${stats.metadata.slug}/${seasonRow.season}`}
                      className="transition hover:text-accent-ink"
                    >
                      {formatLeagueLabel(leagueCode)} {seasonRow.season}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-foreground">{seasonRow.matchesPlayed}</td>
                  <td className="px-4 py-3 text-foreground">{seasonRow.teams}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableCard>
      </section>

      <section className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {stats.matchSummaries.map((match) => (
          <MatchCard key={match.match_id} match={match} />
        ))}
      </section>
    </PageFrame>
  );
}
