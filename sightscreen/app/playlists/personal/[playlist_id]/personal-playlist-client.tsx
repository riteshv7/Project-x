"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { PlaylistMatchCard } from "@/app/playlists/playlist-match-card";
import { HeroCard, StatPill } from "@/app/components/section-shell";
import {
  deletePlaylist,
  readPlaylists,
  removeMatchFromPlaylist,
  upsertPlaylist,
} from "@/lib/playlist-storage";
import type { MatchSummary, PersonalPlaylist } from "@/lib/types";

export function PersonalPlaylistClient({ matches }: { matches: MatchSummary[] }) {
  const searchParams = useSearchParams();
  const playlistId = searchParams.get("playlist") ?? "";
  const [playlist, setPlaylist] = useState<PersonalPlaylist | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const next = readPlaylists().find((entry) => entry.id === playlistId) ?? null;
      setPlaylist(next);
      setName(next?.name ?? "");
      setDescription(next?.description ?? "");
    });
    return () => window.cancelAnimationFrame(frame);
  }, [playlistId]);

  const selectedMatches = useMemo(() => {
    if (!playlist) {
      return [];
    }
    const byId = new Map(matches.map((match) => [match.match_id, match]));
    return playlist.matches.map((id) => byId.get(id)).filter(Boolean) as MatchSummary[];
  }, [matches, playlist]);

  if (!playlist) {
    return (
      <div className="glass-card rounded-[1.75rem] p-6 text-sm text-muted">
        Playlist not found in local storage. Head back to <Link href="/playlists" className="text-accent-ink hover:underline">playlists</Link> and open one from there.
      </div>
    );
  }

  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/playlists/shared?matches=${encodeURIComponent(playlist.matches.join(","))}&name=${encodeURIComponent(playlist.name)}`
      : `/playlists/shared?matches=${encodeURIComponent(playlist.matches.join(","))}&name=${encodeURIComponent(playlist.name)}`;

  return (
    <>
      <HeroCard
        eyebrow="Personal Playlist"
        title={playlist.name}
        description={playlist.description || "Your locally saved match collection."}
        aside={
          <>
            <StatPill label="Matches" value={playlist.matches.length} />
            <StatPill label="Saved locally" value="Browser storage" />
          </>
        }
      />

      <section className="glass-card mt-8 rounded-[1.75rem] p-5 sm:p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="rounded-2xl border border-card-border bg-white/80 px-4 py-3 text-foreground outline-none transition focus:border-accent"
          />
          <input
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className="rounded-2xl border border-card-border bg-white/80 px-4 py-3 text-foreground outline-none transition focus:border-accent"
          />
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => {
              const next = { ...playlist, name: name.trim() || playlist.name, description: description.trim() };
              upsertPlaylist(next);
              setPlaylist(next);
            }}
            className="rounded-2xl border border-accent/20 bg-accent px-4 py-3 text-sm font-semibold text-white transition hover:bg-accent-ink"
          >
            Save changes
          </button>
          <a
            href={shareUrl}
            className="rounded-2xl border border-card-border bg-white/70 px-4 py-3 text-sm font-medium text-foreground transition hover:border-accent/30 hover:text-accent-ink"
          >
            Share this playlist
          </a>
          <button
            type="button"
            onClick={() => {
              deletePlaylist(playlist.id);
              setPlaylist(null);
            }}
            className="rounded-2xl border border-card-border bg-[#f8f1e5] px-4 py-3 text-sm font-medium text-accent-ink transition hover:border-accent/30"
          >
            Delete playlist
          </button>
        </div>
      </section>

      <section className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {selectedMatches.map((match) => (
          <div key={match.match_id} className="space-y-3">
            <PlaylistMatchCard match={match} />
            <button
              type="button"
              onClick={() => {
                removeMatchFromPlaylist(playlist.id, match.match_id);
                const next = readPlaylists().find((entry) => entry.id === playlist.id) ?? null;
                setPlaylist(next);
              }}
              className="w-full rounded-2xl border border-card-border bg-white/70 px-4 py-3 text-sm font-medium text-accent-ink transition hover:border-accent/30"
            >
              Remove from playlist
            </button>
          </div>
        ))}
      </section>
    </>
  );
}
