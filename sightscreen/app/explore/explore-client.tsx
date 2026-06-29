"use client";

import { useMemo, useState } from "react";

import { MatchCard } from "@/app/components/match-card";
import { LEAGUE_METADATA } from "@/lib/league";
import type { ExploreDataset, MarginBucket } from "@/lib/explore-aggregator";
import type { LeagueCode } from "@/lib/types";
import { formatLeagueLabel } from "@/lib/utils";

type ResultFilter = "all" | "won" | "lost" | "tie";

export function ExploreClient({ dataset }: { dataset: ExploreDataset }) {
  const [selectedLeagues, setSelectedLeagues] = useState<LeagueCode[]>(dataset.options.leagues);
  const [venue, setVenue] = useState("");
  const [team, setTeam] = useState("");
  const [startDate, setStartDate] = useState(dataset.options.minDate);
  const [endDate, setEndDate] = useState(dataset.options.maxDate);
  const [result, setResult] = useState<ResultFilter>("all");
  const [margin, setMargin] = useState<"" | MarginBucket>("");

  const filteredTeams = useMemo(() => {
    const teams = new Set<string>();
    for (const match of dataset.matches) {
      if (!selectedLeagues.includes(match.league)) {
        continue;
      }
      if (venue && match.venue !== venue) {
        continue;
      }
      teams.add(match.teams.team1);
      teams.add(match.teams.team2);
    }
    return Array.from(teams).sort((left, right) => left.localeCompare(right));
  }, [dataset.matches, selectedLeagues, venue]);

  const filteredMatches = dataset.matches.filter((match) => {
    if (!selectedLeagues.includes(match.league)) {
      return false;
    }
    if (venue && match.venue !== venue) {
      return false;
    }
    if (team && match.teams.team1 !== team && match.teams.team2 !== team) {
      return false;
    }
    if (startDate && match.date < startDate) {
      return false;
    }
    if (endDate && match.date > endDate) {
      return false;
    }
    if (margin && match.marginBucket !== margin) {
      return false;
    }
    if (result === "tie") {
      return !match.winner;
    }
    if (result === "won") {
      return team ? match.winner === team : Boolean(match.winner);
    }
    if (result === "lost") {
      return team ? Boolean(match.winner) && match.winner !== team : false;
    }
    return true;
  });

  function toggleLeague(league: LeagueCode) {
    setSelectedLeagues((current) => {
      const next = current.includes(league)
        ? current.filter((item) => item !== league)
        : [...current, league];
      return next.length ? next : current;
    });
    setTeam("");
  }

  return (
    <>
      <section className="glass-card rounded-[2rem] px-6 py-8 sm:px-10">
        <p className="section-title">Advanced Filters</p>
        <div className="mt-4 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <h1 className="text-4xl font-semibold tracking-[-0.04em] text-accent-ink sm:text-5xl">
              Explore matches
            </h1>
            <p className="mt-4 text-lg leading-8 text-muted">
              Find games by league, venue, team, date, result, and margin across the full
              Sightscreen archive.
            </p>
          </div>
          <div className="grid gap-3 text-sm text-muted sm:grid-cols-2">
            <div className="stat-pill rounded-2xl px-4 py-3">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-ink">
                Showing
              </div>
              <div className="mt-1 text-sm font-medium text-foreground">{filteredMatches.length}</div>
            </div>
            <div className="stat-pill rounded-2xl px-4 py-3">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-ink">
                Archive
              </div>
              <div className="mt-1 text-sm font-medium text-foreground">{dataset.matches.length}</div>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
        <aside className="glass-card h-fit rounded-[1.75rem] p-5 xl:sticky xl:top-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="section-title">Filters</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-accent-ink">
                Match finder
              </h2>
            </div>
            <button
              type="button"
              onClick={() => {
                setSelectedLeagues(dataset.options.leagues);
                setVenue("");
                setTeam("");
                setStartDate(dataset.options.minDate);
                setEndDate(dataset.options.maxDate);
                setResult("all");
                setMargin("");
              }}
              className="rounded-2xl border border-accent/20 bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent-ink"
            >
              Reset
            </button>
          </div>

          <div className="mt-6 grid gap-5">
            <fieldset>
              <legend className="text-sm font-semibold text-muted">League</legend>
              <div className="mt-3 grid gap-2">
                {dataset.options.leagues.map((league) => (
                  <label key={league} className="flex items-center gap-3 text-sm text-foreground">
                    <input
                      type="checkbox"
                      checked={selectedLeagues.includes(league)}
                      onChange={() => toggleLeague(league)}
                      className="h-4 w-4 accent-[#1f5a43]"
                    />
                    {LEAGUE_METADATA[league].name}
                  </label>
                ))}
              </div>
            </fieldset>

            <label className="flex flex-col gap-2 text-sm font-medium text-muted">
              Venue
              <select
                value={venue}
                onChange={(event) => {
                  setVenue(event.target.value);
                  setTeam("");
                }}
                className="rounded-2xl border border-card-border bg-white/80 px-4 py-3 text-foreground outline-none transition focus:border-accent"
              >
                <option value="">All venues</option>
                {dataset.options.venues.map((venueName) => (
                  <option key={venueName} value={venueName}>
                    {venueName}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium text-muted">
              Team
              <select
                value={team}
                onChange={(event) => setTeam(event.target.value)}
                className="rounded-2xl border border-card-border bg-white/80 px-4 py-3 text-foreground outline-none transition focus:border-accent"
              >
                <option value="">All teams</option>
                {filteredTeams.map((teamName) => (
                  <option key={teamName} value={teamName}>
                    {teamName}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <label className="flex flex-col gap-2 text-sm font-medium text-muted">
                Start date
                <input
                  type="date"
                  value={startDate}
                  min={dataset.options.minDate}
                  max={dataset.options.maxDate}
                  onChange={(event) => setStartDate(event.target.value)}
                  className="rounded-2xl border border-card-border bg-white/80 px-4 py-3 text-foreground outline-none transition focus:border-accent"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-muted">
                End date
                <input
                  type="date"
                  value={endDate}
                  min={dataset.options.minDate}
                  max={dataset.options.maxDate}
                  onChange={(event) => setEndDate(event.target.value)}
                  className="rounded-2xl border border-card-border bg-white/80 px-4 py-3 text-foreground outline-none transition focus:border-accent"
                />
              </label>
            </div>

            <label className="flex flex-col gap-2 text-sm font-medium text-muted">
              Result
              <select
                value={result}
                onChange={(event) => setResult(event.target.value as ResultFilter)}
                className="rounded-2xl border border-card-border bg-white/80 px-4 py-3 text-foreground outline-none transition focus:border-accent"
              >
                <option value="all">All results</option>
                <option value="won">{team ? `${team} won` : "Any winner"}</option>
                <option value="lost">{team ? `${team} lost` : "Team lost"}</option>
                <option value="tie">Tie or no result</option>
              </select>
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium text-muted">
              Margin
              <select
                value={margin}
                onChange={(event) => setMargin(event.target.value as "" | MarginBucket)}
                className="rounded-2xl border border-card-border bg-white/80 px-4 py-3 text-foreground outline-none transition focus:border-accent"
              >
                <option value="">All margins</option>
                {dataset.options.margins.map((marginOption) => (
                  <option key={marginOption.value} value={marginOption.value}>
                    {marginOption.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </aside>

        <div>
          <div className="glass-card rounded-[1.75rem] px-5 py-5 sm:px-6">
            <p className="section-title">Match Results</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-accent-ink">
              Showing {filteredMatches.length} matches
            </h2>
            <p className="mt-2 text-sm text-muted">
              {selectedLeagues.map((league) => formatLeagueLabel(league)).join(", ")}
            </p>
          </div>

          <section className="mt-6 grid gap-5 md:grid-cols-2">
            {filteredMatches.map((match) => (
              <MatchCard key={match.match_id} match={match} />
            ))}
          </section>
        </div>
      </section>
    </>
  );
}
