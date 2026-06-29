"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import { CustomBuilderClient } from "@/app/leaderboards/custom/custom-builder-client";
import { readCustomLeaderboards } from "@/lib/leaderboard-builder";
import type { CustomLeaderboardConfig, LeaderboardAggregateSlice } from "@/lib/types";

export function LocalBoardClient({ slices }: { slices: LeaderboardAggregateSlice[] }) {
  const searchParams = useSearchParams();
  const [board, setBoard] = useState<CustomLeaderboardConfig | null>(null);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const boardId = searchParams.get("board");
      setBoard(readCustomLeaderboards().find((entry) => entry.id === boardId) ?? null);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [searchParams]);

  if (!board) {
    return <div className="glass-card rounded-[1.75rem] p-6 text-sm text-muted">Custom leaderboard not found in local storage.</div>;
  }

  return <CustomBuilderClient slices={slices} savedBoard={board} />;
}
