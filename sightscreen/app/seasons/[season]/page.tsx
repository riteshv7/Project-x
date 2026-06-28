import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { LeagueBadge } from "@/app/components/league-badge";
import { BackLink, HeroCard, PageFrame, StatPill } from "@/app/components/section-shell";
import { getAllMatches } from "@/lib/data";
import { getAllLeagues, getLeagueMetadata, getSeasonStats } from "@/lib/match-aggregator";
import { formatLeagueLabel } from "@/lib/utils";

export const dynamicParams = false;

export async function generateStaticParams() {
  const matches = await getAllMatches();
  const seasons = Array.from(new Set(matches.map((match) => new Date(match.date).getUTCFullYear().toString())));
  return seasons.sort((a, b) => Number(b) - Number(a)).map((season) => ({ season }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ season: string }>;
}): Promise<Metadata> {
  const { season } = await params;
  return {
    title: `${season} seasons`,
    description: `League chooser for ${season} across the Sightscreen archive.`,
  };
}

export default async function SeasonChooserPage({
  params,
}: {
  params: Promise<{ season: string }>;
}) {
  const { season } = await params;
  const matches = await getAllMatches();
  const options = getAllLeagues(matches)
    .map((league) => ({
      league,
      stats: getSeasonStats(season, matches, league),
    }))
    .filter((entry) => entry.stats.matchesPlayed > 0);

  if (options.length === 0) {
    notFound();
  }

  return (
    <PageFrame>
      <BackLink href="/seasons">← Back to seasons</BackLink>
      <HeroCard
        eyebrow="Season Picker"
        title={`Choose a league for ${season}`}
        description={<p>The same year can exist in multiple competitions. Pick the league-specific season page you want.</p>}
        aside={
          <>
            <StatPill label="Leagues" value={options.length} />
            <StatPill label="Total Matches" value={options.reduce((sum, option) => sum + option.stats.matchesPlayed, 0)} />
          </>
        }
      />

      <section className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {options.map(({ league, stats }) => (
          <Link
            key={league}
            href={`/seasons/${getLeagueMetadata(league).slug}/${season}`}
            className="glass-card rounded-[1.75rem] p-6 transition duration-200 hover:-translate-y-1 hover:border-accent/30"
          >
            <div className="flex items-center gap-3">
              <LeagueBadge league={league} />
              <p className="section-title">{formatLeagueLabel(league)}</p>
            </div>
            <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-accent-ink">
              {formatLeagueLabel(league)} {season}
            </h2>
            <div className="mt-6 grid gap-3 text-sm text-muted sm:grid-cols-2">
              <StatPill label="Matches" value={stats.matchesPlayed} />
              <StatPill label="Teams" value={stats.leaderboard.length} />
            </div>
          </Link>
        ))}
      </section>
    </PageFrame>
  );
}
