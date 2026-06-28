import { promises as fs } from "node:fs";
import path from "node:path";

import type { MatchJson, MatchSummary } from "@/lib/types";
import { matchToSummary, sortMatchesByDateDesc } from "@/lib/utils";

const matchesDir = path.join(process.cwd(), "public", "matches");
let allMatchesPromise: Promise<MatchJson[]> | null = null;
let allSummariesPromise: Promise<MatchSummary[]> | null = null;

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

export async function getAllMatches(): Promise<MatchJson[]> {
  if (!allMatchesPromise) {
    allMatchesPromise = (async () => {
      const ids = await getMatchIds();
      const matches: MatchJson[] = [];

      for (const matchId of ids) {
        const match = await getMatch(matchId);
        if (match) {
          matches.push(match);
        }
      }

      return matches;
    })();
  }

  return allMatchesPromise;
}

export async function getMatchSummaries(): Promise<MatchSummary[]> {
  if (!allSummariesPromise) {
    allSummariesPromise = getAllMatches().then((matches) =>
      sortMatchesByDateDesc(matches.map((match) => matchToSummary(match))),
    );
  }

  return allSummariesPromise;
}
