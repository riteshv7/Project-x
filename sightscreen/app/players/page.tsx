import type { Metadata } from "next";

import { PageFrame } from "@/app/components/section-shell";
import { PlayersPageClient } from "@/app/players/players-page-client";
import { getAllMatches } from "@/lib/data";
import { getPlayerDirectory } from "@/lib/player-aggregator";

export const metadata: Metadata = {
  title: "Players",
  description: "Browse player batting and bowling records across Sightscreen.",
};

export default async function PlayersPage() {
  const matches = await getAllMatches();
  const players = getPlayerDirectory(matches);

  return (
    <PageFrame>
      <PlayersPageClient players={players} />
    </PageFrame>
  );
}
