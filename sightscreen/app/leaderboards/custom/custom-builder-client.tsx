"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

import { LeaderboardTable } from "@/app/leaderboards/leaderboard-table";
import { HeroCard, StatPill } from "@/app/components/section-shell";
import {
  buildCustomLeaderboardRows,
  createCustomLeaderboardConfig,
  decodeCustomLeaderboardFromSearch,
  shareUrlForBoard,
  upsertCustomLeaderboard,
} from "@/lib/leaderboard-builder";
import type { CustomLeaderboardConfig, LeaderboardAggregateSlice, LeaderboardMetric, LeaderboardRole, LeagueCode } from "@/lib/types";

const METRIC_OPTIONS: { value: LeaderboardMetric; label: string }[] = [
  { value: "runs", label: "Runs" },
  { value: "wickets", label: "Wickets" },
  { value: "strike_rate", label: "Strike Rate" },
  { value: "economy", label: "Economy" },
  { value: "average", label: "Average" },
  { value: "fours", label: "Fours" },
  { value: "sixes", label: "Sixes" },
  { value: "all_rounder_score", label: "All-rounder score" },
];

export function CustomBuilderClient({
  slices,
  savedBoard,
}: {
  slices: LeaderboardAggregateSlice[];
  savedBoard?: CustomLeaderboardConfig | null;
}) {
  const searchParams = useSearchParams();
  const initial = useMemo(() => {
    if (savedBoard) {
      return savedBoard;
    }
    const params = searchParams.toString();
    return params ? decodeCustomLeaderboardFromSearch(new URLSearchParams(params)) : createCustomLeaderboardConfig();
  }, [savedBoard, searchParams]);

  const [config, setConfig] = useState<CustomLeaderboardConfig>(initial);
  const rows = useMemo(() => buildCustomLeaderboardRows(slices, config), [slices, config]);
  const availableLeagues = Array.from(new Set(slices.map((slice) => slice.league)));
  const seasons = Array.from(new Set(slices.filter((slice) => config.league === "all" || slice.league === config.league).map((slice) => slice.season))).sort((a, b) => Number(b) - Number(a));

  function updateMetric(metric: LeaderboardMetric) {
    setConfig((current) => ({
      ...current,
      metric,
      minThreshold:
        metric === "economy"
          ? { type: "overs", value: 10 }
          : metric === "average"
            ? { type: "dismissals", value: 5 }
            : metric === "strike_rate"
              ? { type: "innings", value: 5 }
              : { type: "matches", value: 1 },
    }));
  }

  return (
    <>
      <HeroCard
        eyebrow="Custom Leaderboard"
        title={config.name}
        description="Build a ranking client-side from pre-computed player aggregates, then save it locally or share it by URL."
        aside={
          <>
            <StatPill label="Rows" value={rows.length} />
            <StatPill label="Metric" value={config.metric} />
            <StatPill label="League" value={config.league} />
          </>
        }
      />

      <section className="glass-card mt-8 rounded-[1.75rem] p-5 sm:p-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <label className="flex flex-col gap-2 text-sm font-medium text-muted">
            Leaderboard name
            <input
              value={config.name}
              onChange={(event) => setConfig((current) => ({ ...current, name: event.target.value }))}
              className="rounded-2xl border border-card-border bg-white/80 px-4 py-3 text-foreground outline-none transition focus:border-accent"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-muted">
            Metric
            <select
              value={config.metric}
              onChange={(event) => updateMetric(event.target.value as LeaderboardMetric)}
              className="rounded-2xl border border-card-border bg-white/80 px-4 py-3 text-foreground outline-none transition focus:border-accent"
            >
              {METRIC_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-muted">
            League
            <select
              value={config.league}
              onChange={(event) => setConfig((current) => ({ ...current, league: event.target.value as LeagueCode | "all", season: "all" }))}
              className="rounded-2xl border border-card-border bg-white/80 px-4 py-3 text-foreground outline-none transition focus:border-accent"
            >
              <option value="all">All leagues</option>
              {availableLeagues.map((league) => (
                <option key={league} value={league}>
                  {league}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-muted">
            Season
            <select
              value={config.season}
              onChange={(event) => setConfig((current) => ({ ...current, season: event.target.value }))}
              className="rounded-2xl border border-card-border bg-white/80 px-4 py-3 text-foreground outline-none transition focus:border-accent"
            >
              <option value="all">All seasons</option>
              {seasons.map((season) => (
                <option key={season} value={season}>
                  {season}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-muted">
            Role
            <select
              value={config.role}
              onChange={(event) => setConfig((current) => ({ ...current, role: event.target.value as LeaderboardRole }))}
              className="rounded-2xl border border-card-border bg-white/80 px-4 py-3 text-foreground outline-none transition focus:border-accent"
            >
              <option value="any">Any</option>
              <option value="batter">Batter</option>
              <option value="bowler">Bowler</option>
              <option value="all_rounder">All-rounder</option>
            </select>
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-muted">
            Minimum threshold
            <div className="grid grid-cols-[160px_minmax(0,1fr)] gap-2">
              <select
                value={config.minThreshold.type}
                onChange={(event) =>
                  setConfig((current) => ({
                    ...current,
                    minThreshold: { ...current.minThreshold, type: event.target.value as CustomLeaderboardConfig["minThreshold"]["type"] },
                  }))
                }
                className="rounded-2xl border border-card-border bg-white/80 px-4 py-3 text-foreground outline-none transition focus:border-accent"
              >
                <option value="matches">Matches</option>
                <option value="innings">Innings</option>
                <option value="dismissals">Dismissals</option>
                <option value="overs">Overs</option>
              </select>
              <input
                type="number"
                min={0}
                value={config.minThreshold.value}
                onChange={(event) =>
                  setConfig((current) => ({
                    ...current,
                    minThreshold: { ...current.minThreshold, value: Number(event.target.value) || 0 },
                  }))
                }
                className="rounded-2xl border border-card-border bg-white/80 px-4 py-3 text-foreground outline-none transition focus:border-accent"
              />
            </div>
          </label>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => upsertCustomLeaderboard(config)}
            className="rounded-2xl border border-accent/20 bg-accent px-4 py-3 text-sm font-semibold text-white transition hover:bg-accent-ink"
          >
            Save leaderboard
          </button>
          <Link
            href={shareUrlForBoard(config)}
            className="rounded-2xl border border-card-border bg-white/70 px-4 py-3 text-sm font-medium text-foreground transition hover:border-accent/30 hover:text-accent-ink"
          >
            Share this leaderboard
          </Link>
        </div>
      </section>

      <section className="mt-8">
        <LeaderboardTable rows={rows} metricLabel={rows[0]?.metricLabel ?? "Metric"} />
      </section>
    </>
  );
}
