import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { MatchCard } from "@/app/components/match-card";
import { BackLink, HeroCard, PageFrame, StatPill } from "@/app/components/section-shell";
import { TableCard } from "@/app/components/table-card";
import { getAllMatches } from "@/lib/data";
import { getAllVenues, getVenueStats } from "@/lib/match-aggregator";
import { formatAverage, formatPercentage, slugifySegment } from "@/lib/utils";

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

  return (
    <PageFrame>
      <BackLink href="/venues">← Back to venues</BackLink>
      <HeroCard
        eyebrow="Venue Page"
        title={stats.venue}
        description={<p>All-time scoring levels, common matchups, and team records at this ground.</p>}
        aside={
          <>
            <StatPill label="Matches" value={stats.matchesPlayed} />
            <StatPill label="Avg Score" value={formatAverage(stats.avgScore)} />
            <StatPill
              label="Home Team"
              value={stats.homeTeam ? `${stats.homeTeam.teamName} (${formatPercentage(stats.homeTeam.winPct)})` : "—"}
            />
            <StatPill
              label="Common Pairing"
              value={
                stats.mostCommonPairing
                  ? `${stats.mostCommonPairing.label} (${stats.mostCommonPairing.matchesPlayed})`
                  : "—"
              }
            />
          </>
        }
      />

      <section className="mt-8">
        <TableCard title="Venue Table" subtitle="Team performance at this venue">
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
              {stats.teamPerformance.map((team) => (
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

      <section className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {stats.matchSummaries.map((match) => (
          <MatchCard key={match.match_id} match={match} />
        ))}
      </section>
    </PageFrame>
  );
}
