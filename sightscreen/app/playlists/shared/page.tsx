import type { Metadata } from "next";
import { Suspense } from "react";

import { BackLink, PageFrame } from "@/app/components/section-shell";
import { SharedPlaylistClient } from "@/app/playlists/shared/shared-playlist-client";
import { getMatchSummaries } from "@/lib/data";

export const metadata: Metadata = {
  title: "Shared Playlist",
  description: "Shared match playlist built from encoded match ids.",
};

export default async function SharedPlaylistPage() {
  const matches = await getMatchSummaries();

  return (
    <PageFrame>
      <BackLink href="/playlists">← Back to playlists</BackLink>
      <Suspense fallback={<div className="glass-card rounded-[1.75rem] p-6 text-sm text-muted">Loading shared playlist...</div>}>
        <SharedPlaylistClient matches={matches} />
      </Suspense>
    </PageFrame>
  );
}
