"use client";

import Link from "next/link";
import { useState } from "react";

import { MatchCard } from "@/app/components/match-card";
import type { MatchSummary } from "@/lib/types";
import { teamResultForMatch } from "@/lib/utils";

type ResultFilter = "all" | "won" | "lost";

export function HomePageClient({ matches }: { matches: MatchSummary[] }) {
  const [team, setTeam] = useState("");
  const [season, setSeason] = useState("");
  const [result, setResult] = useState<ResultFilter>("all");

  const teams = Array.from(
    new Set(matches.flatMap((match) => [match.teams.team1, match.teams.team2])),
  ).sort();

  const seasons = Array.from(new Set(matches.map((match) => match.season))).sort(
    (a, b) => Number(b) - Number(a),
  );

  const filteredMatches = matches.filter((match) => {
    if (team && match.teams.team1 !== team && match.teams.team2 !== team) {
      return false;
    }
    if (season && match.season !== season) {
      return false;
    }
    if (result !== "all" && team) {
      return teamResultForMatch(match, team) === result;
    }
    return true;
  });

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-8 sm:px-6 lg:px-8">
      <header className="glass-card rounded-[2rem] px-6 py-8 sm:px-10">
        <p className="section-title">Project X</p>
        <div className="mt-4 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <h1 className="text-5xl font-semibold tracking-[-0.04em] text-accent-ink sm:text-6xl">
              Sightscreen
            </h1>
            <p className="mt-4 max-w-xl text-lg leading-8 text-muted">
              Cricket analysis for the thinking fan. Browse every precomputed IPL match and
              follow how a game bent, tightened, or slipped away.
            </p>
          </div>
          <div className="grid gap-3 text-sm text-muted sm:grid-cols-3">
            <div className="stat-pill rounded-2xl px-4 py-3">
              <div className="text-2xl font-semibold text-accent-ink">{matches.length}</div>
              <div>Matches loaded</div>
            </div>
            <div className="stat-pill rounded-2xl px-4 py-3">
              <div className="text-2xl font-semibold text-accent-ink">{teams.length}</div>
              <div>Teams</div>
            </div>
            <div className="stat-pill rounded-2xl px-4 py-3">
              <div className="text-2xl font-semibold text-accent-ink">{seasons.length}</div>
              <div>Seasons</div>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-3 md:grid-cols-3">
          <Link
            href="/teams"
            className="rounded-2xl border border-card-border bg-white/60 px-5 py-4 text-sm font-medium text-foreground transition hover:border-accent/30 hover:text-accent-ink"
          >
            Browse by team
          </Link>
          <Link
            href="/seasons"
            className="rounded-2xl border border-card-border bg-white/60 px-5 py-4 text-sm font-medium text-foreground transition hover:border-accent/30 hover:text-accent-ink"
          >
            Browse by season
          </Link>
          <Link
            href="/venues"
            className="rounded-2xl border border-card-border bg-white/60 px-5 py-4 text-sm font-medium text-foreground transition hover:border-accent/30 hover:text-accent-ink"
          >
            Browse by venue
          </Link>
        </div>
      </header>

      <section className="glass-card mt-8 rounded-[1.75rem] px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
          <div className="grid flex-1 gap-4 md:grid-cols-3">
            <label className="flex flex-col gap-2 text-sm font-medium text-muted">
              Team
              <select
                value={team}
                onChange={(event) => setTeam(event.target.value)}
                className="rounded-2xl border border-card-border bg-white/80 px-4 py-3 text-foreground outline-none transition focus:border-accent"
              >
                <option value="">All teams</option>
                {teams.map((teamName) => (
                  <option key={teamName} value={teamName}>
                    {teamName}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium text-muted">
              Season
              <select
                value={season}
                onChange={(event) => setSeason(event.target.value)}
                className="rounded-2xl border border-card-border bg-white/80 px-4 py-3 text-foreground outline-none transition focus:border-accent"
              >
                <option value="">All seasons</option>
                {seasons.map((seasonOption) => (
                  <option key={seasonOption} value={seasonOption}>
                    {seasonOption}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium text-muted">
              Result
              <select
                value={result}
                onChange={(event) => setResult(event.target.value as ResultFilter)}
                className="rounded-2xl border border-card-border bg-white/80 px-4 py-3 text-foreground outline-none transition focus:border-accent"
              >
                <option value="all">All results</option>
                <option value="won">Won</option>
                <option value="lost">Lost</option>
              </select>
            </label>
          </div>

          <button
            type="button"
            onClick={() => {
              setTeam("");
              setSeason("");
              setResult("all");
            }}
            className="rounded-2xl border border-accent/20 bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent-ink"
          >
            Reset
          </button>
        </div>
        <p className="mt-3 text-sm text-muted">
          {team
            ? `Showing ${filteredMatches.length} matches for ${team}${result !== "all" ? ` (${result})` : ""}.`
            : `Showing ${filteredMatches.length} matches across all teams.`}
        </p>
      </section>

      <section className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {filteredMatches.map((match) => (
          <MatchCard key={match.match_id} match={match} />
        ))}
      </section>
    </main>
  );
}
