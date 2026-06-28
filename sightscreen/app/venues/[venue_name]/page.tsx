import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BackLink, HeroCard, PageFrame, StatPill } from "@/app/components/section-shell";
import { VenuePageClient } from "@/app/venues/[venue_name]/venue-page-client";
import { getAllMatches } from "@/lib/data";
import { getAllVenues, getVenueStats } from "@/lib/match-aggregator";
import { formatAverage, formatLeagueLabel, slugifySegment } from "@/lib/utils";

export const dynamicParams = false;

function resolveVenueName(slug: string, venueNames: string[]) {
  return venueNames.find((venue) => slugifySegment(venue) === slug) ?? null;
}

export async function generateStaticParams() {
  const matches = await getAllMatches();
  return getAllVenues(matches).map((venue_name) => ({ venue_name: slugifySegment(venue_name) }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ venue_name: string }>;
}): Promise<Metadata> {
  const { venue_name } = await params;
  const matches = await getAllMatches();
  const venue = resolveVenueName(venue_name, getAllVenues(matches));

  return {
    title: venue ?? "Venue not found",
    description: venue
      ? `Venue history, scoring patterns, and team records for ${venue}.`
      : "Cricket analysis for the thinking fan.",
  };
}

export default async function VenueDetailPage({
  params,
}: {
  params: Promise<{ venue_name: string }>;
}) {
  const { venue_name } = await params;
  const matches = await getAllMatches();
  const venue = resolveVenueName(venue_name, getAllVenues(matches));

  if (!venue) {
    notFound();
  }

  const stats = getVenueStats(venue, matches);
  const venueMatches = matches.filter((match) => match.venue === venue);

  return (
    <PageFrame>
      <BackLink href="/venues">← Back to venues</BackLink>
      <HeroCard
        eyebrow="Venue Page"
        title={stats.venue}
        description={
          <p>
            All-time scoring levels, common matchups, and league context for this ground across{" "}
            {stats.leagues.map((league) => formatLeagueLabel(league)).join(", ")}.
          </p>
        }
        aside={
          <>
            <StatPill label="Matches" value={stats.matchesPlayed} />
            <StatPill label="Avg Score" value={formatAverage(stats.avgScore)} />
            <StatPill
              label="Leagues"
              value={stats.leagues.map((league) => formatLeagueLabel(league)).join(", ")}
            />
          </>
        }
      />
      <VenuePageClient venue={venue} matches={venueMatches} />
    </PageFrame>
  );
}
