"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { deleteCustomLeaderboard, readCustomLeaderboards, shareUrlForBoard } from "@/lib/leaderboard-builder";
import type { CustomLeaderboardConfig, PopularLeaderboard } from "@/lib/types";
import { GridSection, HeroCard, StatPill } from "@/app/components/section-shell";

export function LeaderboardsBrowserClient({
  boards,
}: {
  boards: PopularLeaderboard[];
}) {
  const [customBoards, setCustomBoards] = useState<CustomLeaderboardConfig[]>([]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setCustomBoards(readCustomLeaderboards());
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  return (
    <>
      <HeroCard
        eyebrow="Leaderboards"
        title="Popular ranks and custom boards"
        description="Browse pre-computed rankings or build your own using league, season, role, and threshold filters."
        aside={
          <>
            <StatPill label="Popular boards" value={boards.length} />
            <StatPill label="My boards" value={customBoards.length} />
          </>
        }
      />

      <section className="glass-card mt-8 rounded-[1.75rem] px-5 py-5 sm:px-6">
        <div className="flex flex-wrap gap-3">
          <Link
            href={`/leaderboards/custom/?${new URLSearchParams({
              name: "Custom leaderboard",
              metric: "runs",
              league: "all",
              season: "all",
              role: "any",
              threshold_type: "matches",
              threshold_value: "1",
            }).toString()}`}
            className="rounded-2xl border border-accent/20 bg-accent px-4 py-3 text-sm font-semibold text-white transition hover:bg-accent-ink"
          >
            Create new leaderboard
          </Link>
        </div>
      </section>

      <GridSection title="Popular Leaderboards">
        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {boards.map((board) => (
            <Link
              key={board.slug}
              href={`/leaderboards/popular/${board.slug}`}
              className="glass-card rounded-[1.75rem] p-6 transition duration-200 hover:-translate-y-1 hover:border-accent/30"
            >
              <p className="section-title">Popular</p>
              <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-accent-ink">
                {board.name}
              </h2>
              <p className="mt-4 text-sm leading-7 text-muted">{board.description}</p>
              <div className="mt-6 grid gap-3 text-sm text-muted sm:grid-cols-2">
                <StatPill label="Rows" value={board.rows.length} />
                <StatPill label="Metric" value={board.rows[0]?.metricLabel ?? board.metric} />
              </div>
            </Link>
          ))}
        </section>
      </GridSection>

      <GridSection title="My Custom Leaderboards">
        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {customBoards.length === 0 ? (
            <div className="glass-card rounded-[1.75rem] p-6 text-sm text-muted">
              Saved custom leaderboards will appear here after you generate one and choose save.
            </div>
          ) : (
            customBoards.map((board) => (
              <div key={board.id} className="glass-card rounded-[1.75rem] p-6">
                <p className="section-title">Saved locally</p>
                <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-accent-ink">
                  {board.name}
                </h2>
                <p className="mt-4 text-sm leading-7 text-muted">
                  {board.metric} • {board.league} • {board.season}
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    href={`/leaderboards/custom/local-storage/?board=${encodeURIComponent(board.id)}`}
                    className="rounded-2xl border border-card-border bg-white/70 px-4 py-3 text-sm font-medium text-foreground transition hover:border-accent/30 hover:text-accent-ink"
                  >
                    Open board
                  </Link>
                  <Link
                    href={shareUrlForBoard(board)}
                    className="rounded-2xl border border-card-border bg-[#f8f1e5] px-4 py-3 text-sm font-medium text-accent-ink transition hover:border-accent/30"
                  >
                    Share
                  </Link>
                  <button
                    type="button"
                    onClick={() => setCustomBoards(deleteCustomLeaderboard(board.id))}
                    className="rounded-2xl border border-card-border bg-white/70 px-4 py-3 text-sm font-medium text-accent-ink transition hover:border-accent/30"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </section>
      </GridSection>
    </>
  );
}
