"use client";

import { startTransition, useEffect, useState } from "react";

import {
  addMatchToPlaylist,
  createPlaylist,
  readPlaylists,
  upsertPlaylist,
} from "@/lib/playlist-storage";
import type { PersonalPlaylist } from "@/lib/types";

export function AddToPlaylistButton({
  matchId,
  className,
}: {
  matchId: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [playlists, setPlaylists] = useState<PersonalPlaylist[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (!open) {
      return;
    }
    const frame = window.requestAnimationFrame(() => {
      setPlaylists(readPlaylists());
    });
    return () => window.cancelAnimationFrame(frame);
  }, [open]);

  function refresh() {
    setPlaylists(readPlaylists());
  }

  function handleCreate() {
    if (!name.trim()) {
      setStatus("Name your playlist first.");
      return;
    }
    const playlist = createPlaylist(name.trim(), description.trim());
    playlist.matches = [matchId];
    startTransition(() => {
      upsertPlaylist(playlist);
      refresh();
      setName("");
      setDescription("");
      setStatus(`Saved to ${playlist.name}.`);
    });
  }

  function handleAdd(playlistId: string) {
    startTransition(() => {
      addMatchToPlaylist(playlistId, matchId);
      refresh();
      const playlist = readPlaylists().find((entry) => entry.id === playlistId);
      setStatus(playlist ? `Added to ${playlist.name}.` : "Added.");
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          className ??
          "rounded-2xl border border-accent/20 bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent-ink"
        }
      >
        Add to playlist
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(18,34,28,0.35)] px-4">
          <div className="glass-card max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-[1.75rem] p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="section-title">Personal Playlists</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-accent-ink">
                  Save this match
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full border border-card-border bg-white/70 px-3 py-1 text-sm text-muted transition hover:text-accent-ink"
              >
                Close
              </button>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              <div>
                <p className="text-sm font-semibold text-muted">Choose an existing playlist</p>
                <div className="mt-3 grid gap-3">
                  {playlists.length === 0 ? (
                    <p className="rounded-2xl border border-card-border bg-white/70 px-4 py-4 text-sm text-muted">
                      No playlists yet. Create one on the right.
                    </p>
                  ) : (
                    playlists.map((playlist) => (
                      <div
                        key={playlist.id}
                        className="rounded-2xl border border-card-border bg-white/70 px-4 py-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="font-medium text-foreground">{playlist.name}</div>
                            <div className="mt-1 text-sm text-muted">{playlist.description || "No description yet."}</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleAdd(playlist.id)}
                            className="rounded-2xl border border-card-border bg-[#f8f1e5] px-3 py-2 text-sm font-semibold text-accent-ink transition hover:border-accent/30"
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-muted">Create a new playlist</p>
                <div className="mt-3 grid gap-3">
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="My favorite IPL moments"
                    className="rounded-2xl border border-card-border bg-white/80 px-4 py-3 text-foreground outline-none transition focus:border-accent"
                  />
                  <textarea
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder="Matches that blew my mind"
                    rows={4}
                    className="rounded-2xl border border-card-border bg-white/80 px-4 py-3 text-foreground outline-none transition focus:border-accent"
                  />
                  <button
                    type="button"
                    onClick={handleCreate}
                    className="rounded-2xl border border-accent/20 bg-accent px-4 py-3 text-sm font-semibold text-white transition hover:bg-accent-ink"
                  >
                    Create playlist
                  </button>
                </div>
              </div>
            </div>

            {status ? <p className="mt-5 text-sm text-accent-ink">{status}</p> : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
