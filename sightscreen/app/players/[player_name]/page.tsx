import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BackLink, PageFrame } from "@/app/components/section-shell";
import { PlayerDetailClient } from "@/app/players/[player_name]/player-detail-client";
import { getAllMatches } from "@/lib/data";
import {
  getAllPlayers,
  getPlayerDirectory,
  getPlayerStats,
  resolvePlayerName,
} from "@/lib/player-aggregator";
import { slugifySegment } from "@/lib/utils";

const COMPARISON_PLAYER_COUNT = 36;

export const dynamicParams = false;

export async function generateStaticParams() {
  const matches = await getAllMatches();
  return getAllPlayers(matches).map((playerName) => ({ player_name: slugifySegment(playerName) }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ player_name: string }>;
}): Promise<Metadata> {
  const { player_name } = await params;
  const matches = await getAllMatches();
  const playerName = resolvePlayerName(player_name, getAllPlayers(matches));

  if (!playerName) {
    return { title: "Player not found" };
  }

  return {
    title: playerName,
    description: `Career scorecard stats for ${playerName}.`,
  };
}

export default async function PlayerDetailPage({
  params,
}: {
  params: Promise<{ player_name: string }>;
}) {
  const { player_name } = await params;
  const matches = await getAllMatches();
  const directory = getPlayerDirectory(matches);
  const playerName = resolvePlayerName(player_name, directory.map((player) => player.name));

  if (!playerName) {
    notFound();
  }

  const stats = getPlayerStats(playerName, matches);
  const currentPlayer = directory.find((player) => player.name === playerName) ?? null;
  const comparisonPlayers = directory.slice(0, COMPARISON_PLAYER_COUNT);

  return (
    <PageFrame>
      <BackLink href="/players">← Back to players</BackLink>
      <PlayerDetailClient
        stats={stats}
        currentPlayer={currentPlayer}
        comparisonPlayers={comparisonPlayers}
      />
    </PageFrame>
  );
}
