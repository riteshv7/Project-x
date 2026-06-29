"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import type { PlayerDirectoryEntry } from "@/lib/player-aggregator";

export function CompareControl({
  player,
  options,
}: {
  player: PlayerDirectoryEntry;
  options: PlayerDirectoryEntry[];
}) {
  const availableOptions = useMemo(
    () => options.filter((option) => option.slug !== player.slug),
    [options, player.slug],
  );
  const [opponentSlug, setOpponentSlug] = useState(availableOptions[0]?.slug ?? "");

  if (!availableOptions.length) {
    return null;
  }

  const comparisonSlug = [player.slug, opponentSlug].sort((left, right) => left.localeCompare(right)).join("-vs-");

  return (
    <div className="glass-card rounded-[1.75rem] p-5 sm:p-6">
      <p className="section-title">Compare</p>
      <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-accent-ink">
        Player comparison
      </h2>
      <div className="mt-5 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
        <label className="flex flex-col gap-2 text-sm font-medium text-muted">
          Opponent
          <select
            value={opponentSlug}
            onChange={(event) => setOpponentSlug(event.target.value)}
            className="rounded-2xl border border-card-border bg-white/80 px-4 py-3 text-foreground outline-none transition focus:border-accent"
          >
            {availableOptions.map((option) => (
              <option key={option.slug} value={option.slug}>
                {option.name}
              </option>
            ))}
          </select>
        </label>
        <Link
          href={`/player-comparison/${comparisonSlug}`}
          className="self-end rounded-2xl border border-accent/20 bg-accent px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-accent-ink"
        >
          Compare
        </Link>
      </div>
    </div>
  );
}
