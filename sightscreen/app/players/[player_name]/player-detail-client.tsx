"use client";

import Link from "next/link";

import { LeagueBadge } from "@/app/components/league-badge";
import { MatchCard } from "@/app/components/match-card";
import { GridSection, HeroCard, StatPill } from "@/app/components/section-shell";
import { TableCard } from "@/app/components/table-card";
import { CompareControl } from "@/app/players/[player_name]/compare-control";
import type { PlayerDirectoryEntry, PlayerStats } from "@/lib/player-aggregator";
import { formatDisplayDate, formatLeagueLabel } from "@/lib/utils";

function statValue(value: number | null, digits = 1) {
  return value === null ? "-" : value.toFixed(digits);
}

export function PlayerDetailClient({
  stats,
  currentPlayer,
  comparisonPlayers,
}: {
  stats: PlayerStats;
  currentPlayer: PlayerDirectoryEntry | null;
  comparisonPlayers: PlayerDirectoryEntry[];
}) {
  return (
    <>
      <HeroCard
        eyebrow="Player Page"
        title={stats.name}
        description={
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {stats.leagues.map((league) => (
                <LeagueBadge key={league} league={league} />
              ))}
            </div>
            <p>
              First appearance {formatDisplayDate(stats.firstAppearance)}. Last appearance{" "}
              {formatDisplayDate(stats.lastAppearance)}. Nationality is not available in the current
              scorecard bundle.
            </p>
          </div>
        }
        aside={
          <>
            <StatPill label="Matches" value={stats.totalMatches} />
            <StatPill label="Runs" value={stats.batting.runs} />
            <StatPill label="Wickets" value={stats.bowling.wickets} />
            <StatPill label="Highest" value={stats.batting.highestScore} />
          </>
        }
      />

      <section className="mt-8 grid gap-6 xl:grid-cols-2">
        <TableCard title="Career Stats" subtitle="Batting">
          <table className="min-w-full divide-y divide-card-border text-sm">
            <tbody className="divide-y divide-card-border bg-white/55">
              {[
                ["Matches", stats.batting.matches],
                ["Runs", stats.batting.runs],
                ["Balls", stats.batting.balls],
                ["Average", statValue(stats.batting.average)],
                ["Strike Rate", stats.batting.strikeRate.toFixed(1)],
                ["4s", stats.batting.fours],
                ["6s", stats.batting.sixes],
                ["Highest Score", stats.batting.highestScore],
              ].map(([label, value], index) => (
                <tr key={label} className={index % 2 === 0 ? "bg-white/80" : "bg-[#f4ecdf]/70"}>
                  <td className="px-4 py-3 font-medium text-muted">{label}</td>
                  <td className="px-4 py-3 text-right font-semibold text-accent-ink">{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableCard>

        <TableCard title="Career Stats" subtitle="Bowling">
          <table className="min-w-full divide-y divide-card-border text-sm">
            <tbody className="divide-y divide-card-border bg-white/55">
              {[
                ["Matches", stats.bowling.matches],
                ["Overs", stats.bowling.overs.toFixed(1)],
                ["Runs", stats.bowling.runs],
                ["Wickets", stats.bowling.wickets],
                ["Economy", stats.bowling.economy.toFixed(2)],
                ["Strike Rate", statValue(stats.bowling.strikeRate)],
                ["Best Figures", stats.bowling.bestFigures],
              ].map(([label, value], index) => (
                <tr key={label} className={index % 2 === 0 ? "bg-white/80" : "bg-[#f4ecdf]/70"}>
                  <td className="px-4 py-3 font-medium text-muted">{label}</td>
                  <td className="px-4 py-3 text-right font-semibold text-accent-ink">{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableCard>
      </section>

      {currentPlayer && comparisonPlayers.some((player) => player.slug === currentPlayer.slug) ? (
        <section className="mt-8">
          <CompareControl player={currentPlayer} options={comparisonPlayers} />
        </section>
      ) : null}

      <GridSection title="Breakdowns">
        <div className="grid gap-6 xl:grid-cols-2">
          <TableCard title="League Breakdown" subtitle="Runs and wickets">
            <table className="min-w-full divide-y divide-card-border text-sm">
              <thead className="bg-white/80 text-left text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">League</th>
                  <th className="px-4 py-3 font-medium">Matches</th>
                  <th className="px-4 py-3 font-medium">Runs</th>
                  <th className="px-4 py-3 font-medium">Wickets</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-card-border bg-white/55">
                {stats.leagueBreakdown.map((row) => (
                  <tr key={row.league}>
                    <td className="px-4 py-3 font-medium text-foreground">
                      {formatLeagueLabel(row.league)}
                    </td>
                    <td className="px-4 py-3 text-foreground">{row.matches}</td>
                    <td className="px-4 py-3 text-foreground">{row.runs}</td>
                    <td className="px-4 py-3 text-foreground">{row.wickets}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableCard>

          <TableCard title="Season Breakdown" subtitle="Recent first">
            <table className="min-w-full divide-y divide-card-border text-sm">
              <thead className="bg-white/80 text-left text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Season</th>
                  <th className="px-4 py-3 font-medium">Matches</th>
                  <th className="px-4 py-3 font-medium">Runs</th>
                  <th className="px-4 py-3 font-medium">Wickets</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-card-border bg-white/55">
                {stats.seasonBreakdown.map((row) => (
                  <tr key={row.season}>
                    <td className="px-4 py-3 font-medium text-foreground">{row.season}</td>
                    <td className="px-4 py-3 text-foreground">{row.matches}</td>
                    <td className="px-4 py-3 text-foreground">{row.runs}</td>
                    <td className="px-4 py-3 text-foreground">{row.wickets}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableCard>
        </div>
      </GridSection>

      <GridSection title="Match-by-match">
        <TableCard title="Appearances" subtitle="Most recent first">
          <table className="min-w-[980px] divide-y divide-card-border text-sm">
            <thead className="bg-white/80 text-left text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">League</th>
                <th className="px-4 py-3 font-medium">Opponent</th>
                <th className="px-4 py-3 font-medium">Venue</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Runs/Wickets</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Match</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-card-border bg-white/55">
              {stats.appearances.map((appearance) => (
                <tr key={appearance.match.match_id}>
                  <td className="px-4 py-3 text-foreground">
                    {formatDisplayDate(appearance.match.date)}
                  </td>
                  <td className="px-4 py-3 text-foreground">
                    {formatLeagueLabel(appearance.match.league)}
                  </td>
                  <td className="px-4 py-3 text-foreground">{appearance.opponent}</td>
                  <td className="px-4 py-3 text-muted">{appearance.match.venue}</td>
                  <td className="px-4 py-3 text-foreground">{appearance.role}</td>
                  <td className="px-4 py-3 font-semibold text-accent-ink">
                    {appearance.runs ?? "-"} / {appearance.wickets ?? "-"}
                  </td>
                  <td className="px-4 py-3 text-muted">{appearance.status}</td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/matches/${appearance.match.match_id}`}
                      className="font-medium text-accent-ink hover:underline"
                    >
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableCard>
      </GridSection>

      <GridSection title="Recent Matches">
        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {stats.appearances.slice(0, 6).map((appearance) => (
            <MatchCard key={appearance.match.match_id} match={appearance.match} />
          ))}
        </section>
      </GridSection>
    </>
  );
}
