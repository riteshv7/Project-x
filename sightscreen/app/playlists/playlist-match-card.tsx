import Link from "next/link";

import { AddToPlaylistButton } from "@/app/playlists/add-to-playlist-button";
import { LeagueBadge } from "@/app/components/league-badge";
import type { MatchSummary } from "@/lib/types";
import { formatDisplayDate, formatLeagueLabel } from "@/lib/utils";

export function PlaylistMatchCard({ match }: { match: MatchSummary }) {
  return (
    <div className="glass-card rounded-[1.75rem] p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <LeagueBadge league={match.league} />
            <p className="section-title">
              {formatLeagueLabel(match.league)} {match.season}
            </p>
          </div>
          <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-accent-ink">
            {match.teams.team1} vs {match.teams.team2}
          </h2>
        </div>
      </div>

      <div className="mt-6 space-y-3 text-sm text-muted">
        <p>{formatDisplayDate(match.date)}</p>
        <p>{match.venue}</p>
        <p className="font-medium text-foreground">{match.resultText}</p>
        <p>{match.scoreline}</p>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-card-border pt-4">
        <Link
          href={`/matches/${match.match_id}`}
          className="text-sm font-medium text-accent-ink transition hover:translate-x-1"
        >
          Open analysis →
        </Link>
        <AddToPlaylistButton matchId={match.match_id} />
      </div>
    </div>
  );
}
