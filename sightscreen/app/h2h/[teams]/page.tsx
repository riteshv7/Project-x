import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { MatchCard } from "@/app/components/match-card";
import { BackLink, HeroCard, PageFrame, StatPill } from "@/app/components/section-shell";
import { TableCard } from "@/app/components/table-card";
import { getAllMatches } from "@/lib/data";
import { getAllH2HPairs, getH2HStats } from "@/lib/match-aggregator";
import { formatAverage, formatPercentage } from "@/lib/utils";

export const dynamicParams = false;

export async function generateStaticParams() {
  const matches = await getAllMatches();
  return getAllH2HPairs(matches).map(({ slug }) => ({ teams: slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ teams: string }>;
}): Promise<Metadata> {
  const { teams } = await params;
  const matches = await getAllMatches();
  const pair = getAllH2HPairs(matches).find((entry) => entry.slug === teams);

  if (!pair) {
    return { title: "Head to head not found" };
  }

  return {
    title: `${pair.team1} vs ${pair.team2}`,
    description: `Complete IPL head-to-head record for ${pair.team1} and ${pair.team2}.`,
  };
}

export default async function H2HPage({
  params,
}: {
  params: Promise<{ teams: string }>;
}) {
  const { teams } = await params;
  const matches = await getAllMatches();
  const pair = getAllH2HPairs(matches).find((entry) => entry.slug === teams);

  if (!pair) {
    notFound();
  }

  const stats = getH2HStats(pair.team1, pair.team2, matches);

  return (
    <PageFrame>
      <BackLink href={`/teams/${stats.summaries[0].slug}`}>← Back to team page</BackLink>
      <HeroCard
        eyebrow="Head To Head"
        title={`${stats.team1} vs ${stats.team2}`}
        description={<p>Complete record, split both ways, with the full series history by season.</p>}
        aside={
          <>
            <StatPill label="Matches" value={stats.matchesPlayed} />
            <StatPill label={stats.team1} value={formatPercentage(stats.summaries[0].winPct)} />
            <StatPill label={stats.team2} value={formatPercentage(stats.summaries[1].winPct)} />
          </>
        }
      />

      <section className="mt-8 grid gap-6 xl:grid-cols-2">
        {stats.summaries.map((summary) => (
          <TableCard key={summary.slug} title="Summary" subtitle={summary.teamName}>
            <table className="min-w-full divide-y divide-card-border text-sm">
              <tbody className="divide-y divide-card-border bg-white/55">
                <tr><td className="px-4 py-3 text-muted">Matches</td><td className="px-4 py-3 text-foreground">{summary.matchesPlayed}</td></tr>
                <tr><td className="px-4 py-3 text-muted">Wins</td><td className="px-4 py-3 text-foreground">{summary.wins}</td></tr>
                <tr><td className="px-4 py-3 text-muted">Losses</td><td className="px-4 py-3 text-foreground">{summary.losses}</td></tr>
                <tr><td className="px-4 py-3 text-muted">Win %</td><td className="px-4 py-3 text-foreground">{formatPercentage(summary.winPct)}</td></tr>
                <tr><td className="px-4 py-3 text-muted">Avg Score</td><td className="px-4 py-3 text-foreground">{formatAverage(summary.avgScore)}</td></tr>
                <tr><td className="px-4 py-3 text-muted">Avg Opposition</td><td className="px-4 py-3 text-foreground">{formatAverage(summary.avgOppositionScore)}</td></tr>
              </tbody>
            </table>
          </TableCard>
        ))}
      </section>

      <section className="mt-8">
        <TableCard title="Series Breakdown" subtitle="Season by season">
          <table className="min-w-full divide-y divide-card-border text-sm">
            <thead className="bg-white/80 text-left text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Season</th>
                <th className="px-4 py-3 font-medium">Matches</th>
                <th className="px-4 py-3 font-medium">{stats.team1} W</th>
                <th className="px-4 py-3 font-medium">{stats.team2} W</th>
                <th className="px-4 py-3 font-medium">Ties</th>
                <th className="px-4 py-3 font-medium">{stats.team1} Win %</th>
                <th className="px-4 py-3 font-medium">{stats.team2} Win %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-card-border bg-white/55">
              {stats.seriesBreakdown.map((row) => (
                <tr key={row.season}>
                  <td className="px-4 py-3 font-medium text-foreground">{row.season}</td>
                  <td className="px-4 py-3 text-foreground">{row.matchesPlayed}</td>
                  <td className="px-4 py-3 text-foreground">{row.team1Wins}</td>
                  <td className="px-4 py-3 text-foreground">{row.team2Wins}</td>
                  <td className="px-4 py-3 text-foreground">{row.ties}</td>
                  <td className="px-4 py-3 text-foreground">{formatPercentage(row.team1WinPct)}</td>
                  <td className="px-4 py-3 text-foreground">{formatPercentage(row.team2WinPct)}</td>
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
