import type { Metadata } from "next";

import { PageFrame } from "@/app/components/section-shell";
import { PlaylistsBrowserClient } from "@/app/playlists/playlists-browser-client";
import { getAllMatches } from "@/lib/data";
import { generateCuratedPlaylists, getPlaylistSummaries } from "@/lib/playlist-generator";

export const metadata: Metadata = {
  title: "Playlists",
  description: "Curated and personal Sightscreen match playlists.",
};

export default async function PlaylistsPage() {
  const matches = await getAllMatches();
  const playlists = generateCuratedPlaylists(matches);

  return (
    <PageFrame>
      <PlaylistsBrowserClient curated={getPlaylistSummaries(playlists)} />
    </PageFrame>
  );
}
