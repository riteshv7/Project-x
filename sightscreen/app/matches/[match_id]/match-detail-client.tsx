"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceDot,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { 
  CaretLeft, 
  Calendar, 
  MapPin, 
  Trophy, 
  Lightning 
} from "@phosphor-icons/react";

import { LeagueBadge } from "@/app/components/league-badge";
import { AddToPlaylistButton } from "@/app/playlists/add-to-playlist-button";
import type {
  BatterScorecardRow,
  BowlerScorecardRow,
  InningsAnalysis,
  MatchJson,
  RunsBreakdown,
} from "@/lib/types";
import {
  formatDisplayDate,
  formatLeagueLabel,
  formatResultText,
  formatScore,
  inningsChartData,
  matchShapeCopy,
  momentSwingText,
  phaseRows,
  pressureLabel,
  slugifySegment,
} from "@/lib/utils";

type MatchDetailTab = "analysis" | "scorecard";

function tabButtonClass(isActive: boolean) {
  return [
    "rounded-full border px-4 py-2 text-sm font-semibold transition sm:px-5 cursor-pointer",
    isActive
      ? "border-accent bg-accent text-white shadow-sm"
      : "border-card-border bg-white/70 text-muted hover:border-accent/30 hover:text-accent-ink",
  ].join(" ");
}

function dataRowClass(index: number) {
  return index % 2 === 0 ? "bg-white/80" : "bg-slate-50/50";
}

function WinProbabilityChart({ innings }: { innings: InningsAnalysis }) {
  const chartData = inningsChartData(innings);

  return (
    <div className="glass-card rounded-[2rem] p-6">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted">Win Probability</span>
          <h3 className="mt-1 text-2xl font-bold tracking-tight text-accent-ink">
            {innings.batting_team}
          </h3>
        </div>
        <div className="rounded-2xl bg-accent-soft px-4 py-2 text-right border border-accent/10">
          <div className="text-[10px] font-bold uppercase tracking-wider text-accent-ink">
            Final
          </div>
          <div className="mt-0.5 text-sm font-bold font-mono text-accent-ink">{formatScore(innings)}</div>
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
            <CartesianGrid stroke="rgba(15, 23, 42, 0.05)" vertical={false} />
            <XAxis
              dataKey="overBall"
              tick={{ fill: "#64748b", fontSize: 11, fontFamily: "monospace" }}
              tickLine={false}
              axisLine={false}
              label={{ value: "Overs", position: "insideBottom", offset: -4, fill: "#64748b", fontSize: 11 }}
            />
            <YAxis
              domain={[0, 1]}
              tickFormatter={(value) => `${Math.round(value * 100)}%`}
              tick={{ fill: "#64748b", fontSize: 11, fontFamily: "monospace" }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              formatter={(value) => {
                const numericValue = typeof value === "number" ? value : Number(value ?? 0);
                return [`${(numericValue * 100).toFixed(1)}%`, "Win Probability"];
              }}
              labelFormatter={(label) => `Over ${label}`}
              contentStyle={{
                borderRadius: 16,
                border: "1px solid rgba(15, 23, 42, 0.08)",
                background: "rgba(255, 255, 255, 0.95)",
                boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05)",
                fontSize: 12,
              }}
            />
            <Line
              type="monotone"
              dataKey="probability"
              stroke="#059669"
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
                fill="#e11d48"
                stroke="#ffffff"
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
    <div className="glass-card rounded-[2rem] p-6">
      <span className="text-[10px] font-bold uppercase tracking-wider text-muted">Pressure Index</span>
      <div className="mt-4 flex items-center justify-between gap-4">
        <div>
          <div className="font-mono text-3xl font-bold tracking-tight text-accent-ink">
            {percent}%
          </div>
          <div className="mt-1 text-xs font-medium text-muted">
            Tension: <span className="text-accent-ink font-semibold">{pressureLabel(innings.pressure_index)}</span>
          </div>
        </div>
        <div className="h-2.5 w-36 overflow-hidden rounded-full bg-slate-100 border border-slate-200/50">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percent}%` }}
            transition={{ type: "spring", stiffness: 80, damping: 15 }}
            className="h-full rounded-full bg-accent"
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
    <section className="glass-card rounded-[2rem] p-3 shadow-md">
      <div aria-label="Match detail tabs" className="flex flex-wrap gap-2" role="tablist">
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
    <div
      aria-labelledby="analysis-tab"
      className="grid gap-6"
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

            <div className="glass-card rounded-[2rem] p-6">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted">Key Moments</span>
              <h3 className="mt-1 text-2xl font-bold tracking-tight text-accent-ink">
                {innings.batting_team}
              </h3>
              <div className="mt-5 space-y-3">
                {innings.key_moments.map((moment) => (
                  <div
                    key={`${innings.innings_number}-${moment.over}-${moment.ball}`}
                    className="rounded-2xl border border-card-border bg-white/50 p-4 transition hover:bg-white/80"
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="mt-0.5 rounded-full bg-rose-50 p-1 text-rose-500 border border-rose-100/50 flex-shrink-0">
                        <Lightning size={14} weight="fill" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-accent-ink">
                          Over <span className="font-mono">{moment.over}.{moment.ball}</span> - {moment.description}
                        </div>
                        <div className="mt-1 text-xs font-mono text-muted">
                          Win-prob swing {momentSwingText(moment)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-6 self-start">
            <PressureBar innings={innings} />

            <div className="glass-card rounded-[2rem] p-6">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted">Phase Splits</span>
              <h3 className="mt-1 text-2xl font-bold tracking-tight text-accent-ink">
                {innings.batting_team}
              </h3>
              <div className="mt-5 overflow-hidden rounded-2xl border border-card-border">
                <table className="min-w-full divide-y divide-card-border text-sm">
                  <thead className="bg-slate-50 text-left text-muted">
                    <tr>
                      <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider">Phase</th>
                      <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider font-mono">Overs</th>
                      <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider font-mono">Runs</th>
                      <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider font-mono">Wkts</th>
                      <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider font-mono">RR</th>
                      <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider font-mono">Req. RR</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-card-border bg-white/30">
                    {phaseRows(innings).map(([label, phase], index) => (
                      <tr key={`${innings.innings_number}-${label}`} className={dataRowClass(index)}>
                        <td className="px-4 py-3 font-medium text-foreground">{label}</td>
                        <td className="px-4 py-3 font-mono text-muted">{phase.overs}</td>
                        <td className="px-4 py-3 font-mono text-foreground">{phase.runs}</td>
                        <td className="px-4 py-3 font-mono text-foreground">{phase.wickets}</td>
                        <td className="px-4 py-3 font-mono text-foreground">{phase.run_rate.toFixed(2)}</td>
                        <td className="px-4 py-3 font-mono text-foreground">
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
              <div className="glass-card rounded-[2rem] p-6">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted">Match Shape</span>
                <h3 className="mt-1 text-2xl font-bold tracking-tight text-accent-ink">
                  Chase Read
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted max-w-[65ch]">
                  {matchShapeCopy(chaseInnings.match_shape)}
                </p>
              </div>
            ) : null}
          </div>
        </div>
      ))}
    </div>
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
    <div className="overflow-x-auto rounded-2xl border border-card-border">
      <table className="min-w-[720px] divide-y divide-card-border text-sm">
        <thead className="bg-slate-50 text-left text-muted">
          <tr>
            <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider">Batter</th>
            <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider font-mono">Runs</th>
            <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider font-mono">Balls</th>
            <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider font-mono">4s</th>
            <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider font-mono">6s</th>
            <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider">Dismissal</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-card-border bg-white/30">
          {sortedBatters.map((batter, index) => (
            <tr key={`${batter.name}-${index}`} className={dataRowClass(index)}>
              <td className="px-4 py-3 font-medium text-foreground">
                <Link
                  href={`/players/${slugifySegment(batter.name)}`}
                  className="text-accent-ink hover:underline font-semibold"
                >
                  {batter.name}
                </Link>
              </td>
              <td className="px-4 py-3 font-mono text-base font-bold text-accent-ink">{batter.runs}</td>
              <td className="px-4 py-3 font-mono text-foreground">{batter.balls}</td>
              <td className="px-4 py-3 font-mono text-foreground">{batter.fours}</td>
              <td className="px-4 py-3 font-mono text-foreground">{batter.sixes}</td>
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
    <div className="overflow-x-auto rounded-2xl border border-card-border">
      <table className="min-w-[640px] divide-y divide-card-border text-sm">
        <thead className="bg-slate-50 text-left text-muted">
          <tr>
            <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider">Bowler</th>
            <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider font-mono">Overs</th>
            <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider font-mono">Runs</th>
            <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider font-mono">Wkts</th>
            <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider font-mono">Econ</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-card-border bg-white/30">
          {sortedBowlers.map((bowler, index) => (
            <tr key={`${bowler.name}-${index}`} className={dataRowClass(index)}>
              <td className="px-4 py-3 font-medium text-foreground">
                <Link
                  href={`/players/${slugifySegment(bowler.name)}`}
                  className="text-accent-ink hover:underline font-semibold"
                >
                  {bowler.name}
                </Link>
              </td>
              <td className="px-4 py-3 font-mono text-foreground">{bowler.overs.toFixed(1)}</td>
              <td className="px-4 py-3 font-mono text-foreground">{bowler.runs_conceded}</td>
              <td className="px-4 py-3 font-mono text-base font-bold text-rose-600">{bowler.wickets}</td>
              <td className="px-4 py-3 font-mono text-foreground">{bowler.economy.toFixed(2)}</td>
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
    <div className="rounded-[1.75rem] border border-card-border bg-white/40 p-6">
      <div className="mb-6 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted">Runs Breakdown</span>
          <p className="mt-1 text-xs text-muted">How the innings total was assembled.</p>
        </div>
        <div className="rounded-2xl bg-accent-soft px-4 py-2 border border-accent/10">
          <div className="text-[10px] font-bold uppercase tracking-wider text-accent-ink">
            Total
          </div>
          <div className="mt-0.5 text-lg font-bold font-mono text-accent-ink">{runsBreakdown.total}</div>
        </div>
      </div>

      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
        {breakdownItems.map(([label, value], index) => {
          const isTotal = index === breakdownItems.length - 1;
          return (
            <div
              key={label}
              className={`rounded-2xl border px-4 py-3 flex flex-col justify-center ${
                isTotal 
                  ? "bg-accent border-accent text-white" 
                  : "bg-white/80 border-card-border"
              }`}
            >
              <div
                className={`text-[9px] font-bold uppercase tracking-wider ${
                  isTotal ? "text-white/80" : "text-muted"
                }`}
              >
                {label}
              </div>
              <div className="mt-1 font-mono text-xl font-bold tracking-tight">{value}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function InningsScorecardSection({ innings }: { innings: InningsAnalysis }) {
  return (
    <section className="glass-card rounded-[2.5rem] p-6 sm:p-8">
      <div className="flex flex-col gap-4 border-b border-card-border pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted">Innings {innings.innings_number}</span>
          <h2 className="mt-1 text-3xl font-bold tracking-tight text-accent-ink">
            {innings.batting_team}
          </h2>
          <p className="mt-1 text-sm text-muted">Bowling: <span className="text-foreground font-medium">{innings.bowling_team}</span></p>
        </div>

        <div className="rounded-[1.75rem] bg-accent-soft px-5 py-4 border border-accent/10">
          <div className="text-[10px] font-bold uppercase tracking-wider text-accent-ink">
            Final Score
          </div>
          <div className="mt-1 font-mono text-2xl font-bold tracking-tight text-accent-ink">
            {innings.final_score}/{innings.wickets}
          </div>
          <div className="mt-0.5 text-xs text-muted font-mono">{innings.overs.toFixed(1)} overs</div>
        </div>
      </div>

      <div className="mt-8 grid gap-8">
        <div className="grid gap-3">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted">Batting</span>
            <h3 className="mt-1 text-xl font-bold tracking-tight text-accent-ink">
              {innings.batting_team}
            </h3>
          </div>
          <BattersTable batters={innings.scorecard.batters} />
        </div>

        <div className="grid gap-3">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted">Bowling</span>
            <h3 className="mt-1 text-xl font-bold tracking-tight text-accent-ink">
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
    <div
      aria-labelledby="scorecard-tab"
      className="grid gap-6"
      id="scorecard-panel"
      role="tabpanel"
    >
      {match.innings.map((innings) => (
        <InningsScorecardSection key={innings.innings_number} innings={innings} />
      ))}
    </div>
  );
}

export function MatchDetailClient({ match }: { match: MatchJson }) {
  const [activeTab, setActiveTab] = useState<MatchDetailTab>("analysis");

  return (
    <main className="mx-auto flex min-h-[100dvh] w-full max-w-7xl flex-col px-4 py-8 sm:px-6 lg:px-8 gap-6">
      <div>
        <Link
          href="/"
          className="group inline-flex items-center gap-2 rounded-full border border-card-border bg-white/70 px-4 py-2 text-sm font-medium text-muted transition hover:border-accent/30 hover:text-accent-ink active:scale-[0.98]"
        >
          <CaretLeft size={16} className="transition-transform group-hover:-translate-x-0.5" />
          Back to Match Browser
        </Link>
      </div>

      {/* Hero Match Header */}
      <section className="glass-card rounded-[2.5rem] p-8 sm:p-10 relative overflow-hidden">
        <p className="sr-only">Match Header</p>
        <div className="absolute top-0 right-0 w-80 h-80 bg-accent/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between relative z-10">
          <div className="space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
              <LeagueBadge league={match.league} />
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
                <Trophy size={14} /> {formatLeagueLabel(match.league)} {new Date(match.date).getUTCFullYear()}
              </span>
            </div>
            
            <h1 className="text-4xl font-bold tracking-tight text-accent-ink sm:text-5xl md:text-6xl leading-tight">
              {match.teams.team1} <span className="text-muted font-normal">vs</span> {match.teams.team2}
            </h1>
            
            <div className="flex flex-wrap gap-x-6 gap-y-2.5 pt-2 text-sm text-muted">
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-muted/70" />
                <span>{match.venue}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-muted/70" />
                <span>{formatDisplayDate(match.date)}</span>
              </div>
            </div>

            <div className="mt-4 inline-block rounded-xl bg-accent-soft/40 border border-accent/8 p-3 px-4">
              <p className="font-semibold text-accent-ink leading-normal">{formatResultText(match)}</p>
              {match.toss && (
                <p className="mt-1 text-xs text-muted">
                  Toss: <span className="font-medium text-foreground">{match.toss.winner}</span> chose to {match.toss.decision}.
                </p>
              )}
            </div>
          </div>

          {/* Scores Stat Section */}
          <div className="grid gap-3 text-sm text-muted sm:grid-cols-2 lg:min-w-[320px]">
            <div className="stat-pill rounded-2xl p-4 flex flex-col justify-center">
              <div className="text-[10px] font-bold uppercase tracking-wider text-accent-ink">
                Innings 1
              </div>
              <div className="mt-1.5 font-mono text-xl font-bold text-accent-ink">
                {formatScore(match.innings[0])}
              </div>
            </div>
            <div className="stat-pill rounded-2xl p-4 flex flex-col justify-center">
              <div className="text-[10px] font-bold uppercase tracking-wider text-accent-ink">
                Innings 2
              </div>
              <div className="mt-1.5 font-mono text-xl font-bold text-accent-ink">
                {formatScore(match.innings[1])}
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-6 border-t border-card-border pt-6 flex items-center justify-between">
          <AddToPlaylistButton matchId={match.match_id} />
        </div>
      </section>

      <TabBar activeTab={activeTab} onChange={setActiveTab} />

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ type: "spring", stiffness: 120, damping: 20 }}
        >
          {activeTab === "analysis" ? <AnalysisTab match={match} /> : <ScorecardTab match={match} />}
        </motion.div>
      </AnimatePresence>
    </main>
  );
}
