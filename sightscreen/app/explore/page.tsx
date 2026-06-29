import type { Metadata } from "next";

import { ExploreClient } from "@/app/explore/explore-client";
import { PageFrame } from "@/app/components/section-shell";
import { getAllMatches } from "@/lib/data";
import { buildExploreDataset } from "@/lib/explore-aggregator";

export const metadata: Metadata = {
  title: "Explore",
  description: "Advanced match filtering across the Sightscreen archive.",
};

export default async function ExplorePage() {
  const matches = await getAllMatches();
  const dataset = buildExploreDataset(matches);

  return (
    <PageFrame>
      <ExploreClient dataset={dataset} />
    </PageFrame>
  );
}
