import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BackLink, PageFrame } from "@/app/components/section-shell";
import { getAllMatches } from "@/lib/data";
import { generateCuratedPlaylists, getPlaylistBySlug } from "@/lib/playlist-generator";

export const dynamicParams = false;

export async function generateStaticParams() {
  const matches = await getAllMatches();
  return generateCuratedPlaylists(matches).map((playlist) => ({ playlist_slug: playlist.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ playlist_slug: string }>;
}): Promise<Metadata> {
  const { playlist_slug } = await params;
  const matches = await getAllMatches();
  const playlist = getPlaylistBySlug(generateCuratedPlaylists(matches), playlist_slug);

  if (!playlist) {
    return { title: "Playlist not found" };
  }

  return {
    title: playlist.name,
    description: playlist.description,
  };
}

export default async function CuratedPlaylistPage({
  params,
}: {
  params: Promise<{ playlist_slug: string }>;
}) {
  const { playlist_slug } = await params;
  const matches = await getAllMatches();
  const playlist = getPlaylistBySlug(generateCuratedPlaylists(matches), playlist_slug);

  if (!playlist) {
    notFound();
  }

  const { CuratedPlaylistClient } = await import(
    "@/app/playlists/curated/[playlist_slug]/curated-playlist-client"
  );

  return (
    <PageFrame>
      <BackLink href="/playlists">← Back to playlists</BackLink>
      <CuratedPlaylistClient playlist={playlist} />
    </PageFrame>
  );
}
