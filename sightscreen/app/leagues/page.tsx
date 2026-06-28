import Link from "next/link";

import { LeagueBadge } from "@/app/components/league-badge";
import { HeroCard, PageFrame, StatPill } from "@/app/components/section-shell";
import { getAllMatches } from "@/lib/data";
import { getAllLeagues, getLeagueStats } from "@/lib/match-aggregator";
import { formatLeagueLabel } from "@/lib/utils";

export default async function LeaguesPage() {
  const matches = await getAllMatches();
  const leagues = getAllLeagues(matches);
  const leagueCards = leagues.map((league) => getLeagueStats(league, matches));

  return (
    <PageFrame>
      <HeroCard
        eyebrow="Browse Leagues"
        title="Five leagues, one Sightscreen archive"
        description={<p>Open any competition to see teams, seasons, all-time performance, and every match in the data bundle.</p>}
        aside={
          <>
            <StatPill label="Leagues" value={leagueCards.length} />
            <StatPill label="Matches" value={matches.length} />
          </>
        }
      />

      <section className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {leagueCards.map((league) => (
          <Link
            key={league.metadata.code}
            href={`/leagues/${league.metadata.slug}`}
            className="glass-card rounded-[1.75rem] p-6 transition duration-200 hover:-translate-y-1 hover:border-accent/30"
          >
            <div className="flex items-center gap-3">
              <LeagueBadge league={league.metadata.code} />
              <p className="section-title">{formatLeagueLabel(league.metadata.code)}</p>
            </div>
            <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-accent-ink">
              {league.metadata.name}
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted">{league.metadata.description}</p>
            <div className="mt-6 grid gap-3 text-sm text-muted sm:grid-cols-2">
              <StatPill label="Matches" value={league.matchesPlayed} />
              <StatPill label="Teams" value={league.teams.length} />
              <StatPill label="Seasons" value={league.seasons.length} />
              <StatPill label="Range" value={`${league.seasons.at(-1)}-${league.seasons[0]}`} />
            </div>
          </Link>
        ))}
      </section>
    </PageFrame>
  );
}
