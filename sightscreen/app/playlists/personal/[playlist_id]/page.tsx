import type { Metadata } from "next";
import { Suspense } from "react";

import { BackLink, PageFrame } from "@/app/components/section-shell";
import { PersonalPlaylistClient } from "@/app/playlists/personal/[playlist_id]/personal-playlist-client";
import { getMatchSummaries } from "@/lib/data";

export const dynamicParams = false;

export async function generateStaticParams() {
  return [{ playlist_id: "local-storage" }];
}

export const metadata: Metadata = {
  title: "Personal Playlist",
  description: "Local browser-stored match playlist.",
};

export default async function PersonalPlaylistPage() {
  const matches = await getMatchSummaries();

  return (
    <PageFrame>
      <BackLink href="/playlists">← Back to playlists</BackLink>
      <Suspense fallback={<div className="glass-card rounded-[1.75rem] p-6 text-sm text-muted">Loading playlist...</div>}>
        <PersonalPlaylistClient matches={matches} />
      </Suspense>
    </PageFrame>
  );
}
