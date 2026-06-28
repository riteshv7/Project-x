import Link from "next/link";

import { HeroCard, PageFrame, StatPill } from "@/app/components/section-shell";
import { getAllMatches } from "@/lib/data";
import { getAllVenues, getVenueStats } from "@/lib/match-aggregator";

export default async function VenuesPage() {
  const matches = await getAllMatches();
  const venues = getAllVenues(matches);

  return (
    <PageFrame>
      <HeroCard
        eyebrow="Browse Venues"
        title="Every ground in the archive"
        description={<p>Browse venue-specific records, scoring levels, and team performance.</p>}
        aside={
          <>
            <StatPill label="Venues" value={venues.length} />
            <StatPill label="Matches" value={matches.length} />
          </>
        }
      />

      <section className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {venues.map((venue) => {
          const stats = getVenueStats(venue, matches);
          return (
            <Link
              key={stats.slug}
              href={`/venues/${stats.slug}`}
              className="glass-card rounded-[1.75rem] p-6 transition duration-200 hover:-translate-y-1 hover:border-accent/30"
            >
              <p className="section-title">Venue</p>
              <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-accent-ink">
                {venue}
              </h2>
              <div className="mt-6 grid gap-3 text-sm text-muted sm:grid-cols-2">
                <StatPill label="Matches" value={stats.matchesPlayed} />
                <StatPill label="Avg Score" value={stats.avgScore.toFixed(1)} />
              </div>
            </Link>
          );
        })}
      </section>
    </PageFrame>
  );
}
