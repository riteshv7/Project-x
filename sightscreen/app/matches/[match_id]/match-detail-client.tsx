"use client";

import Link from "next/link";
import { useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceDot,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type {
  BatterScorecardRow,
  BowlerScorecardRow,
  InningsAnalysis,
  MatchJson,
  RunsBreakdown,
} from "@/lib/types";
import {
  formatDisplayDate,
  formatResultText,
  formatScore,
  inningsChartData,
  matchShapeCopy,
  momentSwingText,
  phaseRows,
  pressureLabel,
} from "@/lib/utils";

type MatchDetailTab = "analysis" | "scorecard";

function tabButtonClass(isActive: boolean) {
  return [
    "rounded-full border px-4 py-2 text-sm font-semibold transition sm:px-5",
    isActive
      ? "border-accent bg-accent text-white shadow-[0_12px_30px_rgba(31,90,67,0.22)]"
      : "border-card-border bg-white/70 text-muted hover:border-accent/30 hover:text-accent-ink",
  ].join(" ");
}

function dataRowClass(index: number) {
  return index % 2 === 0 ? "bg-white/80" : "bg-[#f4ecdf]/70";
}

function WinProbabilityChart({ innings }: { innings: InningsAnalysis }) {
  const chartData = inningsChartData(innings);

  return (
    <div className="glass-card rounded-[1.75rem] p-5 sm:p-6">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <p className="section-title">Win Probability</p>
          <h3 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-accent-ink">
            {innings.batting_team}
          </h3>
        </div>
        <div className="rounded-2xl bg-accent-soft px-4 py-2 text-right">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-ink">
            Final
          </div>
          <div className="mt-1 text-sm font-medium text-foreground">{formatScore(innings)}</div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[720px]">
          <LineChart
            width={820}
            height={288}
            data={chartData}
            margin={{ top: 8, right: 12, left: -20, bottom: 0 }}
          >
            <CartesianGrid stroke="rgba(18, 34, 28, 0.12)" vertical={false} />
            <XAxis
              dataKey="overBall"
              tick={{ fill: "#5d6f66", fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              label={{ value: "Overs", position: "insideBottom", offset: -4, fill: "#5d6f66" }}
            />
            <YAxis
              domain={[0, 1]}
              tickFormatter={(value) => `${Math.round(value * 100)}%`}
              tick={{ fill: "#5d6f66", fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              formatter={(value) => {
                const numericValue = typeof value === "number" ? value : Number(value ?? 0);
                return [`${(numericValue * 100).toFixed(1)}%`, "Win probability"];
              }}
              labelFormatter={(label) => `Over ${label}`}
              contentStyle={{
                borderRadius: 18,
                border: "1px solid rgba(29, 58, 47, 0.16)",
                background: "rgba(255, 250, 241, 0.96)",
              }}
            />
            <Line
              type="monotone"
              dataKey="probability"
              stroke="#1f5a43"
              strokeWidth={3}
              dot={false}
              isAnimationActive={false}
            />
            {innings.key_moments.map((moment) => (
              <ReferenceDot
                key={`${innings.innings_number}-${moment.over}-${moment.ball}`}
                x={Number((moment.over + moment.ball / 10).toFixed(1))}
                y={moment.probability_before}
                r={5}
                fill="#873f2f"
                stroke="#fffaf1"
                strokeWidth={2}
              />
            ))}
          </LineChart>
        </div>
      </div>
    </div>
  );
}

function PressureBar({ innings }: { innings: InningsAnalysis }) {
  const percent = Math.round(innings.pressure_index * 100);

  return (
    <div className="glass-card rounded-[1.75rem] p-5 sm:p-6">
      <p className="section-title">Pressure Index</p>
      <div className="mt-3 flex items-end justify-between gap-4">
        <div>
          <div className="text-4xl font-semibold tracking-[-0.04em] text-accent-ink">
            {percent}%
          </div>
          <div className="mt-1 text-sm text-muted">
            Match tension: {pressureLabel(innings.pressure_index)}
          </div>
        </div>
        <div className="h-3 w-36 overflow-hidden rounded-full bg-accent-soft">
          <div
            className="h-full rounded-full bg-accent transition-all"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function TabBar({
  activeTab,
  onChange,
}: {
  activeTab: MatchDetailTab;
  onChange: (tab: MatchDetailTab) => void;
}) {
  return (
    <section className="mt-6 glass-card rounded-[1.75rem] px-4 py-4 sm:px-6">
      <div aria-label="Match detail tabs" className="flex flex-wrap gap-3" role="tablist">
        <button
          aria-controls="analysis-panel"
          aria-selected={activeTab === "analysis"}
          className={tabButtonClass(activeTab === "analysis")}
          id="analysis-tab"
          role="tab"
          type="button"
          onClick={() => onChange("analysis")}
        >
          Analysis
        </button>
        <button
          aria-controls="scorecard-panel"
          aria-selected={activeTab === "scorecard"}
          className={tabButtonClass(activeTab === "scorecard")}
          id="scorecard-tab"
          role="tab"
          type="button"
          onClick={() => onChange("scorecard")}
        >
          Scorecard
        </button>
      </div>
    </section>
  );
}

function AnalysisTab({ match }: { match: MatchJson }) {
  const chaseInnings = match.innings[1];

  return (
    <section
      aria-labelledby="analysis-tab"
      className="mt-8 grid gap-6"
      id="analysis-panel"
      role="tabpanel"
    >
      {match.innings.map((innings) => (
        <div
          key={innings.innings_number}
          className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]"
        >
          <div className="grid gap-6">
            <WinProbabilityChart innings={innings} />

            <div className="glass-card rounded-[1.75rem] p-5 sm:p-6">
              <p className="section-title">Key Moments</p>
              <h3 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-accent-ink">
                {innings.batting_team}
              </h3>
              <div className="mt-5 space-y-3">
                {innings.key_moments.map((moment) => (
                  <div
                    key={`${innings.innings_number}-${moment.over}-${moment.ball}`}
                    className="rounded-2xl border border-card-border bg-white/70 px-4 py-4"
                  >
                    <div className="text-sm font-semibold text-accent-ink">
                      Over {moment.over}.{moment.ball} - {moment.description}
                    </div>
                    <div className="mt-1 text-sm text-muted">
                      Win-prob swing {momentSwingText(moment)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-6">
            <PressureBar innings={innings} />

            <div className="glass-card rounded-[1.75rem] p-5 sm:p-6">
              <p className="section-title">Phase Splits</p>
              <h3 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-accent-ink">
                {innings.batting_team}
              </h3>
              <div className="mt-5 overflow-hidden rounded-2xl border border-card-border">
                <table className="min-w-full divide-y divide-card-border text-sm">
                  <thead className="bg-white/80 text-left text-muted">
                    <tr>
                      <th className="px-4 py-3 font-medium">Phase</th>
                      <th className="px-4 py-3 font-medium">Overs</th>
                      <th className="px-4 py-3 font-medium">Runs</th>
                      <th className="px-4 py-3 font-medium">Wickets</th>
                      <th className="px-4 py-3 font-medium">RR</th>
                      <th className="px-4 py-3 font-medium">Req. RR</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-card-border bg-white/55">
                    {phaseRows(innings).map(([label, phase], index) => (
                      <tr key={`${innings.innings_number}-${label}`} className={dataRowClass(index)}>
                        <td className="px-4 py-3 font-medium text-foreground">{label}</td>
                        <td className="px-4 py-3 text-muted">{phase.overs}</td>
                        <td className="px-4 py-3 text-foreground">{phase.runs}</td>
                        <td className="px-4 py-3 text-foreground">{phase.wickets}</td>
                        <td className="px-4 py-3 text-foreground">{phase.run_rate.toFixed(2)}</td>
                        <td className="px-4 py-3 text-foreground">
                          {phase.required_run_rate === null
                            ? "-"
                            : phase.required_run_rate.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {innings.innings_number === 2 ? (
              <div className="glass-card rounded-[1.75rem] p-5 sm:p-6">
                <p className="section-title">Match Shape</p>
                <h3 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-accent-ink">
                  Chase read
                </h3>
                <p className="mt-4 text-base leading-7 text-muted">
                  {matchShapeCopy(chaseInnings.match_shape)}
                </p>
              </div>
            ) : null}
          </div>
        </div>
      ))}
    </section>
  );
}

function BattersTable({ batters }: { batters: BatterScorecardRow[] }) {
  const sortedBatters = [...batters].sort((left, right) => {
    if (right.runs !== left.runs) {
      return right.runs - left.runs;
    }
    if (left.balls !== right.balls) {
      return left.balls - right.balls;
    }
    return left.name.localeCompare(right.name);
  });

  return (
    <div className="overflow-x-auto rounded-[1.5rem] border border-card-border">
      <table className="min-w-[720px] divide-y divide-card-border text-sm">
        <thead className="bg-[#f8f1e5] text-left text-muted">
          <tr>
            <th className="px-4 py-3 font-medium">Batter</th>
            <th className="px-4 py-3 font-medium">R</th>
            <th className="px-4 py-3 font-medium">B</th>
            <th className="px-4 py-3 font-medium">4s</th>
            <th className="px-4 py-3 font-medium">6s</th>
            <th className="px-4 py-3 font-medium">Dismissal</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-card-border">
          {sortedBatters.map((batter, index) => (
            <tr key={`${batter.name}-${index}`} className={dataRowClass(index)}>
              <td className="px-4 py-3 font-medium text-foreground">{batter.name}</td>
              <td className="px-4 py-3 text-base font-semibold text-accent-ink">{batter.runs}</td>
              <td className="px-4 py-3 text-foreground">{batter.balls}</td>
              <td className="px-4 py-3 text-foreground">{batter.fours}</td>
              <td className="px-4 py-3 text-foreground">{batter.sixes}</td>
              <td className="px-4 py-3 text-muted">{batter.dismissal || batter.dismissal_type}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BowlersTable({ bowlers }: { bowlers: BowlerScorecardRow[] }) {
  const sortedBowlers = [...bowlers].sort((left, right) => {
    if (right.wickets !== left.wickets) {
      return right.wickets - left.wickets;
    }
    if (left.economy !== right.economy) {
      return left.economy - right.economy;
    }
    return left.name.localeCompare(right.name);
  });

  return (
    <div className="overflow-x-auto rounded-[1.5rem] border border-card-border">
      <table className="min-w-[640px] divide-y divide-card-border text-sm">
        <thead className="bg-[#f8f1e5] text-left text-muted">
          <tr>
            <th className="px-4 py-3 font-medium">Bowler</th>
            <th className="px-4 py-3 font-medium">O</th>
            <th className="px-4 py-3 font-medium">R</th>
            <th className="px-4 py-3 font-medium">W</th>
            <th className="px-4 py-3 font-medium">Econ</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-card-border">
          {sortedBowlers.map((bowler, index) => (
            <tr key={`${bowler.name}-${index}`} className={dataRowClass(index)}>
              <td className="px-4 py-3 font-medium text-foreground">{bowler.name}</td>
              <td className="px-4 py-3 text-foreground">{bowler.overs.toFixed(1)}</td>
              <td className="px-4 py-3 text-foreground">{bowler.runs_conceded}</td>
              <td className="px-4 py-3 text-base font-semibold text-[#873f2f]">{bowler.wickets}</td>
              <td className="px-4 py-3 text-foreground">{bowler.economy.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RunsBreakdownCard({ runsBreakdown }: { runsBreakdown: RunsBreakdown }) {
  const breakdownItems = [
    ["Runs off bat", runsBreakdown.runs_off_bat],
    ["Byes", runsBreakdown.byes],
    ["Leg byes", runsBreakdown.legbyes],
    ["Wides", runsBreakdown.wides],
    ["No-balls", runsBreakdown.noballs],
    ["Total", runsBreakdown.total],
  ] as const;

  return (
    <div className="rounded-[1.5rem] border border-card-border bg-white/75 p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="section-title">Runs Breakdown</p>
          <p className="mt-1 text-sm text-muted">How the innings total was assembled.</p>
        </div>
        <div className="rounded-2xl bg-accent-soft px-4 py-2 text-right">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-ink">
            Total
          </div>
          <div className="mt-1 text-lg font-semibold text-accent-ink">{runsBreakdown.total}</div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {breakdownItems.map(([label, value], index) => (
          <div
            key={label}
            className={`rounded-2xl border border-card-border px-4 py-3 ${
              index === breakdownItems.length - 1 ? "bg-accent text-white" : "bg-[#f8f1e5]"
            }`}
          >
            <div
              className={`text-xs font-semibold uppercase tracking-[0.18em] ${
                index === breakdownItems.length - 1 ? "text-white/80" : "text-accent-ink"
              }`}
            >
              {label}
            </div>
            <div className="mt-2 text-2xl font-semibold tracking-[-0.03em]">{value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function InningsScorecardSection({ innings }: { innings: InningsAnalysis }) {
  return (
    <section className="glass-card rounded-[2rem] p-6 sm:p-7">
      <div className="flex flex-col gap-4 border-b border-card-border pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="section-title">Innings {innings.innings_number}</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-accent-ink">
            {innings.batting_team}
          </h2>
          <p className="mt-2 text-base text-muted">Bowling: {innings.bowling_team}</p>
        </div>

        <div className="rounded-[1.5rem] bg-accent-soft px-5 py-4">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-ink">
            Final Score
          </div>
          <div className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-accent-ink">
            {innings.final_score}/{innings.wickets}
          </div>
          <div className="mt-1 text-sm text-muted">{innings.overs.toFixed(1)} overs</div>
        </div>
      </div>

      <div className="mt-6 grid gap-6">
        <div className="grid gap-3">
          <div>
            <p className="section-title">Batters</p>
            <h3 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-accent-ink">
              {innings.batting_team}
            </h3>
          </div>
          <BattersTable batters={innings.scorecard.batters} />
        </div>

        <div className="grid gap-3">
          <div>
            <p className="section-title">Bowlers</p>
            <h3 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-accent-ink">
              {innings.bowling_team}
            </h3>
          </div>
          <BowlersTable bowlers={innings.scorecard.bowlers} />
        </div>

        <RunsBreakdownCard runsBreakdown={innings.scorecard.runs_breakdown} />
      </div>
    </section>
  );
}

function ScorecardTab({ match }: { match: MatchJson }) {
  return (
    <section
      aria-labelledby="scorecard-tab"
      className="mt-8 grid gap-6"
      id="scorecard-panel"
      role="tabpanel"
    >
      {match.innings.map((innings) => (
        <InningsScorecardSection key={innings.innings_number} innings={innings} />
      ))}
    </section>
  );
}

export function MatchDetailClient({ match }: { match: MatchJson }) {
  const [activeTab, setActiveTab] = useState<MatchDetailTab>("analysis");

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full border border-card-border bg-white/70 px-4 py-2 text-sm font-medium text-muted transition hover:border-accent/30 hover:text-accent-ink"
        >
          Back to match browser
        </Link>
      </div>

      <section className="glass-card rounded-[2rem] px-6 py-8 sm:px-10">
        <p className="section-title">Match Header</p>
        <div className="mt-4 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-4xl font-semibold tracking-[-0.04em] text-accent-ink sm:text-5xl">
              {match.teams.team1} vs {match.teams.team2}
            </h1>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-muted">
              {match.venue} | {formatDisplayDate(match.date)}
            </p>
            <p className="mt-2 text-base font-medium text-foreground">{formatResultText(match)}</p>
            {match.toss ? (
              <p className="mt-2 text-sm text-muted">
                Toss: {match.toss.winner} chose to {match.toss.decision}.
              </p>
            ) : null}
          </div>

          <div className="grid gap-3 text-sm text-muted sm:grid-cols-2">
            <div className="stat-pill rounded-2xl px-4 py-3">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-ink">
                Innings 1
              </div>
              <div className="mt-1 text-sm font-medium text-foreground">
                {formatScore(match.innings[0])}
              </div>
            </div>
            <div className="stat-pill rounded-2xl px-4 py-3">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-ink">
                Innings 2
              </div>
              <div className="mt-1 text-sm font-medium text-foreground">
                {formatScore(match.innings[1])}
              </div>
            </div>
          </div>
        </div>
      </section>

      <TabBar activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === "analysis" ? <AnalysisTab match={match} /> : <ScorecardTab match={match} />}
    </main>
  );
}
