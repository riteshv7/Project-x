"use client";

import { useState } from "react";

import { PlaylistMatchCard } from "@/app/playlists/playlist-match-card";
import { HeroCard, StatPill } from "@/app/components/section-shell";
import type { MatchPlaylist } from "@/lib/types";
import { formatDisplayDate } from "@/lib/utils";

export function CuratedPlaylistClient({ playlist }: { playlist: MatchPlaylist }) {
  const [league, setLeague] = useState("all");
  const [season, setSeason] = useState("all");
  const [venue, setVenue] = useState("all");

  const filteredMatches = playlist.matches.filter((match) => {
    if (league !== "all" && match.league !== league) {
      return false;
    }
    if (season !== "all" && match.season !== season) {
      return false;
    }
    if (venue !== "all" && match.venue !== venue) {
      return false;
    }
    return true;
  });

  return (
    <>
      <HeroCard
        eyebrow="Curated Playlist"
        title={playlist.name}
        description={
          <div className="space-y-3">
            <p>{playlist.description}</p>
            <p>{playlist.criteria}</p>
          </div>
        }
        aside={
          <>
            <StatPill label="Matches" value={playlist.matches.length} />
            <StatPill label="Generated" value={formatDisplayDate(playlist.generatedAt)} />
          </>
        }
      />

      <section className="glass-card mt-8 rounded-[1.75rem] px-5 py-5 sm:px-6">
        <div className="grid gap-4 md:grid-cols-3">
          <label className="flex flex-col gap-2 text-sm font-medium text-muted">
            League
            <select
              value={league}
              onChange={(event) => setLeague(event.target.value)}
              className="rounded-2xl border border-card-border bg-white/80 px-4 py-3 text-foreground outline-none transition focus:border-accent"
            >
              <option value="all">All leagues</option>
              {playlist.availableLeagues.map((entry) => (
                <option key={entry} value={entry}>
                  {entry}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-muted">
            Season
            <select
              value={season}
              onChange={(event) => setSeason(event.target.value)}
              className="rounded-2xl border border-card-border bg-white/80 px-4 py-3 text-foreground outline-none transition focus:border-accent"
            >
              <option value="all">All seasons</option>
              {playlist.availableSeasons.map((entry) => (
                <option key={entry} value={entry}>
                  {entry}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-muted">
            Venue
            <select
              value={venue}
              onChange={(event) => setVenue(event.target.value)}
              className="rounded-2xl border border-card-border bg-white/80 px-4 py-3 text-foreground outline-none transition focus:border-accent"
            >
              <option value="all">All venues</option>
              {playlist.availableVenues.map((entry) => (
                <option key={entry} value={entry}>
                  {entry}
                </option>
              ))}
            </select>
          </label>
        </div>
        <p className="mt-3 text-sm text-muted">Showing {filteredMatches.length} matches.</p>
      </section>

      <section className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {filteredMatches.map((match) => (
          <PlaylistMatchCard key={match.match_id} match={match} />
        ))}
      </section>
    </>
  );
}
