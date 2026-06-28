import { promises as fs } from "node:fs";
import path from "node:path";

import { LEAGUE_ORDER } from "@/lib/league";
import type { LeagueCode, MatchJson, MatchSummary } from "@/lib/types";
import { matchToSummary, sortMatchesByDateDesc } from "@/lib/utils";

const matchesRootDir = path.join(process.cwd(), "..", "analysis", "matches");
let allMatchesPromise: Promise<MatchJson[]> | null = null;
let allSummariesPromise: Promise<MatchSummary[]> | null = null;

async function readMatchFile(filePath: string, league: LeagueCode): Promise<MatchJson> {
  const source = await fs.readFile(filePath, "utf8");
  const normalized = source.replace(/\bNaN\b/g, "null");
  const match = JSON.parse(normalized) as Omit<MatchJson, "league"> & Partial<Pick<MatchJson, "league">>;
  return {
    ...match,
    league,
  };
}

export async function getMatchIds(): Promise<string[]> {
  const ids: string[] = [];

  for (const league of LEAGUE_ORDER) {
    const leagueDir = path.join(matchesRootDir, league);
    const files = await fs.readdir(leagueDir);
    ids.push(
      ...files
        .filter((file) => file.endsWith(".json"))
        .map((file) => file.replace(/\.json$/, "")),
    );
  }

  return ids.sort();
}

export async function getMatch(matchId: string): Promise<MatchJson | null> {
  for (const league of LEAGUE_ORDER) {
    try {
      return await readMatchFile(path.join(matchesRootDir, league, `${matchId}.json`), league);
    } catch {
      continue;
    }
  }

  return null;
}

export async function getAllMatches(): Promise<MatchJson[]> {
  if (!allMatchesPromise) {
    allMatchesPromise = (async () => {
      const matches: MatchJson[] = [];

      for (const league of LEAGUE_ORDER) {
        const leagueDir = path.join(matchesRootDir, league);
        const files = (await fs.readdir(leagueDir))
          .filter((file) => file.endsWith(".json"))
          .sort();

        for (const file of files) {
          const match = await readMatchFile(path.join(leagueDir, file), league);
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
