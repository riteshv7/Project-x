import type { LeagueCode } from "@/lib/types";
import { getLeagueMetadata } from "@/lib/match-aggregator";

export function LeagueBadge({ league }: { league: LeagueCode }) {
  const metadata = getLeagueMetadata(league);

  return (
    <span className="inline-flex items-center rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-accent-ink">
      {metadata.badge}
    </span>
  );
}
