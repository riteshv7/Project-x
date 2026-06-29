import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BackLink, PageFrame } from "@/app/components/section-shell";
import { getAllMatches } from "@/lib/data";
import { getAllTeams } from "@/lib/match-aggregator";
import { getTeamAnalytics } from "@/lib/team-analytics";
import { slugifySegment } from "@/lib/utils";

export const dynamicParams = false;

function resolveTeamName(slug: string, teamNames: string[]) {
  return teamNames.find((teamName) => slugifySegment(teamName) === slug) ?? null;
}

export async function generateStaticParams() {
  const matches = await getAllMatches();
  return getAllTeams(matches).map((teamName) => ({ team_name: slugifySegment(teamName) }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ team_name: string }>;
}): Promise<Metadata> {
  const { team_name } = await params;
  const matches = await getAllMatches();
  const teamName = resolveTeamName(team_name, getAllTeams(matches));

  if (!teamName) {
    return { title: "Team analytics not found" };
  }

  return {
    title: `${teamName} analytics`,
    description: `Batting, bowling, home-away, and season trend analytics for ${teamName}.`,
  };
}

export default async function TeamAnalyticsPage({
  params,
}: {
  params: Promise<{ team_name: string }>;
}) {
  const { team_name } = await params;
  const matches = await getAllMatches();
  const teamName = resolveTeamName(team_name, getAllTeams(matches));

  if (!teamName) {
    notFound();
  }

  const analytics = getTeamAnalytics(teamName, matches);
  const { TeamAnalyticsClient } = await import(
    "@/app/teams/[team_name]/analytics/team-analytics-client"
  );

  return (
    <PageFrame>
      <BackLink href={`/teams/${team_name}`}>← Back to team page</BackLink>
      <TeamAnalyticsClient analytics={analytics} />
    </PageFrame>
  );
}
