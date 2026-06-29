import type { LeagueCode, MatchJson, MatchSummary } from "@/lib/types";
import { matchToSummary, slugifySegment, sortMatchesByDateDesc } from "@/lib/utils";

export interface PlayerDirectoryEntry {
  name: string;
  slug: string;
  battingRuns: number;
  bowlingWickets: number;
  matches: number;
  firstAppearance: string;
  lastAppearance: string;
  leagues: LeagueCode[];
}

export interface PlayerBattingStats {
  matches: number;
  runs: number;
  balls: number;
  dismissals: number;
  average: number | null;
  strikeRate: number;
  fours: number;
  sixes: number;
  highestScore: number;
}

export interface PlayerBowlingStats {
  matches: number;
  balls: number;
  overs: number;
  runs: number;
  wickets: number;
  economy: number;
  strikeRate: number | null;
  bestFigures: string;
}

export interface PlayerMatchAppearance {
  match: MatchSummary;
  opponent: string;
  team: string;
  role: "Batter" | "Bowler" | "All-rounder";
  runs: number | null;
  balls: number | null;
  wickets: number | null;
  runsConceded: number | null;
  status: string;
}

export interface PlayerStats {
  name: string;
  slug: string;
  firstAppearance: string;
  lastAppearance: string;
  totalMatches: number;
  leagues: LeagueCode[];
  batting: PlayerBattingStats;
  bowling: PlayerBowlingStats;
  appearances: PlayerMatchAppearance[];
  leagueBreakdown: {
    league: LeagueCode;
    matches: number;
    runs: number;
    wickets: number;
  }[];
  seasonBreakdown: {
    season: string;
    matches: number;
    runs: number;
    wickets: number;
  }[];
}

export interface PlayerComparison {
  player1: PlayerStats;
  player2: PlayerStats;
  battingDifferences: Record<"matches" | "runs" | "average" | "strikeRate" | "fours" | "sixes", number | null>;
  bowlingDifferences: Record<"matches" | "overs" | "runs" | "wickets" | "economy" | "strikeRate", number | null>;
  sharedMatches: MatchSummary[];
}

const statsCache = new WeakMap<MatchJson[], Map<string, PlayerStats>>();

function oversToBalls(overs: number): number {
  const wholeOvers = Math.trunc(overs);
  const balls = Math.round((overs - wholeOvers) * 10);
  return wholeOvers * 6 + balls;
}

function ballsToOversNumber(balls: number): number {
  return Math.trunc(balls / 6) + (balls % 6) / 10;
}

function percentage(numerator: number, denominator: number): number {
  return denominator > 0 ? (numerator / denominator) * 100 : 0;
}

function averageOrNull(numerator: number, denominator: number): number | null {
  return denominator > 0 ? numerator / denominator : null;
}

function playerTeamInMatch(playerName: string, match: MatchJson): string | null {
  for (const innings of match.innings) {
    if ((innings.scorecard?.batters ?? []).some((batter) => batter.name === playerName)) {
      return innings.batting_team;
    }
    if ((innings.scorecard?.bowlers ?? []).some((bowler) => bowler.name === playerName)) {
      return innings.bowling_team;
    }
  }
  return null;
}

function opponentForTeam(match: MatchJson, teamName: string): string {
  return match.teams.team1 === teamName ? match.teams.team2 : match.teams.team1;
}

export function getAllPlayers(matches: MatchJson[]): string[] {
  const names = new Set<string>();
  for (const match of matches) {
    for (const innings of match.innings) {
      for (const batter of innings.scorecard?.batters ?? []) {
        names.add(batter.name);
      }
      for (const bowler of innings.scorecard?.bowlers ?? []) {
        names.add(bowler.name);
      }
    }
  }
  return Array.from(names).sort((left, right) => left.localeCompare(right));
}

export function getPlayerBattingStats(playerName: string, matches: MatchJson[]): PlayerBattingStats {
  const matchIds = new Set<string>();
  let runs = 0;
  let balls = 0;
  let dismissals = 0;
  let fours = 0;
  let sixes = 0;
  let highestScore = 0;

  for (const match of matches) {
    for (const innings of match.innings) {
      const row = (innings.scorecard?.batters ?? []).find((batter) => batter.name === playerName);
      if (!row) {
        continue;
      }
      matchIds.add(match.match_id);
      runs += row.runs;
      balls += row.balls;
      fours += row.fours;
      sixes += row.sixes;
      highestScore = Math.max(highestScore, row.runs);
      if (row.dismissal || row.dismissal_type) {
        dismissals += 1;
      }
    }
  }

  return {
    matches: matchIds.size,
    runs,
    balls,
    dismissals,
    average: averageOrNull(runs, dismissals),
    strikeRate: percentage(runs, balls),
    fours,
    sixes,
    highestScore,
  };
}

export function getPlayerBowlingStats(playerName: string, matches: MatchJson[]): PlayerBowlingStats {
  const matchIds = new Set<string>();
  let balls = 0;
  let runs = 0;
  let wickets = 0;
  let bestWickets = -1;
  let bestRuns = Number.POSITIVE_INFINITY;

  for (const match of matches) {
    for (const innings of match.innings) {
      const row = (innings.scorecard?.bowlers ?? []).find((bowler) => bowler.name === playerName);
      if (!row) {
        continue;
      }
      matchIds.add(match.match_id);
      balls += oversToBalls(row.overs);
      runs += row.runs_conceded;
      wickets += row.wickets;
      if (row.wickets > bestWickets || (row.wickets === bestWickets && row.runs_conceded < bestRuns)) {
        bestWickets = row.wickets;
        bestRuns = row.runs_conceded;
      }
    }
  }

  return {
    matches: matchIds.size,
    balls,
    overs: ballsToOversNumber(balls),
    runs,
    wickets,
    economy: balls > 0 ? (runs / balls) * 6 : 0,
    strikeRate: wickets > 0 ? balls / wickets : null,
    bestFigures: bestWickets >= 0 ? `${bestWickets}/${bestRuns}` : "-",
  };
}

export function getPlayerMatches(playerName: string, matches: MatchJson[]): PlayerMatchAppearance[] {
  const appearances: PlayerMatchAppearance[] = [];

  for (const match of matches) {
    const battingInnings = match.innings.find((innings) =>
      (innings.scorecard?.batters ?? []).some((batter) => batter.name === playerName),
    );
    const bowlingInnings = match.innings.find((innings) =>
      (innings.scorecard?.bowlers ?? []).some((bowler) => bowler.name === playerName),
    );

    if (!battingInnings && !bowlingInnings) {
      continue;
    }

    const batting = battingInnings?.scorecard?.batters.find((batter) => batter.name === playerName);
    const bowling = bowlingInnings?.scorecard?.bowlers.find((bowler) => bowler.name === playerName);
    const team = battingInnings?.batting_team ?? bowlingInnings?.bowling_team ?? "";
    const role = batting && bowling ? "All-rounder" : batting ? "Batter" : "Bowler";

    appearances.push({
      match: matchToSummary(match),
      opponent: team ? opponentForTeam(match, team) : "",
      team,
      role,
      runs: batting?.runs ?? null,
      balls: batting?.balls ?? null,
      wickets: bowling?.wickets ?? null,
      runsConceded: bowling?.runs_conceded ?? null,
      status: batting ? batting.dismissal || batting.dismissal_type || "Not out" : "-",
    });
  }

  return appearances.sort((left, right) => sortMatchesByDateDesc([left.match, right.match])[0] === left.match ? -1 : 1);
}

export function getPlayerStats(playerName: string, matches: MatchJson[]): PlayerStats {
  const cachedByName = statsCache.get(matches);
  const cachedStats = cachedByName?.get(playerName);
  if (cachedStats) {
    return cachedStats;
  }

  const appearances = getPlayerMatches(playerName, matches);
  const batting = getPlayerBattingStats(playerName, matches);
  const bowling = getPlayerBowlingStats(playerName, matches);
  const leagues = Array.from(new Set(appearances.map((appearance) => appearance.match.league)));
  const seasons = Array.from(new Set(appearances.map((appearance) => appearance.match.season))).sort(
    (left, right) => Number(right) - Number(left),
  );

  const stats = {
    name: playerName,
    slug: slugifySegment(playerName),
    firstAppearance: appearances.length ? appearances[appearances.length - 1].match.date : "",
    lastAppearance: appearances.length ? appearances[0].match.date : "",
    totalMatches: new Set(appearances.map((appearance) => appearance.match.match_id)).size,
    leagues,
    batting,
    bowling,
    appearances,
    leagueBreakdown: leagues.map((league) => {
      const rows = appearances.filter((appearance) => appearance.match.league === league);
      return {
        league,
        matches: new Set(rows.map((row) => row.match.match_id)).size,
        runs: rows.reduce((total, row) => total + (row.runs ?? 0), 0),
        wickets: rows.reduce((total, row) => total + (row.wickets ?? 0), 0),
      };
    }),
    seasonBreakdown: seasons.map((season) => {
      const rows = appearances.filter((appearance) => appearance.match.season === season);
      return {
        season,
        matches: new Set(rows.map((row) => row.match.match_id)).size,
        runs: rows.reduce((total, row) => total + (row.runs ?? 0), 0),
        wickets: rows.reduce((total, row) => total + (row.wickets ?? 0), 0),
      };
    }),
  };

  if (cachedByName) {
    cachedByName.set(playerName, stats);
  } else {
    statsCache.set(matches, new Map([[playerName, stats]]));
  }

  return stats;
}

export function getPlayerDirectory(matches: MatchJson[]): PlayerDirectoryEntry[] {
  const entries = new Map<
    string,
    {
      battingRuns: number;
      bowlingWickets: number;
      matchIds: Set<string>;
      firstAppearance: string;
      lastAppearance: string;
      leagues: Set<LeagueCode>;
    }
  >();

  function ensureEntry(name: string, match: MatchJson) {
    const existing = entries.get(name);
    if (existing) {
      existing.matchIds.add(match.match_id);
      existing.leagues.add(match.league);
      if (!existing.firstAppearance || match.date < existing.firstAppearance) {
        existing.firstAppearance = match.date;
      }
      if (!existing.lastAppearance || match.date > existing.lastAppearance) {
        existing.lastAppearance = match.date;
      }
      return existing;
    }

    const created = {
      battingRuns: 0,
      bowlingWickets: 0,
      matchIds: new Set([match.match_id]),
      firstAppearance: match.date,
      lastAppearance: match.date,
      leagues: new Set([match.league]),
    };
    entries.set(name, created);
    return created;
  }

  for (const match of matches) {
    for (const innings of match.innings) {
      for (const batter of innings.scorecard?.batters ?? []) {
        ensureEntry(batter.name, match).battingRuns += batter.runs;
      }
      for (const bowler of innings.scorecard?.bowlers ?? []) {
        ensureEntry(bowler.name, match).bowlingWickets += bowler.wickets;
      }
    }
  }

  return Array.from(entries.entries())
    .map(([name, entry]) => ({
      name,
      slug: slugifySegment(name),
      battingRuns: entry.battingRuns,
      bowlingWickets: entry.bowlingWickets,
      matches: entry.matchIds.size,
      firstAppearance: entry.firstAppearance,
      lastAppearance: entry.lastAppearance,
      leagues: Array.from(entry.leagues),
    }))
    .sort((left, right) => {
      if (right.matches !== left.matches) {
        return right.matches - left.matches;
      }
      return left.name.localeCompare(right.name);
    });
}

export function resolvePlayerName(slug: string, players: string[]): string | null {
  return players.find((player) => slugifySegment(player) === slug) ?? null;
}

function diff(left: number | null, right: number | null): number | null {
  if (left === null || right === null) {
    return null;
  }
  return left - right;
}

export function comparePlayerStats(player1: string, player2: string, matches: MatchJson[]): PlayerComparison {
  const player1Stats = getPlayerStats(player1, matches);
  const player2Stats = getPlayerStats(player2, matches);
  const player1MatchIds = new Set(player1Stats.appearances.map((appearance) => appearance.match.match_id));
  const sharedMatches = player2Stats.appearances
    .filter((appearance) => player1MatchIds.has(appearance.match.match_id))
    .map((appearance) => appearance.match);

  return {
    player1: player1Stats,
    player2: player2Stats,
    battingDifferences: {
      matches: diff(player1Stats.batting.matches, player2Stats.batting.matches),
      runs: diff(player1Stats.batting.runs, player2Stats.batting.runs),
      average: diff(player1Stats.batting.average, player2Stats.batting.average),
      strikeRate: diff(player1Stats.batting.strikeRate, player2Stats.batting.strikeRate),
      fours: diff(player1Stats.batting.fours, player2Stats.batting.fours),
      sixes: diff(player1Stats.batting.sixes, player2Stats.batting.sixes),
    },
    bowlingDifferences: {
      matches: diff(player1Stats.bowling.matches, player2Stats.bowling.matches),
      overs: diff(player1Stats.bowling.overs, player2Stats.bowling.overs),
      runs: diff(player1Stats.bowling.runs, player2Stats.bowling.runs),
      wickets: diff(player1Stats.bowling.wickets, player2Stats.bowling.wickets),
      economy: diff(player1Stats.bowling.economy, player2Stats.bowling.economy),
      strikeRate: diff(player1Stats.bowling.strikeRate, player2Stats.bowling.strikeRate),
    },
    sharedMatches: sortMatchesByDateDesc(sharedMatches),
  };
}

export function playerAppearedInMatch(playerName: string, match: MatchJson): boolean {
  return playerTeamInMatch(playerName, match) !== null;
}
