"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { HeroCard, StatPill } from "@/app/components/section-shell";
import { TableCard } from "@/app/components/table-card";
import type { TeamAnalyticsStats } from "@/lib/types";
import { formatAverage, formatLeagueLabel, formatPercentage } from "@/lib/utils";

export function TeamAnalyticsClient({ analytics }: { analytics: TeamAnalyticsStats }) {
  const topBatters = analytics.batterStats.slice(0, 10);

  return (
    <>
      <HeroCard
        eyebrow="Team Analytics"
        title={`${analytics.teamName} analytics`}
        description={
          <div className="space-y-3">
            <p>
              Deep dive across {analytics.leagues.map((league) => formatLeagueLabel(league)).join(", ")} matches.
            </p>
            <p>{analytics.homeGround ? `Detected home ground: ${analytics.homeGround}.` : "No stable home ground detected from the archive."}</p>
          </div>
        }
        aside={
          <>
            <StatPill label="Batters tracked" value={analytics.batterStats.length} />
            <StatPill label="Bowlers tracked" value={analytics.bowlerStats.length} />
            <StatPill label="Home ground" value={analytics.homeGround ?? "Mixed"} />
            <StatPill label="Seasons" value={analytics.seasonTrends.length} />
          </>
        }
      />

      <section className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,1fr)]">
        <TableCard title="Batting Order Strength" subtitle="Top batters">
          <table className="min-w-full divide-y divide-card-border text-sm">
            <thead className="bg-white/80 text-left text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Batter</th>
                <th className="px-4 py-3 font-medium">Matches</th>
                <th className="px-4 py-3 font-medium">Runs</th>
                <th className="px-4 py-3 font-medium">Avg</th>
                <th className="px-4 py-3 font-medium">SR</th>
                <th className="px-4 py-3 font-medium">4s</th>
                <th className="px-4 py-3 font-medium">6s</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-card-border bg-white/55">
              {topBatters.map((row) => (
                <tr key={row.name}>
                  <td className="px-4 py-3 font-medium text-foreground">{row.name}</td>
                  <td className="px-4 py-3 text-foreground">{row.matches}</td>
                  <td className="px-4 py-3 text-foreground">{row.runs}</td>
                  <td className="px-4 py-3 text-foreground">{row.average === null ? "-" : formatAverage(row.average)}</td>
                  <td className="px-4 py-3 text-foreground">{row.strikeRate.toFixed(1)}</td>
                  <td className="px-4 py-3 text-foreground">{row.fours}</td>
                  <td className="px-4 py-3 text-foreground">{row.sixes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableCard>

        <div className="glass-card rounded-[1.75rem] p-5 sm:p-6">
          <p className="section-title">Batting Insight</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-accent-ink">
            Run concentration
          </h2>
          <p className="mt-4 text-sm leading-7 text-muted">{analytics.battingInsight}</p>
          <div className="mt-6 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topBatters.slice(0, 6)}>
                <CartesianGrid stroke="rgba(18, 34, 28, 0.12)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#5d6f66" }} interval={0} angle={-18} textAnchor="end" height={70} />
                <YAxis tick={{ fontSize: 12, fill: "#5d6f66" }} />
                <Tooltip />
                <Bar dataKey="runs" fill="#1f5a43" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,1fr)]">
        <TableCard title="Bowling Depth" subtitle="Primary wicket-takers">
          <table className="min-w-full divide-y divide-card-border text-sm">
            <thead className="bg-white/80 text-left text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Bowler</th>
                <th className="px-4 py-3 font-medium">Matches</th>
                <th className="px-4 py-3 font-medium">Overs</th>
                <th className="px-4 py-3 font-medium">Runs</th>
                <th className="px-4 py-3 font-medium">Wickets</th>
                <th className="px-4 py-3 font-medium">Econ</th>
                <th className="px-4 py-3 font-medium">Wkts/Match</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-card-border bg-white/55">
              {analytics.bowlerStats.map((row) => (
                <tr key={row.name}>
                  <td className="px-4 py-3 font-medium text-foreground">{row.name}</td>
                  <td className="px-4 py-3 text-foreground">{row.matches}</td>
                  <td className="px-4 py-3 text-foreground">{row.overs.toFixed(1)}</td>
                  <td className="px-4 py-3 text-foreground">{row.runs}</td>
                  <td className="px-4 py-3 text-foreground">{row.wickets}</td>
                  <td className="px-4 py-3 text-foreground">{row.economy.toFixed(2)}</td>
                  <td className="px-4 py-3 text-foreground">{row.avgWicketsPerMatch.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableCard>

        <div className="glass-card rounded-[1.75rem] p-5 sm:p-6">
          <p className="section-title">Bowling Insight</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-accent-ink">
            Depth chart
          </h2>
          <p className="mt-4 text-sm leading-7 text-muted">{analytics.bowlingInsight}</p>
          <div className="mt-6 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.bowlerStats.slice(0, 6)}>
                <CartesianGrid stroke="rgba(18, 34, 28, 0.12)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#5d6f66" }} interval={0} angle={-18} textAnchor="end" height={70} />
                <YAxis tick={{ fontSize: 12, fill: "#5d6f66" }} />
                <Tooltip />
                <Bar dataKey="wickets" fill="#873f2f" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,1fr)]">
        <TableCard title="Home vs Away" subtitle="Record split">
          <table className="min-w-full divide-y divide-card-border text-sm">
            <thead className="bg-white/80 text-left text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Split</th>
                <th className="px-4 py-3 font-medium">Matches</th>
                <th className="px-4 py-3 font-medium">Wins</th>
                <th className="px-4 py-3 font-medium">Losses</th>
                <th className="px-4 py-3 font-medium">Win %</th>
                <th className="px-4 py-3 font-medium">Avg Score</th>
                <th className="px-4 py-3 font-medium">Avg Opposition</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-card-border bg-white/55">
              {([
                ["Home", analytics.homeAway.home],
                ["Away", analytics.homeAway.away],
              ] as const).map(([label, row]) => (
                <tr key={label}>
                  <td className="px-4 py-3 font-medium text-foreground">{label}</td>
                  <td className="px-4 py-3 text-foreground">{row.matches}</td>
                  <td className="px-4 py-3 text-foreground">{row.wins}</td>
                  <td className="px-4 py-3 text-foreground">{row.losses}</td>
                  <td className="px-4 py-3 text-foreground">{formatPercentage(row.winPercent)}</td>
                  <td className="px-4 py-3 text-foreground">{formatAverage(row.avgScore)}</td>
                  <td className="px-4 py-3 text-foreground">{formatAverage(row.avgOppositionScore)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableCard>

        <div className="glass-card rounded-[1.75rem] p-5 sm:p-6">
          <p className="section-title">Home Edge</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-accent-ink">
            Win rate split
          </h2>
          <p className="mt-4 text-sm leading-7 text-muted">{analytics.homeAwayInsight}</p>
          <div className="mt-6 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[
                  { split: "Home", winPercent: analytics.homeAway.home.winPercent },
                  { split: "Away", winPercent: analytics.homeAway.away.winPercent },
                ]}
              >
                <CartesianGrid stroke="rgba(18, 34, 28, 0.12)" vertical={false} />
                <XAxis dataKey="split" tick={{ fontSize: 12, fill: "#5d6f66" }} />
                <YAxis tick={{ fontSize: 12, fill: "#5d6f66" }} />
                <Tooltip />
                <Bar dataKey="winPercent" fill="#1f5a43" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,1fr)]">
        <TableCard title="Season-by-Season Trends" subtitle="Recent first">
          <table className="min-w-full divide-y divide-card-border text-sm">
            <thead className="bg-white/80 text-left text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Season</th>
                <th className="px-4 py-3 font-medium">Matches</th>
                <th className="px-4 py-3 font-medium">Wins</th>
                <th className="px-4 py-3 font-medium">Losses</th>
                <th className="px-4 py-3 font-medium">Win %</th>
                <th className="px-4 py-3 font-medium">Avg Score</th>
                <th className="px-4 py-3 font-medium">Avg Opposition</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-card-border bg-white/55">
              {analytics.seasonTrends.map((row) => (
                <tr key={row.season}>
                  <td className="px-4 py-3 font-medium text-foreground">{row.season}</td>
                  <td className="px-4 py-3 text-foreground">{row.matches}</td>
                  <td className="px-4 py-3 text-foreground">{row.wins}</td>
                  <td className="px-4 py-3 text-foreground">{row.losses}</td>
                  <td className="px-4 py-3 text-foreground">{formatPercentage(row.winPercent)}</td>
                  <td className="px-4 py-3 text-foreground">{formatAverage(row.avgScore)}</td>
                  <td className="px-4 py-3 text-foreground">{formatAverage(row.avgOppositionScore)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableCard>

        <div className="glass-card rounded-[1.75rem] p-5 sm:p-6">
          <p className="section-title">Trend Insight</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-accent-ink">
            Season drift
          </h2>
          <p className="mt-4 text-sm leading-7 text-muted">{analytics.seasonInsight}</p>
          <div className="mt-6 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={[...analytics.seasonTrends].reverse()}>
                <CartesianGrid stroke="rgba(18, 34, 28, 0.12)" vertical={false} />
                <XAxis dataKey="season" tick={{ fontSize: 12, fill: "#5d6f66" }} />
                <YAxis yAxisId="left" tick={{ fontSize: 12, fill: "#5d6f66" }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12, fill: "#5d6f66" }} />
                <Tooltip />
                <Line yAxisId="left" type="monotone" dataKey="winPercent" stroke="#1f5a43" strokeWidth={3} dot={false} />
                <Line yAxisId="right" type="monotone" dataKey="avgScore" stroke="#873f2f" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>
    </>
  );
}
