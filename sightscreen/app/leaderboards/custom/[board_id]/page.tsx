import type { Metadata } from "next";
import { Suspense } from "react";

import { BackLink, PageFrame } from "@/app/components/section-shell";
import { getAllMatches } from "@/lib/data";
import { getAvailableLeaderboardDataset } from "@/lib/leaderboard-generator";

export const dynamicParams = false;

export async function generateStaticParams() {
  return [{ board_id: "local-storage" }];
}

export const metadata: Metadata = {
  title: "Saved Leaderboard",
  description: "Local browser-stored custom leaderboard.",
};

export default async function SavedCustomLeaderboardPage() {
  const matches = await getAllMatches();
  const slices = getAvailableLeaderboardDataset(matches);
  const { LocalBoardClient } = await import("@/app/leaderboards/custom/local-board-client");

  return (
    <PageFrame>
      <BackLink href="/leaderboards">← Back to leaderboards</BackLink>
      <Suspense fallback={<div className="glass-card rounded-[1.75rem] p-6 text-sm text-muted">Loading saved leaderboard...</div>}>
        <LocalBoardClient slices={slices} />
      </Suspense>
    </PageFrame>
  );
}
