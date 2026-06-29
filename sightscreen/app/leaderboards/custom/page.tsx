import type { Metadata } from "next";
import { Suspense } from "react";

import { BackLink, PageFrame } from "@/app/components/section-shell";
import { getAllMatches } from "@/lib/data";
import { getAvailableLeaderboardDataset } from "@/lib/leaderboard-generator";

export const metadata: Metadata = {
  title: "Custom Leaderboard",
  description: "Build and share a custom Sightscreen leaderboard.",
};

export default async function CustomLeaderboardPage() {
  const matches = await getAllMatches();
  const slices = getAvailableLeaderboardDataset(matches);
  const { CustomBuilderClient } = await import("@/app/leaderboards/custom/custom-builder-client");

  return (
    <PageFrame>
      <BackLink href="/leaderboards">← Back to leaderboards</BackLink>
      <Suspense fallback={<div className="glass-card rounded-[1.75rem] p-6 text-sm text-muted">Loading leaderboard builder...</div>}>
        <CustomBuilderClient slices={slices} />
      </Suspense>
    </PageFrame>
  );
}
