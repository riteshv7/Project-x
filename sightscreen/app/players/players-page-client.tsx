"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { LeagueBadge } from "@/app/components/league-badge";
import type { PlayerDirectoryEntry } from "@/lib/player-aggregator";
import { formatDisplayDate } from "@/lib/utils";

export function PlayersPageClient({ players }: { players: PlayerDirectoryEntry[] }) {
  const [query, setQuery] = useState("");
  const [role, setRole] = useState<"all" | "batters" | "bowlers">("all");

  const filteredPlayers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return players
      .filter((player) => {
        if (normalizedQuery && !player.name.toLowerCase().includes(normalizedQuery)) {
          return false;
        }
        if (role === "batters") {
          return player.battingRuns > 0;
        }
        if (role === "bowlers") {
          return player.bowlingWickets > 0;
        }
        return true;
      })
      .slice(0, 300);
  }, [players, query, role]);

  return (
    <>
      <section className="glass-card rounded-[2rem] px-6 py-8 sm:px-10">
        <p className="section-title">Players</p>
        <div className="mt-4 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <h1 className="text-4xl font-semibold tracking-[-0.04em] text-accent-ink sm:text-5xl">
              Player browser
            </h1>
            <p className="mt-4 text-lg leading-8 text-muted">
              Search scorecard-derived batting and bowling records across IPL, BBL, PSL, SA20, and
              The Hundred.
            </p>
          </div>
          <div className="grid gap-3 text-sm text-muted sm:grid-cols-2">
            <div className="stat-pill rounded-2xl px-4 py-3">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-ink">
                Unique players
              </div>
              <div className="mt-1 text-sm font-medium text-foreground">{players.length}</div>
            </div>
            <div className="stat-pill rounded-2xl px-4 py-3">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-ink">
                Showing
              </div>
              <div className="mt-1 text-sm font-medium text-foreground">{filteredPlayers.length}</div>
            </div>
          </div>
        </div>
      </section>

      <section className="glass-card mt-8 rounded-[1.75rem] px-5 py-5 sm:px-6">
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px]">
          <label className="flex flex-col gap-2 text-sm font-medium text-muted">
            Search player
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Rohit Sharma, Rashid Khan..."
              className="rounded-2xl border border-card-border bg-white/80 px-4 py-3 text-foreground outline-none transition focus:border-accent"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-muted">
            Role
            <select
              value={role}
              onChange={(event) => setRole(event.target.value as "all" | "batters" | "bowlers")}
              className="rounded-2xl border border-card-border bg-white/80 px-4 py-3 text-foreground outline-none transition focus:border-accent"
            >
              <option value="all">All players</option>
              <option value="batters">Batters</option>
              <option value="bowlers">Bowlers</option>
            </select>
          </label>
        </div>
      </section>

      <section className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {filteredPlayers.map((player) => (
          <Link
            key={player.slug}
            href={`/players/${player.slug}`}
            className="glass-card group rounded-[1.75rem] p-6 transition duration-200 hover:-translate-y-1 hover:border-accent/30"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="section-title">Player</p>
                <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-accent-ink">
                  {player.name}
                </h2>
              </div>
              <span className="rounded-full border border-card-border bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-accent-ink">
                {player.matches}
              </span>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {player.leagues.map((league) => (
                <LeagueBadge key={league} league={league} />
              ))}
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3 text-sm text-muted">
              <div className="stat-pill rounded-2xl px-4 py-3">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-ink">
                  Runs
                </div>
                <div className="mt-1 text-sm font-medium text-foreground">{player.battingRuns}</div>
              </div>
              <div className="stat-pill rounded-2xl px-4 py-3">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-ink">
                  Wickets
                </div>
                <div className="mt-1 text-sm font-medium text-foreground">{player.bowlingWickets}</div>
              </div>
            </div>
            <p className="mt-5 text-sm text-muted">
              {formatDisplayDate(player.firstAppearance)} to {formatDisplayDate(player.lastAppearance)}
            </p>
            <div className="mt-6 flex items-center justify-between border-t border-card-border pt-4 text-sm font-medium text-accent-ink">
              <span>Open player page</span>
              <span className="transition group-hover:translate-x-1">→</span>
            </div>
          </Link>
        ))}
      </section>
    </>
  );
}
