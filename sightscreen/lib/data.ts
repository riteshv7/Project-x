import { promises as fs } from "node:fs";
import path from "node:path";

import type { MatchJson, MatchSummary } from "@/lib/types";
import { matchToSummary, sortMatchesByDateDesc } from "@/lib/utils";

const matchesDir = path.join(process.cwd(), "public", "matches");

async function readMatchFile(filePath: string): Promise<MatchJson> {
  const source = await fs.readFile(filePath, "utf8");
  const normalized = source.replace(/\bNaN\b/g, "null");
  return JSON.parse(normalized) as MatchJson;
}

export async function getMatchIds(): Promise<string[]> {
  const files = await fs.readdir(matchesDir);
  return files
    .filter((file) => file.endsWith(".json"))
    .map((file) => file.replace(/\.json$/, ""))
    .sort();
}

export async function getMatch(matchId: string): Promise<MatchJson | null> {
  try {
    return await readMatchFile(path.join(matchesDir, `${matchId}.json`));
  } catch {
    return null;
  }
}

export async function getMatchSummaries(): Promise<MatchSummary[]> {
  const ids = await getMatchIds();
  const matches: MatchSummary[] = [];

  for (const matchId of ids) {
    const match = await getMatch(matchId);
    if (match) {
      matches.push(matchToSummary(match));
    }
  }

  return sortMatchesByDateDesc(matches);
}
