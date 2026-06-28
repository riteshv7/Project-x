import Link from "next/link";

import { HeroCard, PageFrame, StatPill } from "@/app/components/section-shell";
import { getAllMatches } from "@/lib/data";
import { getAllSeasons, getSeasonStats } from "@/lib/match-aggregator";

export default async function SeasonsPage() {
  const matches = await getAllMatches();
  const seasons = getAllSeasons(matches);

  return (
    <PageFrame>
      <HeroCard
        eyebrow="Browse Seasons"
        title="IPL seasons, one archive at a time"
        description={<p>Open any year to see the seasonal leaderboard and the full schedule.</p>}
        aside={
          <>
            <StatPill label="Seasons" value={seasons.length} />
            <StatPill label="Matches" value={matches.length} />
          </>
        }
      />

      <section className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {seasons.map((season) => {
          const stats = getSeasonStats(season, matches);
          return (
            <Link
              key={season}
              href={`/seasons/${season}`}
              className="glass-card rounded-[1.75rem] p-6 transition duration-200 hover:-translate-y-1 hover:border-accent/30"
            >
              <p className="section-title">Season</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-accent-ink">
                IPL {season}
              </h2>
              <div className="mt-6 grid gap-3 text-sm text-muted sm:grid-cols-2">
                <StatPill label="Matches" value={stats.matchesPlayed} />
                <StatPill label="Teams" value={stats.leaderboard.length} />
              </div>
            </Link>
          );
        })}
      </section>
    </PageFrame>
  );
}
