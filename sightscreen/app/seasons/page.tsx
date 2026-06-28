import Link from "next/link";

import { LeagueBadge } from "@/app/components/league-badge";
import { HeroCard, PageFrame, StatPill } from "@/app/components/section-shell";
import { getAllMatches } from "@/lib/data";
import { getAllLeagues, getLeagueMetadata, getLeagueStats } from "@/lib/match-aggregator";
import { formatLeagueLabel } from "@/lib/utils";

export default async function SeasonsPage() {
  const matches = await getAllMatches();
  const leagues = getAllLeagues(matches);

  return (
    <PageFrame>
      <HeroCard
        eyebrow="Browse Seasons"
        title="League-specific seasons"
        description={<p>Seasons are scoped by league. Open a competition first, then jump into the exact year you want.</p>}
        aside={
          <>
            <StatPill
              label="League Seasons"
              value={leagues.reduce((sum, league) => sum + getLeagueStats(league, matches).seasons.length, 0)}
            />
            <StatPill label="Matches" value={matches.length} />
          </>
        }
      />

      <section className="mt-8 space-y-8">
        {leagues.map((league) => {
          const leagueStats = getLeagueStats(league, matches);
          return (
            <div key={league}>
              <div className="mb-4 flex items-center gap-3">
                <LeagueBadge league={league} />
                <h2 className="text-2xl font-semibold tracking-[-0.03em] text-accent-ink">
                  {formatLeagueLabel(league)}
                </h2>
              </div>
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {leagueStats.seasonBreakdown.map((seasonRow) => (
                  <Link
                    key={`${league}-${seasonRow.season}`}
                    href={`/seasons/${getLeagueMetadata(league).slug}/${seasonRow.season}`}
                    className="glass-card rounded-[1.75rem] p-6 transition duration-200 hover:-translate-y-1 hover:border-accent/30"
                  >
                    <p className="section-title">Season</p>
                    <h3 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-accent-ink">
                      {formatLeagueLabel(league)} {seasonRow.season}
                    </h3>
                    <div className="mt-6 grid gap-3 text-sm text-muted sm:grid-cols-2">
                      <StatPill label="Matches" value={seasonRow.matchesPlayed} />
                      <StatPill label="Teams" value={seasonRow.teams} />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </section>
    </PageFrame>
  );
}
