"use client";

import Link from "next/link";
import { useState } from "react";

import { MatchCard } from "@/app/components/match-card";
import { GridSection, HeroCard, StatPill } from "@/app/components/section-shell";
import { TableCard } from "@/app/components/table-card";
import type { TeamStats } from "@/lib/types";
import { formatAverage, formatPercentage } from "@/lib/utils";

type ResultFilter = "all" | "won" | "lost";

export function TeamPageClient({ stats }: { stats: TeamStats }) {
  const [result, setResult] = useState<ResultFilter>("all");

  const filteredMatches = stats.matchSummaries.filter((match) => {
    if (result === "all") {
      return true;
    }
    return match.winner === stats.teamName ? result === "won" : result === "lost";
  });

  return (
    <>
      <HeroCard
        eyebrow="Team Page"
        title={stats.teamName}
        description={
          <p>
            Season range {stats.seasonRange}. A full match log, recent form, and lifetime team read
            built from every precomputed IPL bundle in Sightscreen.
          </p>
        }
        aside={
          <>
            <StatPill label="Matches" value={stats.matchesPlayed} />
            <StatPill label="Win Rate" value={formatPercentage(stats.winPct)} />
            <StatPill label="Avg Score" value={formatAverage(stats.avgScore)} />
            <StatPill label="Avg Allowed" value={formatAverage(stats.avgOppositionScore)} />
          </>
        }
      />

      <section className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,1fr)]">
        <TableCard title="Lifetime" subtitle="Aggregate stats">
          <table className="min-w-full divide-y divide-card-border text-sm">
            <thead className="bg-white/80 text-left text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Wins</th>
                <th className="px-4 py-3 font-medium">Losses</th>
                <th className="px-4 py-3 font-medium">Ties</th>
                <th className="px-4 py-3 font-medium">Win %</th>
                <th className="px-4 py-3 font-medium">Avg Score</th>
                <th className="px-4 py-3 font-medium">Avg Opposition</th>
              </tr>
            </thead>
            <tbody className="bg-white/55">
              <tr>
                <td className="px-4 py-3 text-foreground">{stats.wins}</td>
                <td className="px-4 py-3 text-foreground">{stats.losses}</td>
                <td className="px-4 py-3 text-foreground">{stats.ties}</td>
                <td className="px-4 py-3 text-foreground">{formatPercentage(stats.winPct)}</td>
                <td className="px-4 py-3 text-foreground">{formatAverage(stats.avgScore)}</td>
                <td className="px-4 py-3 text-foreground">
                  {formatAverage(stats.avgOppositionScore)}
                </td>
              </tr>
            </tbody>
          </table>
        </TableCard>

        <div className="glass-card rounded-[1.75rem] p-5 sm:p-6">
          <p className="section-title">Head To Head</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-accent-ink">
            Frequent opponents
          </h2>
          <div className="mt-5 flex flex-wrap gap-3">
            {stats.opponents.map((opponent) => (
              <Link
                key={opponent.slug}
                href={`/h2h/${opponent.slug}`}
                className="rounded-full border border-card-border bg-white/70 px-4 py-2 text-sm font-medium text-foreground transition hover:border-accent/30 hover:text-accent-ink"
              >
                {stats.teamName} vs {opponent.teamName} ({opponent.matchesPlayed})
              </Link>
            ))}
          </div>
        </div>
      </section>

      <GridSection title="Season Breakdown">
        <TableCard title="Seasons" subtitle="Year by year">
          <table className="min-w-full divide-y divide-card-border text-sm">
            <thead className="bg-white/80 text-left text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Season</th>
                <th className="px-4 py-3 font-medium">Matches</th>
                <th className="px-4 py-3 font-medium">Wins</th>
                <th className="px-4 py-3 font-medium">Losses</th>
                <th className="px-4 py-3 font-medium">Ties</th>
                <th className="px-4 py-3 font-medium">Win %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-card-border bg-white/55">
              {stats.seasonBreakdown.map((row) => (
                <tr key={row.season}>
                  <td className="px-4 py-3 font-medium text-foreground">{row.season}</td>
                  <td className="px-4 py-3 text-foreground">{row.matchesPlayed}</td>
                  <td className="px-4 py-3 text-foreground">{row.wins}</td>
                  <td className="px-4 py-3 text-foreground">{row.losses}</td>
                  <td className="px-4 py-3 text-foreground">{row.ties}</td>
                  <td className="px-4 py-3 text-foreground">{formatPercentage(row.winPct)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableCard>
      </GridSection>

      <section className="glass-card mt-8 rounded-[1.75rem] px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="section-title">Match List</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-accent-ink">
              Recent form
            </h2>
          </div>
          <label className="flex flex-col gap-2 text-sm font-medium text-muted">
            Result
            <select
              value={result}
              onChange={(event) => setResult(event.target.value as ResultFilter)}
              className="rounded-2xl border border-card-border bg-white/80 px-4 py-3 text-foreground outline-none transition focus:border-accent"
            >
              <option value="all">Show all</option>
              <option value="won">Won</option>
              <option value="lost">Lost</option>
            </select>
          </label>
        </div>
        <p className="mt-3 text-sm text-muted">
          Showing {filteredMatches.length} of {stats.matchSummaries.length} matches.
        </p>
      </section>

      <section className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {filteredMatches.map((match) => (
          <MatchCard key={match.match_id} match={match} />
        ))}
      </section>
    </>
  );
}
