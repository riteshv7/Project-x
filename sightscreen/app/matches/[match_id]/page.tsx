import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { MatchDetailClient } from "@/app/matches/[match_id]/match-detail-client";
import { getMatch, getMatchIds } from "@/lib/data";

export const dynamicParams = false;

export async function generateStaticParams() {
  const matchIds = await getMatchIds();
  return matchIds.map((match_id) => ({ match_id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ match_id: string }>;
}): Promise<Metadata> {
  const { match_id } = await params;
  const match = await getMatch(match_id);

  if (!match) {
    return { title: "Match not found" };
  }

  return {
    title: `${match.teams.team1} vs ${match.teams.team2}`,
    description: `${match.result.winner} won by ${match.result.margin} at ${match.venue}.`,
  };
}

export default async function MatchDetailPage({
  params,
}: {
  params: Promise<{ match_id: string }>;
}) {
  const { match_id } = await params;
  const match = await getMatch(match_id);

  if (!match) {
    notFound();
  }

  return <MatchDetailClient match={match} />;
}
