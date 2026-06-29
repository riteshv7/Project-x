"use client";

import Link from "next/link";

import { LeaderboardTable } from "@/app/leaderboards/leaderboard-table";
import { HeroCard, StatPill } from "@/app/components/section-shell";
import type { PopularLeaderboard } from "@/lib/types";
import { formatDisplayDate } from "@/lib/utils";

export function PopularLeaderboardClient({ board }: { board: PopularLeaderboard }) {
  return (
    <>
      <HeroCard
        eyebrow="Popular Leaderboard"
        title={board.name}
        description={
          <div className="space-y-3">
            <p>{board.description}</p>
            <p>{board.filtersLabel}</p>
          </div>
        }
        aside={
          <>
            <StatPill label="Metric" value={board.rows[0]?.metricLabel ?? board.metric} />
            <StatPill label="Rows" value={board.rows.length} />
            <StatPill label="Cutoff" value={formatDisplayDate(board.cutoffDate)} />
          </>
        }
      />

      <section className="mt-8">
        <LeaderboardTable rows={board.rows} metricLabel={board.rows[0]?.metricLabel ?? "Metric"} />
      </section>

      <section className="glass-card mt-8 rounded-[1.75rem] px-5 py-5 sm:px-6">
        <Link
          href="/leaderboards/custom/?name=Custom%20leaderboard&metric=runs&league=all&season=all&role=any&threshold_type=matches&threshold_value=1"
          className="rounded-2xl border border-accent/20 bg-accent px-4 py-3 text-sm font-semibold text-white transition hover:bg-accent-ink"
        >
          Create custom leaderboard
        </Link>
      </section>
    </>
  );
}
