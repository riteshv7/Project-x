import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { LeagueBadge } from "@/app/components/league-badge";
import { MatchCard } from "@/app/components/match-card";
import { BackLink, HeroCard, PageFrame, StatPill } from "@/app/components/section-shell";
import { TableCard } from "@/app/components/table-card";
import { getAllMatches } from "@/lib/data";
import { getLeagueBySlug } from "@/lib/league";
import {
  getAllLeagues,
  getLeagueMetadata,
  getSeasonStats,
  getSeasonsByLeague,
} from "@/lib/match-aggregator";
import { formatAverage, formatLeagueLabel, formatPercentage } from "@/lib/utils";

export const dynamicParams = false;

export async function generateStaticParams() {
  const matches = await getAllMatches();
  return getAllLeagues(matches).flatMap((league) =>
    getSeasonsByLeague(league, matches).map((season) => ({
      league: getLeagueMetadata(league).slug,
      season,
    })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ league: string; season: string }>;
}): Promise<Metadata> {
  const { league, season } = await params;
  const leagueCode = getLeagueBySlug(league);

  if (!leagueCode) {
    return { title: "Season not found" };
  }

  return {
    title: `${formatLeagueLabel(leagueCode)} ${season}`,
    description: `Season leaderboard and match archive for ${formatLeagueLabel(leagueCode)} ${season}.`,
  };
}

export default async function LeagueSeasonDetailPage({
  params,
}: {
  params: Promise<{ league: string; season: string }>;
}) {
  const { league, season } = await params;
  const matches = await getAllMatches();
  const leagueCode = getLeagueBySlug(league);

  if (!leagueCode) {
    notFound();
  }

  const stats = getSeasonStats(season, matches, leagueCode);
  if (stats.matchesPlayed === 0) {
    notFound();
  }

  return (
    <PageFrame>
      <BackLink href="/seasons">← Back to seasons</BackLink>
      <HeroCard
        eyebrow="Season Page"
        title={`${formatLeagueLabel(leagueCode)} ${season}`}
        description={
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <LeagueBadge league={leagueCode} />
              <span className="text-sm font-medium text-muted">{getLeagueMetadata(leagueCode).name}</span>
            </div>
            <p>{stats.matchesPlayed} matches, filtered to {formatLeagueLabel(leagueCode)} {season} only.</p>
          </div>
        }
        aside={
          <>
            <StatPill label="Matches" value={stats.matchesPlayed} />
            <StatPill label="Teams" value={stats.leaderboard.length} />
          </>
        }
      />

      <section className="mt-8">
        <TableCard title="Leaderboard" subtitle="Season table">
          <table className="min-w-full divide-y divide-card-border text-sm">
            <thead className="bg-white/80 text-left text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Team</th>
                <th className="px-4 py-3 font-medium">Matches</th>
                <th className="px-4 py-3 font-medium">Wins</th>
                <th className="px-4 py-3 font-medium">Losses</th>
                <th className="px-4 py-3 font-medium">Win %</th>
                <th className="px-4 py-3 font-medium">Avg Score</th>
                <th className="px-4 py-3 font-medium">Avg Opposition</th>
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
                  <td className="px-4 py-3 text-foreground">
                    {formatAverage(team.avgOppositionScore)}
                  </td>
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
