"use client";

import Link from "next/link";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceDot,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { InningsAnalysis, MatchJson } from "@/lib/types";
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
          <LineChart width={820} height={288} data={chartData} margin={{ top: 8, right: 12, left: -20, bottom: 0 }}>
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

export function MatchDetailClient({ match }: { match: MatchJson }) {
  const chaseInnings = match.innings[1];

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full border border-card-border bg-white/70 px-4 py-2 text-sm font-medium text-muted transition hover:border-accent/30 hover:text-accent-ink"
        >
          ← Back to match browser
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
              {match.venue} • {formatDisplayDate(match.date)}
            </p>
            <p className="mt-2 text-base font-medium text-foreground">
              {formatResultText(match)}
            </p>
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

      <section className="mt-8 grid gap-6">
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
                        Over {moment.over}.{moment.ball} — {moment.description}
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
                      {phaseRows(innings).map(([label, phase]) => (
                        <tr key={`${innings.innings_number}-${label}`}>
                          <td className="px-4 py-3 font-medium text-foreground">{label}</td>
                          <td className="px-4 py-3 text-muted">{phase.overs}</td>
                          <td className="px-4 py-3 text-foreground">{phase.runs}</td>
                          <td className="px-4 py-3 text-foreground">{phase.wickets}</td>
                          <td className="px-4 py-3 text-foreground">{phase.run_rate.toFixed(2)}</td>
                          <td className="px-4 py-3 text-foreground">
                            {phase.required_run_rate === null
                              ? "—"
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
    </main>
  );
}
