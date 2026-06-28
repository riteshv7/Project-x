"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { LeagueBadge } from "@/app/components/league-badge";
import { MatchCard } from "@/app/components/match-card";
import { TableCard } from "@/app/components/table-card";
import { LEAGUE_ORDER } from "@/lib/league";
import type { LeagueCode, MatchJson } from "@/lib/types";
import { formatAverage, formatLeagueLabel, formatPercentage, slugifySegment } from "@/lib/utils";

type LeagueFilter = "all" | LeagueCode;

function filterMatches(matches: MatchJson[], league: LeagueFilter) {
  return matches.filter((match) => (league === "all" ? true : match.league === league));
}

export function VenuePageClient({ venue, matches }: { venue: string; matches: MatchJson[] }) {
  const leagues = useMemo(
    () =>
      LEAGUE_ORDER.filter((league) => matches.some((match) => match.league === league)),
    [matches],
  );
  const [league, setLeague] = useState<LeagueFilter>("all");

  const filteredMatches = filterMatches(matches, league);
  const teams = Array.from(
    new Set(filteredMatches.flatMap((match) => [match.teams.team1, match.teams.team2])),
  ).sort((a, b) => a.localeCompare(b));

  const teamPerformance = teams
    .map((teamName) => {
      let wins = 0;
      let losses = 0;
      let battingScoreTotal = 0;
      let inningsCount = 0;

      for (const match of filteredMatches) {
        if (match.teams.team1 !== teamName && match.teams.team2 !== teamName) {
          continue;
        }

        if (match.result.winner === teamName) {
          wins += 1;
        } else if (match.result.winner !== "") {
          losses += 1;
        }

        const battingScore = match.innings.find((innings) => innings.batting_team === teamName)?.final_score;
        if (typeof battingScore === "number") {
          battingScoreTotal += battingScore;
          inningsCount += 1;
        }
      }

      const matchesPlayed = wins + losses;
      return {
        teamName,
        matchesPlayed,
        wins,
        losses,
        winPct: matchesPlayed === 0 ? 0 : (wins / matchesPlayed) * 100,
        avgScore: inningsCount === 0 ? 0 : battingScoreTotal / inningsCount,
      };
    })
    .sort((a, b) => {
      if (b.winPct === a.winPct) {
        return b.matchesPlayed - a.matchesPlayed;
      }
      return b.winPct - a.winPct;
    });

  const inningsScores = filteredMatches.flatMap((match) => match.innings.map((innings) => innings.final_score));
  const avgScore =
    inningsScores.length === 0
      ? 0
      : inningsScores.reduce((sum, score) => sum + score, 0) / inningsScores.length;

  return (
    <>
      <section className="glass-card mt-8 rounded-[1.75rem] px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="section-title">League Context</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-accent-ink">
              {venue}
            </h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {leagues.map((leagueOption) => (
                <div key={leagueOption} className="flex items-center gap-2">
                  <LeagueBadge league={leagueOption} />
                  <span className="text-xs text-muted">{formatLeagueLabel(leagueOption)}</span>
                </div>
              ))}
            </div>
          </div>

          <label className="flex flex-col gap-2 text-sm font-medium text-muted">
            Filter
            <select
              value={league}
              onChange={(event) => setLeague(event.target.value as LeagueFilter)}
              className="rounded-2xl border border-card-border bg-white/80 px-4 py-3 text-foreground outline-none transition focus:border-accent"
            >
              <option value="all">All leagues</option>
              {leagues.map((leagueOption) => (
                <option key={leagueOption} value={leagueOption}>
                  {formatLeagueLabel(leagueOption)}
                </option>
              ))}
            </select>
          </label>
        </div>
        <p className="mt-3 text-sm text-muted">
          Showing {filteredMatches.length} matches {league === "all" ? "across all leagues at this venue." : `for ${formatLeagueLabel(league)} at this venue.`}
        </p>
      </section>

      <section className="mt-8">
        <TableCard title="Venue Table" subtitle="Team performance at this venue">
          <table className="min-w-full divide-y divide-card-border text-sm">
            <thead className="bg-white/80 text-left text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Team</th>
                <th className="px-4 py-3 font-medium">Matches</th>
                <th className="px-4 py-3 font-medium">Wins</th>
                <th className="px-4 py-3 font-medium">Losses</th>
                <th className="px-4 py-3 font-medium">Win %</th>
                <th className="px-4 py-3 font-medium">Avg Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-card-border bg-white/55">
              {teamPerformance.map((team) => (
                <tr key={team.teamName}>
                  <td className="px-4 py-3 font-medium text-foreground">
                    <Link href={`/teams/${slugifySegment(team.teamName)}`} className="transition hover:text-accent-ink">
                      {team.teamName}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-foreground">{team.matchesPlayed}</td>
                  <td className="px-4 py-3 text-foreground">{team.wins}</td>
                  <td className="px-4 py-3 text-foreground">{team.losses}</td>
                  <td className="px-4 py-3 text-foreground">{formatPercentage(team.winPct)}</td>
                  <td className="px-4 py-3 text-foreground">{formatAverage(team.avgScore)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableCard>
      </section>

      <section className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {filteredMatches.map((match) => (
          <MatchCard
            key={match.match_id}
            match={{
              match_id: match.match_id,
              league: match.league,
              date: match.date,
              season: new Date(match.date).getUTCFullYear().toString(),
              venue: match.venue,
              teams: match.teams,
              winner: match.result.winner,
              resultText: `${match.result.winner} won by ${match.result.margin}`,
              scoreline: `${match.innings[0].batting_team} ${match.innings[0].final_score}/${match.innings[0].wickets} (${match.innings[0].overs.toFixed(2)}) • ${match.innings[1].batting_team} ${match.innings[1].final_score}/${match.innings[1].wickets} (${match.innings[1].overs.toFixed(2)})`,
            }}
          />
        ))}
      </section>

      <section className="mt-8">
        <div className="glass-card rounded-[1.75rem] p-5 sm:p-6 text-sm text-muted">
          Average innings score in the current view: <span className="font-semibold text-foreground">{formatAverage(avgScore)}</span>
        </div>
      </section>
    </>
  );
}
