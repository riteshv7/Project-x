import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { MatchCard } from "@/app/components/match-card";
import { BackLink, HeroCard, PageFrame, StatPill } from "@/app/components/section-shell";
import { TableCard } from "@/app/components/table-card";
import { getAllMatches } from "@/lib/data";
import {
  comparePlayerStats,
  getPlayerDirectory,
  resolvePlayerName,
} from "@/lib/player-aggregator";

const COMPARISON_PLAYER_COUNT = 36;

export const dynamicParams = false;

function splitComparisonSlug(comparison: string): [string, string] | null {
  const parts = comparison.split("-vs-");
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    return null;
  }
  return [parts[0], parts[1]];
}

function formatNumber(value: number | null, digits = 1) {
  return value === null ? "-" : value.toFixed(digits);
}

function formatDifference(value: number | null, digits = 1) {
  if (value === null) {
    return "-";
  }
  const prefix = value > 0 ? "+" : "";
  return `${prefix}${value.toFixed(digits)}`;
}

function differenceClass(value: number | null) {
  if (value === null || value === 0) {
    return "text-muted";
  }
  return value > 0 ? "text-accent-ink" : "text-[#873f2f]";
}

export async function generateStaticParams() {
  const matches = await getAllMatches();
  const players = getPlayerDirectory(matches).slice(0, COMPARISON_PLAYER_COUNT);
  const params: { comparison: string }[] = [];

  for (let leftIndex = 0; leftIndex < players.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < players.length; rightIndex += 1) {
      params.push({
        comparison: [players[leftIndex].slug, players[rightIndex].slug]
          .sort((left, right) => left.localeCompare(right))
          .join("-vs-"),
      });
    }
  }

  return params;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ comparison: string }>;
}): Promise<Metadata> {
  const { comparison } = await params;
  const matches = await getAllMatches();
  const directory = getPlayerDirectory(matches);
  const pair = splitComparisonSlug(comparison);

  if (!pair) {
    return { title: "Comparison not found" };
  }

  const player1 = resolvePlayerName(pair[0], directory.map((player) => player.name));
  const player2 = resolvePlayerName(pair[1], directory.map((player) => player.name));

  if (!player1 || !player2) {
    return { title: "Comparison not found" };
  }

  return {
    title: `${player1} vs ${player2}`,
    description: `Career comparison for ${player1} and ${player2}.`,
  };
}

export default async function PlayerComparisonPage({
  params,
}: {
  params: Promise<{ comparison: string }>;
}) {
  const { comparison } = await params;
  const matches = await getAllMatches();
  const directory = getPlayerDirectory(matches);
  const pair = splitComparisonSlug(comparison);

  if (!pair) {
    notFound();
  }

  const player1 = resolvePlayerName(pair[0], directory.map((player) => player.name));
  const player2 = resolvePlayerName(pair[1], directory.map((player) => player.name));

  if (!player1 || !player2) {
    notFound();
  }

  const stats = comparePlayerStats(player1, player2, matches);
  const battingRows = [
    ["Matches", stats.player1.batting.matches, stats.player2.batting.matches, stats.battingDifferences.matches, 0],
    ["Runs", stats.player1.batting.runs, stats.player2.batting.runs, stats.battingDifferences.runs, 0],
    ["Average", stats.player1.batting.average, stats.player2.batting.average, stats.battingDifferences.average, 1],
    [
      "Strike Rate",
      stats.player1.batting.strikeRate,
      stats.player2.batting.strikeRate,
      stats.battingDifferences.strikeRate,
      1,
    ],
    ["4s", stats.player1.batting.fours, stats.player2.batting.fours, stats.battingDifferences.fours, 0],
    ["6s", stats.player1.batting.sixes, stats.player2.batting.sixes, stats.battingDifferences.sixes, 0],
  ] as const;
  const bowlingRows = [
    ["Matches", stats.player1.bowling.matches, stats.player2.bowling.matches, stats.bowlingDifferences.matches, 0],
    ["Overs", stats.player1.bowling.overs, stats.player2.bowling.overs, stats.bowlingDifferences.overs, 1],
    ["Runs", stats.player1.bowling.runs, stats.player2.bowling.runs, stats.bowlingDifferences.runs, 0],
    ["Wickets", stats.player1.bowling.wickets, stats.player2.bowling.wickets, stats.bowlingDifferences.wickets, 0],
    ["Economy", stats.player1.bowling.economy, stats.player2.bowling.economy, stats.bowlingDifferences.economy, 2],
    [
      "Strike Rate",
      stats.player1.bowling.strikeRate,
      stats.player2.bowling.strikeRate,
      stats.bowlingDifferences.strikeRate,
      1,
    ],
  ] as const;

  return (
    <PageFrame>
      <BackLink href="/players">← Back to players</BackLink>
      <HeroCard
        eyebrow="Player Comparison"
        title={`${stats.player1.name} vs ${stats.player2.name}`}
        description="Career records side-by-side, computed directly from Sightscreen scorecards."
        aside={
          <>
            <StatPill label={`${stats.player1.name} matches`} value={stats.player1.totalMatches} />
            <StatPill label={`${stats.player2.name} matches`} value={stats.player2.totalMatches} />
            <StatPill label="Shared matches" value={stats.sharedMatches.length} />
            <StatPill label="Comparison" value="Batting + bowling" />
          </>
        }
      />

      <section className="mt-8 grid gap-6 xl:grid-cols-2">
        <TableCard title="Career Stats" subtitle="Batting comparison">
          <table className="min-w-full divide-y divide-card-border text-sm">
            <thead className="bg-white/80 text-left text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Metric</th>
                <th className="px-4 py-3 font-medium">{stats.player1.name}</th>
                <th className="px-4 py-3 font-medium">{stats.player2.name}</th>
                <th className="px-4 py-3 font-medium">Difference</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-card-border bg-white/55">
              {battingRows.map(([label, left, right, difference, digits]) => (
                <tr key={label}>
                  <td className="px-4 py-3 font-medium text-muted">{label}</td>
                  <td className="px-4 py-3 text-foreground">{formatNumber(left, digits)}</td>
                  <td className="px-4 py-3 text-foreground">{formatNumber(right, digits)}</td>
                  <td className={`px-4 py-3 font-semibold ${differenceClass(difference)}`}>
                    {formatDifference(difference, digits)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableCard>

        <TableCard title="Career Stats" subtitle="Bowling comparison">
          <table className="min-w-full divide-y divide-card-border text-sm">
            <thead className="bg-white/80 text-left text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Metric</th>
                <th className="px-4 py-3 font-medium">{stats.player1.name}</th>
                <th className="px-4 py-3 font-medium">{stats.player2.name}</th>
                <th className="px-4 py-3 font-medium">Difference</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-card-border bg-white/55">
              {bowlingRows.map(([label, left, right, difference, digits]) => (
                <tr key={label}>
                  <td className="px-4 py-3 font-medium text-muted">{label}</td>
                  <td className="px-4 py-3 text-foreground">{formatNumber(left, digits)}</td>
                  <td className="px-4 py-3 text-foreground">{formatNumber(right, digits)}</td>
                  <td className={`px-4 py-3 font-semibold ${differenceClass(difference)}`}>
                    {formatDifference(difference, digits)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableCard>
      </section>

      <section className="glass-card mt-8 rounded-[1.75rem] p-5 sm:p-6">
        <p className="section-title">H2H Direct</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-accent-ink">
          {stats.sharedMatches.length} matches together
        </h2>
        <p className="mt-3 text-sm text-muted">
          Shared-match count includes games where both players appeared in the scorecard, whether
          as teammates or opponents.
        </p>
      </section>

      <section className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {stats.sharedMatches.slice(0, 12).map((match) => (
          <MatchCard key={match.match_id} match={match} />
        ))}
      </section>
    </PageFrame>
  );
}
