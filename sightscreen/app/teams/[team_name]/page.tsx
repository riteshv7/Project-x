import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BackLink, PageFrame } from "@/app/components/section-shell";
import { TeamPageClient } from "@/app/teams/[team_name]/team-page-client";
import { getAllMatches } from "@/lib/data";
import { getAllTeams, getTeamStats } from "@/lib/match-aggregator";
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
    return { title: "Team not found" };
  }

  return {
    title: teamName,
    description: `Lifetime IPL record, season breakdown, and match archive for ${teamName}.`,
  };
}

export default async function TeamDetailPage({
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

  const stats = getTeamStats(teamName, matches);

  return (
    <PageFrame>
      <BackLink href="/teams">← Back to teams</BackLink>
      <TeamPageClient stats={stats} />
    </PageFrame>
  );
}
