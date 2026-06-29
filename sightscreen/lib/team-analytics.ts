import type {
  LeagueCode,
  MatchJson,
  TeamAnalyticsBatterRow,
  TeamAnalyticsBowlerRow,
  TeamAnalyticsSeasonRow,
  TeamAnalyticsSplitRow,
  TeamAnalyticsStats,
} from "@/lib/types";
import { seasonFromDate, slugifySegment } from "@/lib/utils";

function oversToBalls(overs: number): number {
  const wholeOvers = Math.trunc(overs);
  const extraBalls = Math.round((overs - wholeOvers) * 10);
  return wholeOvers * 6 + extraBalls;
}

function ballsToOvers(balls: number): number {
  return Math.trunc(balls / 6) + (balls % 6) / 10;
}

function teamMatches(teamName: string, matches: MatchJson[]) {
  return matches.filter((match) => match.teams.team1 === teamName || match.teams.team2 === teamName);
}

export function detectHomeGround(teamName: string, matches: MatchJson[]): string | null {
  const counts = new Map<string, number>();
  for (const match of teamMatches(teamName, matches)) {
    counts.set(match.venue, (counts.get(match.venue) ?? 0) + 1);
  }
  const sorted = Array.from(counts.entries()).sort((left, right) => {
    if (right[1] === left[1]) {
      return left[0].localeCompare(right[0]);
    }
    return right[1] - left[1];
  });
  return sorted[0]?.[0] ?? null;
}

export function getTeamBatterStats(teamName: string, matches: MatchJson[]): TeamAnalyticsBatterRow[] {
  const rows = new Map<
    string,
    { matches: Set<string>; runs: number; balls: number; dismissals: number; fours: number; sixes: number }
  >();

  for (const match of teamMatches(teamName, matches)) {
    for (const innings of match.innings) {
      if (innings.batting_team !== teamName) {
        continue;
      }
      for (const batter of innings.scorecard?.batters ?? []) {
        const current =
          rows.get(batter.name) ??
          { matches: new Set<string>(), runs: 0, balls: 0, dismissals: 0, fours: 0, sixes: 0 };
        current.matches.add(match.match_id);
        current.runs += batter.runs;
        current.balls += batter.balls;
        current.fours += batter.fours;
        current.sixes += batter.sixes;
        if (batter.dismissal || batter.dismissal_type) {
          current.dismissals += 1;
        }
        rows.set(batter.name, current);
      }
    }
  }

  return Array.from(rows.entries())
    .map(([name, row]) => ({
      name,
      matches: row.matches.size,
      runs: row.runs,
      average: row.dismissals > 0 ? row.runs / row.dismissals : null,
      strikeRate: row.balls > 0 ? (row.runs / row.balls) * 100 : 0,
      fours: row.fours,
      sixes: row.sixes,
    }))
    .sort((left, right) => {
      if (right.runs === left.runs) {
        return left.name.localeCompare(right.name);
      }
      return right.runs - left.runs;
    });
}

export function getTeamBowlerStats(teamName: string, matches: MatchJson[]): TeamAnalyticsBowlerRow[] {
  const rows = new Map<
    string,
    { matches: Set<string>; balls: number; runs: number; wickets: number }
  >();

  for (const match of teamMatches(teamName, matches)) {
    for (const innings of match.innings) {
      if (innings.bowling_team !== teamName) {
        continue;
      }
      for (const bowler of innings.scorecard?.bowlers ?? []) {
        const current =
          rows.get(bowler.name) ?? { matches: new Set<string>(), balls: 0, runs: 0, wickets: 0 };
        current.matches.add(match.match_id);
        current.balls += oversToBalls(bowler.overs);
        current.runs += bowler.runs_conceded;
        current.wickets += bowler.wickets;
        rows.set(bowler.name, current);
      }
    }
  }

  return Array.from(rows.entries())
    .map(([name, row]) => ({
      name,
      matches: row.matches.size,
      overs: ballsToOvers(row.balls),
      runs: row.runs,
      wickets: row.wickets,
      economy: row.balls > 0 ? (row.runs / row.balls) * 6 : 0,
      avgWicketsPerMatch: row.matches.size > 0 ? row.wickets / row.matches.size : 0,
    }))
    .filter((row) => row.matches >= 5)
    .sort((left, right) => {
      if (right.wickets === left.wickets) {
        return left.economy - right.economy;
      }
      return right.wickets - left.wickets;
    });
}

function buildSplit(teamName: string, matches: MatchJson[]): TeamAnalyticsSplitRow {
  const relevant = teamMatches(teamName, matches);
  let wins = 0;
  let losses = 0;
  let battingTotal = 0;
  let bowlingTotal = 0;
  let battingCount = 0;
  let bowlingCount = 0;

  for (const match of relevant) {
    if (match.result.winner === teamName) {
      wins += 1;
    } else {
      losses += 1;
    }
    const batting = match.innings.find((innings) => innings.batting_team === teamName);
    const bowling = match.innings.find((innings) => innings.bowling_team === teamName);
    if (batting) {
      battingTotal += batting.final_score;
      battingCount += 1;
    }
    if (bowling) {
      bowlingTotal += bowling.final_score;
      bowlingCount += 1;
    }
  }

  const count = relevant.length;
  return {
    matches: count,
    wins,
    losses,
    winPercent: count > 0 ? (wins / count) * 100 : 0,
    avgScore: battingCount > 0 ? battingTotal / battingCount : 0,
    avgOppositionScore: bowlingCount > 0 ? bowlingTotal / bowlingCount : 0,
  };
}

export function getTeamHomeAwayRecord(teamName: string, matches: MatchJson[]) {
  const homeGround = detectHomeGround(teamName, matches);
  const all = teamMatches(teamName, matches);
  const homeMatches = homeGround ? all.filter((match) => match.venue === homeGround) : [];
  const awayMatches = homeGround ? all.filter((match) => match.venue !== homeGround) : all;

  return {
    homeGround,
    home: buildSplit(teamName, homeMatches),
    away: buildSplit(teamName, awayMatches),
  };
}

export function getTeamSeasonTrends(teamName: string, matches: MatchJson[]): TeamAnalyticsSeasonRow[] {
  const buckets = new Map<string, MatchJson[]>();
  for (const match of teamMatches(teamName, matches)) {
    const season = seasonFromDate(match.date);
    const current = buckets.get(season) ?? [];
    current.push(match);
    buckets.set(season, current);
  }

  return Array.from(buckets.entries())
    .map(([season, seasonMatches]) => {
      const split = buildSplit(teamName, seasonMatches);
      return {
        season,
        matches: split.matches,
        wins: split.wins,
        losses: split.losses,
        winPercent: split.winPercent,
        avgScore: split.avgScore,
        avgOppositionScore: split.avgOppositionScore,
      };
    })
    .sort((left, right) => Number(right.season) - Number(left.season));
}

export function getTeamAnalytics(teamName: string, matches: MatchJson[]): TeamAnalyticsStats {
  const relevantMatches = teamMatches(teamName, matches);
  const leagues = Array.from(new Set(relevantMatches.map((match) => match.league))).sort() as LeagueCode[];
  const batterStats = getTeamBatterStats(teamName, matches);
  const bowlerStats = getTeamBowlerStats(teamName, matches);
  const homeAway = getTeamHomeAwayRecord(teamName, matches);
  const seasonTrends = getTeamSeasonTrends(teamName, matches);

  const topFourRuns = batterStats.slice(0, 4).reduce((sum, row) => sum + row.runs, 0);
  const allRuns = batterStats.reduce((sum, row) => sum + row.runs, 0);
  const wickets10Plus = bowlerStats.filter((row) => row.wickets >= 10).length;
  const averageDepth =
    relevantMatches.length > 0
      ? relevantMatches.reduce((sum, match) => {
          const bowlers = match.innings
            .filter((innings) => innings.bowling_team === teamName)
            .flatMap((innings) => innings.scorecard?.bowlers ?? []);
          return sum + new Set(bowlers.map((bowler) => bowler.name)).size;
        }, 0) / relevantMatches.length
      : 0;
  const homeAdvantage = homeAway.home.winPercent - homeAway.away.winPercent;
  const recentTrend =
    seasonTrends.length >= 2
      ? seasonTrends[0].winPercent - seasonTrends[seasonTrends.length - 1].winPercent
      : 0;

  return {
    teamName,
    slug: slugifySegment(teamName),
    leagues,
    homeGround: homeAway.homeGround,
    batterStats,
    bowlerStats,
    homeAway: {
      home: homeAway.home,
      away: homeAway.away,
    },
    seasonTrends,
    battingInsight:
      allRuns > 0
        ? `${teamName}'s top 4 batters score ${((topFourRuns / allRuns) * 100).toFixed(0)}% of the team's recorded scorecard runs.`
        : `${teamName} does not yet have enriched batting scorecards in this archive slice.`,
    bowlingInsight: `${teamName} has ${wickets10Plus} bowlers with 10+ wickets and averages ${averageDepth.toFixed(1)} bowlers per match.`,
    homeAwayInsight: `${teamName} wins ${homeAway.home.winPercent.toFixed(1)}% at home and ${homeAway.away.winPercent.toFixed(1)}% away (home edge ${homeAdvantage >= 0 ? "+" : ""}${homeAdvantage.toFixed(1)}%).`,
    seasonInsight:
      seasonTrends.length >= 2
        ? `${teamName}'s win rate has ${recentTrend >= 0 ? "improved" : "slipped"} ${Math.abs(recentTrend).toFixed(1)} points across the available seasons.`
        : `${teamName} has a single-season sample in the current archive.`,
  };
}
