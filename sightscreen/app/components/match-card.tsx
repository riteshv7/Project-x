import Link from "next/link";

import { LeagueBadge } from "@/app/components/league-badge";
import type { MatchSummary } from "@/lib/types";
import { formatDisplayDate, formatLeagueLabel } from "@/lib/utils";

export function MatchCard({ match }: { match: MatchSummary }) {
  return (
    <Link
      href={`/matches/${match.match_id}`}
      className="glass-card group rounded-[1.75rem] p-6 transition duration-200 hover:-translate-y-1 hover:border-accent/30"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <LeagueBadge league={match.league} />
            <p className="section-title">{formatLeagueLabel(match.league)} {match.season}</p>
          </div>
          <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-accent-ink">
            {match.teams.team1} vs {match.teams.team2}
          </h2>
        </div>
        <span className="rounded-full border border-card-border bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-accent-ink">
          Match
        </span>
      </div>

      <div className="mt-6 space-y-3 text-sm text-muted">
        <p>{formatDisplayDate(match.date)}</p>
        <p>{match.venue}</p>
        <p className="font-medium text-foreground">{match.resultText}</p>
        <p>{match.scoreline}</p>
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-card-border pt-4 text-sm font-medium text-accent-ink">
        <span>Open analysis</span>
        <span className="transition group-hover:translate-x-1">→</span>
      </div>
    </Link>
  );
}
