"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";

import { PlaylistMatchCard } from "@/app/playlists/playlist-match-card";
import { HeroCard, StatPill } from "@/app/components/section-shell";
import { createPlaylist, upsertPlaylist } from "@/lib/playlist-storage";
import type { MatchSummary } from "@/lib/types";

export function SharedPlaylistClient({ matches }: { matches: MatchSummary[] }) {
  const searchParams = useSearchParams();
  const matchIds = (searchParams.get("matches") ?? "").split(",").filter(Boolean);
  const name = searchParams.get("name") ?? "Shared playlist";

  const selectedMatches = useMemo(() => {
    const byId = new Map(matches.map((match) => [match.match_id, match]));
    return matchIds.map((id) => byId.get(id)).filter(Boolean) as MatchSummary[];
  }, [matchIds, matches]);

  return (
    <>
      <HeroCard
        eyebrow="Shared Playlist"
        title={name}
        description="Temporary view built from encoded match ids in the URL."
        aside={
          <>
            <StatPill label="Matches" value={selectedMatches.length} />
            <StatPill label="Source" value="URL query" />
          </>
        }
      />

      <section className="glass-card mt-8 rounded-[1.75rem] p-5 sm:p-6">
        <button
          type="button"
          onClick={() => {
            const playlist = createPlaylist(name, "Imported from a shared URL.");
            playlist.matches = selectedMatches.map((match) => match.match_id);
            upsertPlaylist(playlist);
          }}
          className="rounded-2xl border border-accent/20 bg-accent px-4 py-3 text-sm font-semibold text-white transition hover:bg-accent-ink"
        >
          Save this playlist to my account
        </button>
      </section>

      <section className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {selectedMatches.map((match) => (
          <PlaylistMatchCard key={match.match_id} match={match} />
        ))}
      </section>
    </>
  );
}
