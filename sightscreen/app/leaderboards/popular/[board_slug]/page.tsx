import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BackLink, PageFrame } from "@/app/components/section-shell";
import { getAllMatches } from "@/lib/data";
import { generatePopularLeaderboards, getPopularLeaderboardBySlug } from "@/lib/leaderboard-generator";

export const dynamicParams = false;

export async function generateStaticParams() {
  const matches = await getAllMatches();
  return generatePopularLeaderboards(matches).map((board) => ({ board_slug: board.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ board_slug: string }>;
}): Promise<Metadata> {
  const { board_slug } = await params;
  const matches = await getAllMatches();
  const board = getPopularLeaderboardBySlug(generatePopularLeaderboards(matches), board_slug);
  if (!board) {
    return { title: "Leaderboard not found" };
  }
  return {
    title: board.name,
    description: board.description,
  };
}

export default async function PopularLeaderboardPage({
  params,
}: {
  params: Promise<{ board_slug: string }>;
}) {
  const { board_slug } = await params;
  const matches = await getAllMatches();
  const board = getPopularLeaderboardBySlug(generatePopularLeaderboards(matches), board_slug);
  if (!board) {
    notFound();
  }
  const { PopularLeaderboardClient } = await import(
    "@/app/leaderboards/popular/[board_slug]/popular-leaderboard-client"
  );

  return (
    <PageFrame>
      <BackLink href="/leaderboards">← Back to leaderboards</BackLink>
      <PopularLeaderboardClient board={board} />
    </PageFrame>
  );
}
