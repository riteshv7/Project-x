import type { Metadata } from "next";

import { PageFrame } from "@/app/components/section-shell";
import { LeaderboardsBrowserClient } from "@/app/leaderboards/leaderboards-browser-client";
import { getAllMatches } from "@/lib/data";
import { generatePopularLeaderboards } from "@/lib/leaderboard-generator";

export const metadata: Metadata = {
  title: "Leaderboards",
  description: "Popular and custom player leaderboards across Sightscreen.",
};

export default async function LeaderboardsPage() {
  const matches = await getAllMatches();
  const boards = generatePopularLeaderboards(matches);

  return (
    <PageFrame>
      <LeaderboardsBrowserClient boards={boards} />
    </PageFrame>
  );
}
