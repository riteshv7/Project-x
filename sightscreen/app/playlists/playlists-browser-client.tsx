"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { GridSection, HeroCard, StatPill } from "@/app/components/section-shell";
import { deletePlaylist, readPlaylists } from "@/lib/playlist-storage";
import type { PersonalPlaylist, PlaylistSummary } from "@/lib/types";
import { formatDisplayDate } from "@/lib/utils";

export function PlaylistsBrowserClient({
  curated,
}: {
  curated: PlaylistSummary[];
}) {
  const [playlists, setPlaylists] = useState<PersonalPlaylist[]>([]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setPlaylists(readPlaylists());
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  return (
    <>
      <HeroCard
        eyebrow="Playlists"
        title="Curated collections and personal saves"
        description="Browse match collections cut from the archive, then keep your own favorites in browser storage."
        aside={
          <>
            <StatPill label="Curated" value={curated.length} />
            <StatPill label="My Playlists" value={playlists.length} />
          </>
        }
      />

      <GridSection title="Curated Playlists">
        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {curated.map((playlist) => (
            <Link
              key={playlist.slug}
              href={`/playlists/curated/${playlist.slug}`}
              className="glass-card rounded-[1.75rem] p-6 transition duration-200 hover:-translate-y-1 hover:border-accent/30"
            >
              <p className="section-title">Curated</p>
              <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-accent-ink">
                {playlist.name}
              </h2>
              <p className="mt-4 text-sm leading-7 text-muted">{playlist.description}</p>
              <div className="mt-6 grid gap-3 text-sm text-muted sm:grid-cols-2">
                <StatPill label="Matches" value={playlist.matchCount} />
                <StatPill label="Generated" value={formatDisplayDate(playlist.generatedAt)} />
              </div>
            </Link>
          ))}
        </section>
      </GridSection>

      <GridSection title="My Playlists">
        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {playlists.length === 0 ? (
            <div className="glass-card rounded-[1.75rem] p-6 text-sm text-muted">
              Personal playlists will appear here after you save a match from a curated page or match detail.
            </div>
          ) : (
            playlists.map((playlist) => (
              <div key={playlist.id} className="glass-card rounded-[1.75rem] p-6">
                <p className="section-title">Saved locally</p>
                <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-accent-ink">
                  {playlist.name}
                </h2>
                <p className="mt-4 text-sm leading-7 text-muted">
                  {playlist.description || "No description yet."}
                </p>
                <div className="mt-6 grid gap-3 text-sm text-muted sm:grid-cols-2">
                  <StatPill label="Matches" value={playlist.matches.length} />
                  <StatPill label="Created" value={formatDisplayDate(playlist.created_at)} />
                </div>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    href={`/playlists/personal/local-storage?playlist=${encodeURIComponent(playlist.id)}`}
                    className="rounded-2xl border border-card-border bg-white/70 px-4 py-3 text-sm font-medium text-foreground transition hover:border-accent/30 hover:text-accent-ink"
                  >
                    Open playlist
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setPlaylists(deletePlaylist(playlist.id));
                    }}
                    className="rounded-2xl border border-card-border bg-[#f8f1e5] px-4 py-3 text-sm font-medium text-accent-ink transition hover:border-accent/30"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </section>
      </GridSection>
    </>
  );
}
