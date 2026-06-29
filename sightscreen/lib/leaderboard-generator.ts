import { LEAGUE_METADATA, LEAGUE_ORDER } from "@/lib/league";
import type {
  CustomLeaderboardConfig,
  LeaderboardAggregateSlice,
  LeaderboardMetric,
  LeaderboardRole,
  LeaderboardRow,
  MatchJson,
  PopularLeaderboard,
} from "@/lib/types";

function oversToBalls(overs: number): number {
  const wholeOvers = Math.trunc(overs);
  const extraBalls = Math.round((overs - wholeOvers) * 10);
  return wholeOvers * 6 + extraBalls;
}

function ballsToOvers(balls: number): number {
  return Math.trunc(balls / 6) + (balls % 6) / 10;
}

function currentCutoff(matches: MatchJson[]): string {
  return matches.reduce((latest, match) => (match.date > latest ? match.date : latest), "");
}

function seasonFromDate(date: string): string {
  return new Date(date).getUTCFullYear().toString();
}

function latestSeasonForLeague(
  slices: LeaderboardAggregateSlice[],
  league: LeaderboardAggregateSlice["league"],
): string | null {
  const seasons = slices
    .filter((slice) => slice.league === league)
    .map((slice) => Number(slice.season))
    .filter((season) => Number.isFinite(season));

  if (seasons.length === 0) {
    return null;
  }

  return String(Math.max(...seasons));
}

function makeEmptySlice(player: string, league: LeaderboardAggregateSlice["league"], season: string): LeaderboardAggregateSlice {
  return {
    player,
    slug: player.toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""),
    league,
    season,
    matches: 0,
    innings: 0,
    runs: 0,
    balls: 0,
    dismissals: 0,
    fours: 0,
    sixes: 0,
    highestScore: 0,
    scoreSumSquares: 0,
    wickets: 0,
    bowlingMatches: 0,
    bowlingBalls: 0,
    runsConceded: 0,
    deathBalls: 0,
    deathRunsConceded: 0,
    deathWickets: 0,
  };
}

export function buildLeaderboardSlices(matches: MatchJson[]): LeaderboardAggregateSlice[] {
  const slices = new Map<string, LeaderboardAggregateSlice>();
  const seenMatchBatting = new Set<string>();
  const seenMatchBowling = new Set<string>();

  function getSlice(player: string, league: LeaderboardAggregateSlice["league"], season: string) {
    const key = `${player}::${league}::${season}`;
    const existing = slices.get(key);
    if (existing) {
      return existing;
    }
    const created = makeEmptySlice(player, league, season);
    slices.set(key, created);
    return created;
  }

  for (const match of matches) {
    const season = seasonFromDate(match.date);
    for (const innings of match.innings) {
      for (const batter of innings.scorecard?.batters ?? []) {
        const slice = getSlice(batter.name, match.league, season);
        const battingSeenKey = `${match.match_id}::bat::${batter.name}::${match.league}::${season}`;
        if (!seenMatchBatting.has(battingSeenKey)) {
          slice.matches += 1;
          slice.innings += 1;
          seenMatchBatting.add(battingSeenKey);
        }
        slice.runs += batter.runs;
        slice.balls += batter.balls;
        slice.fours += batter.fours;
        slice.sixes += batter.sixes;
        slice.highestScore = Math.max(slice.highestScore, batter.runs);
        slice.scoreSumSquares += batter.runs ** 2;
        if (batter.dismissal || batter.dismissal_type) {
          slice.dismissals += 1;
        }
      }
      for (const bowler of innings.scorecard?.bowlers ?? []) {
        const slice = getSlice(bowler.name, match.league, season);
        const bowlingSeenKey = `${match.match_id}::bowl::${bowler.name}::${match.league}::${season}`;
        if (!seenMatchBowling.has(bowlingSeenKey)) {
          slice.matches += 1;
          slice.bowlingMatches += 1;
          seenMatchBowling.add(bowlingSeenKey);
        }
        slice.wickets += bowler.wickets;
        const balls = oversToBalls(bowler.overs);
        slice.bowlingBalls += balls;
        slice.runsConceded += bowler.runs_conceded;
        const deathBalls = Math.max(0, Math.min(balls, Math.max(0, (innings.overs - 15) * 6)));
        if (deathBalls > 0) {
          slice.deathBalls += deathBalls;
          slice.deathRunsConceded += (bowler.runs_conceded / Math.max(balls, 1)) * deathBalls;
          slice.deathWickets += Math.min(bowler.wickets, Math.ceil((deathBalls / Math.max(balls, 1)) * bowler.wickets));
        }
      }
    }
  }

  return Array.from(slices.values());
}

function combineSlices(slices: LeaderboardAggregateSlice[]): Omit<LeaderboardRow, "rank" | "metricValue" | "metricLabel" | "leagueLabel"> {
  const base = {
    player: slices[0]?.player ?? "",
    slug: slices[0]?.slug ?? "",
    matches: 0,
    innings: 0,
    runs: 0,
    wickets: 0,
    average: null as number | null,
    strikeRate: 0,
    economy: null as number | null,
    overs: 0,
    dismissals: 0,
    fours: 0,
    sixes: 0,
    highestScore: 0,
    allRounderScore: 0,
    consistency: null as number | null,
    deathEconomy: null as number | null,
  };
  let balls = 0;
  let bowlingBalls = 0;
  let runsConceded = 0;
  let deathBalls = 0;
  let deathRuns = 0;
  let scoreSumSquares = 0;

  for (const slice of slices) {
    base.matches += slice.matches;
    base.innings += slice.innings;
    base.runs += slice.runs;
    base.wickets += slice.wickets;
    base.dismissals += slice.dismissals;
    base.fours += slice.fours;
    base.sixes += slice.sixes;
    base.highestScore = Math.max(base.highestScore, slice.highestScore);
    balls += slice.balls;
    bowlingBalls += slice.bowlingBalls;
    runsConceded += slice.runsConceded;
    deathBalls += slice.deathBalls;
    deathRuns += slice.deathRunsConceded;
    scoreSumSquares += slice.scoreSumSquares;
  }

  base.average = base.dismissals > 0 ? base.runs / base.dismissals : null;
  base.strikeRate = balls > 0 ? (base.runs / balls) * 100 : 0;
  base.economy = bowlingBalls > 0 ? (runsConceded / bowlingBalls) * 6 : null;
  base.overs = ballsToOvers(bowlingBalls);
  base.allRounderScore = base.runs / 100 + base.wickets * 10;
  base.consistency =
    base.innings > 1
      ? Math.sqrt(Math.max(scoreSumSquares / base.innings - (base.runs / base.innings) ** 2, 0))
      : null;
  base.deathEconomy = deathBalls > 0 ? (deathRuns / deathBalls) * 6 : null;

  return base;
}

function byPlayer(rows: LeaderboardAggregateSlice[]) {
  const grouped = new Map<string, LeaderboardAggregateSlice[]>();
  for (const row of rows) {
    const current = grouped.get(row.player) ?? [];
    current.push(row);
    grouped.set(row.player, current);
  }
  return grouped;
}

export function getAvailableLeaderboardDataset(matches: MatchJson[]) {
  return buildLeaderboardSlices(matches).sort((left, right) => {
    if (left.player === right.player) {
      if (left.league === right.league) {
        return Number(right.season) - Number(left.season);
      }
      return LEAGUE_ORDER.indexOf(left.league) - LEAGUE_ORDER.indexOf(right.league);
    }
    return left.player.localeCompare(right.player);
  });
}

export function computeLeaderboardRows(
  slices: LeaderboardAggregateSlice[],
  config: {
    metric: LeaderboardMetric;
    league?: LeaderboardAggregateSlice["league"] | "all";
    season?: string | "all";
    role?: LeaderboardRole;
    minThresholdType?: "innings" | "dismissals" | "overs" | "matches";
    minThresholdValue?: number;
    limit?: number;
  },
): LeaderboardRow[] {
  const filtered = slices.filter((slice) => {
    if (config.league && config.league !== "all" && slice.league !== config.league) {
      return false;
    }
    if (config.season && config.season !== "all" && slice.season !== config.season) {
      return false;
    }
    return true;
  });

  const rows = Array.from(byPlayer(filtered).values())
    .map((playerSlices) => {
      const combined = combineSlices(playerSlices);
      const leagueLabel =
        config.league && config.league !== "all"
          ? LEAGUE_METADATA[config.league].shortLabel
          : "All leagues";
      return {
        rank: 0,
        leagueLabel,
        metricValue: 0,
        metricLabel: "",
        ...combined,
      } satisfies LeaderboardRow;
    })
    .filter((row) => {
      if (config.role === "batter") {
        return row.innings > 0;
      }
      if (config.role === "bowler") {
        return row.overs > 0;
      }
      if (config.role === "all_rounder") {
        return row.innings > 0 && row.overs > 0;
      }
      return true;
    })
    .filter((row) => {
      const thresholdType = config.minThresholdType ?? "matches";
      const thresholdValue = config.minThresholdValue ?? 0;
      if (thresholdType === "innings") {
        return row.innings >= thresholdValue;
      }
      if (thresholdType === "dismissals") {
        return row.dismissals >= thresholdValue;
      }
      if (thresholdType === "overs") {
        return row.overs >= thresholdValue;
      }
      return row.matches >= thresholdValue;
    })
    .map((row) => {
      const metricLabelMap: Record<LeaderboardMetric, string> = {
        runs: "Runs",
        wickets: "Wickets",
        strike_rate: "Strike Rate",
        economy: "Economy",
        average: "Average",
        sixes: "Sixes",
        fours: "Fours",
        all_rounder_score: "All-rounder score",
      };
      const metricValueMap: Record<LeaderboardMetric, number> = {
        runs: row.runs,
        wickets: row.wickets,
        strike_rate: row.strikeRate,
        economy: row.economy ?? Number.POSITIVE_INFINITY,
        average: row.average ?? 0,
        sixes: row.sixes,
        fours: row.fours,
        all_rounder_score: row.allRounderScore,
      };
      return {
        ...row,
        metricLabel: metricLabelMap[config.metric],
        metricValue: metricValueMap[config.metric],
      };
    });

  rows.sort((left, right) => {
    if (config.metric === "economy") {
      if (left.metricValue === right.metricValue) {
        return right.wickets - left.wickets || left.player.localeCompare(right.player);
      }
      return left.metricValue - right.metricValue;
    }
    if (right.metricValue === left.metricValue) {
      return left.player.localeCompare(right.player);
    }
    return right.metricValue - left.metricValue;
  });

  return rows.slice(0, config.limit ?? 50).map((row, index) => ({ ...row, rank: index + 1 }));
}

export function generatePopularLeaderboards(matches: MatchJson[]): PopularLeaderboard[] {
  const slices = getAvailableLeaderboardDataset(matches);
  const cutoffDate = currentCutoff(matches);
  const popular: PopularLeaderboard[] = [];
  const latestIplSeason = latestSeasonForLeague(slices, "IPL");

  const push = (
    slug: string,
    name: string,
    description: string,
    metric: PopularLeaderboard["metric"],
    filtersLabel: string,
    rows: LeaderboardRow[],
  ) => {
    if (rows.length > 0) {
      popular.push({ slug, name, description, metric, filtersLabel, cutoffDate, rows });
    }
  };

  push(
    "most-runs-ipl-all-time",
    "Most runs (IPL, all time)",
    "Batters ranked by total runs in IPL scorecards.",
    "runs",
    "League: IPL, all seasons",
    computeLeaderboardRows(slices, { metric: "runs", league: "IPL", season: "all", role: "batter", limit: 25 }),
  );
  push(
    "best-strike-rate-ipl",
    "Best strike rate (IPL, min 10 innings)",
    "Attack-first batting in the IPL archive.",
    "strike_rate",
    "League: IPL, minimum 10 innings",
    computeLeaderboardRows(slices, { metric: "strike_rate", league: "IPL", role: "batter", minThresholdType: "innings", minThresholdValue: 10, limit: 25 }),
  );
  push(
    "most-wickets-ipl-all-time",
    "Most wickets (IPL, all time)",
    "IPL wicket-takers ranked by total wickets.",
    "wickets",
    "League: IPL, all seasons",
    computeLeaderboardRows(slices, { metric: "wickets", league: "IPL", role: "bowler", limit: 25 }),
  );
  push(
    "best-economy-scorecard-archive",
    "Best economy (scorecard archive, min 10 overs)",
    "The meanest economy rates across the available scorecard archive.",
    "economy",
    "Available scorecard archive, minimum 10 overs",
    computeLeaderboardRows(slices, { metric: "economy", role: "bowler", minThresholdType: "overs", minThresholdValue: 10, limit: 25 }),
  );
  push(
    "most-sixes-scorecard-archive",
    "Most sixes (scorecard archive)",
    "Pure boundary hitting across the available scorecards.",
    "sixes",
    "Available scorecard archive, all seasons",
    computeLeaderboardRows(slices, { metric: "sixes", role: "batter", limit: 25 }),
  );
  if (latestIplSeason) {
    push(
      `best-all-rounders-ipl-${latestIplSeason}`,
      `Best all-rounders (IPL ${latestIplSeason})`,
      `Composite score using runs and wickets in IPL ${latestIplSeason}.`,
      "all_rounder_score",
      `League: IPL, Season: ${latestIplSeason}`,
      computeLeaderboardRows(slices, {
        metric: "all_rounder_score",
        league: "IPL",
        season: latestIplSeason,
        role: "all_rounder",
        limit: 25,
      }),
    );
  }
  push(
    "highest-average-scorecard-archive",
    "Highest average (scorecard archive, min 5 dismissals)",
    "Batters who stay in and score across the available scorecards.",
    "average",
    "Available scorecard archive, minimum 5 dismissals",
    computeLeaderboardRows(slices, { metric: "average", role: "batter", minThresholdType: "dismissals", minThresholdValue: 5, limit: 25 }),
  );

  const groupedAll = Array.from(byPlayer(slices).values());

  const consistent = groupedAll
    .map((group) => ({ leagueLabel: "All leagues", rank: 0, metricLabel: "Std Dev", metricValue: 0, ...combineSlices(group) }))
    .filter((row) => row.innings >= 10 && row.consistency !== null)
    .sort((left, right) => (left.consistency ?? Infinity) - (right.consistency ?? Infinity))
    .slice(0, 25)
    .map((row, index) => ({
      ...row,
      rank: index + 1,
      metricLabel: "Std Dev",
      metricValue: row.consistency ?? Infinity,
    }));
  push(
    "most-consistent-batters",
    "Most consistent batters (scorecard archive)",
    "Lowest score variance among players with a real sample.",
    "consistency",
    "Available scorecard archive, minimum 10 innings",
    consistent,
  );

  const improving = Array.from(byPlayer(slices).entries())
    .map(([player, playerSlices]) => {
      const seasons = Array.from(
        playerSlices.reduce((map, slice) => {
          const rows = map.get(slice.season) ?? [];
          rows.push(slice);
          map.set(slice.season, rows);
          return map;
        }, new Map<string, LeaderboardAggregateSlice[]>()),
      )
        .map(([season, seasonSlices]) => ({ season, row: combineSlices(seasonSlices) }))
        .sort((left, right) => Number(left.season) - Number(right.season));
      if (seasons.length < 2) {
        return null;
      }
      const previous = seasons[seasons.length - 2].row;
      const current = seasons[seasons.length - 1].row;
      if (previous.innings < 5 || current.innings < 5) {
        return null;
      }
      const improvement = current.runs / current.innings - previous.runs / previous.innings;
      return {
        rank: 0,
        player,
        slug: current.slug,
        leagueLabel: "All leagues",
        matches: current.matches,
        innings: current.innings,
        runs: current.runs,
        wickets: current.wickets,
        average: current.average,
        strikeRate: current.strikeRate,
        economy: current.economy,
        overs: current.overs,
        dismissals: current.dismissals,
        fours: current.fours,
        sixes: current.sixes,
        highestScore: current.highestScore,
        allRounderScore: current.allRounderScore,
        consistency: current.consistency,
        deathEconomy: current.deathEconomy,
        metricValue: improvement,
        metricLabel: "YoY runs/innings gain",
      } satisfies LeaderboardRow;
    })
    .filter(Boolean) as LeaderboardRow[];
  improving.sort((left, right) => right.metricValue - left.metricValue).splice(25);
  push(
    "most-improving-batters",
    "Most improving (season-on-season)",
    "Biggest year-on-year lift in runs per innings.",
    "improvement",
    "All leagues, minimum 5 innings in each of the two latest seasons",
    improving.map((row, index) => ({ ...row, rank: index + 1 })),
  );

  const highScores = Array.from(byPlayer(slices).values())
    .map((group) => ({ leagueLabel: "All leagues", rank: 0, metricLabel: "Highest Score", metricValue: 0, ...combineSlices(group) }))
    .sort((left, right) => right.highestScore - left.highestScore || right.runs - left.runs)
    .slice(0, 25)
    .map((row, index) => ({
      ...row,
      rank: index + 1,
      metricLabel: "Highest Score",
      metricValue: row.highestScore,
    }));
  push(
    "highest-individual-scores",
    "Highest individual scores",
    "The biggest single scorecard knocks in the archive.",
    "highest_score",
    "All leagues, all seasons",
    highScores,
  );
  push("most-runs-scorecard-archive", "Most runs (scorecard archive)", "Batting totals across the available scorecards.", "runs", "Available scorecard archive", computeLeaderboardRows(slices, { metric: "runs", role: "batter", limit: 25 }));
  push("most-wickets-scorecard-archive", "Most wickets (scorecard archive)", "Wicket leaders across the available scorecards.", "wickets", "Available scorecard archive", computeLeaderboardRows(slices, { metric: "wickets", role: "bowler", limit: 25 }));
  push("best-economy-ipl", "Best economy (IPL, min 20 overs)", "IPL bowlers who shut the run rate down.", "economy", "League: IPL, minimum 20 overs", computeLeaderboardRows(slices, { metric: "economy", league: "IPL", role: "bowler", minThresholdType: "overs", minThresholdValue: 20, limit: 25 }));
  push("most-fours-scorecard-archive", "Most fours (scorecard archive)", "The best gap-finders in the archive.", "fours", "Available scorecard archive", computeLeaderboardRows(slices, { metric: "fours", role: "batter", limit: 25 }));
  push("best-all-rounders-ipl-all-time", "Best all-rounders (IPL, all time)", "Composite score using runs and wickets across the IPL archive.", "all_rounder_score", "League: IPL, all seasons", computeLeaderboardRows(slices, { metric: "all_rounder_score", league: "IPL", role: "all_rounder", limit: 25 }));
  push("most-sixes-ipl-all-time", "Most sixes (IPL, all time)", "IPL's biggest hitters ranked by sixes.", "sixes", "League: IPL, all seasons", computeLeaderboardRows(slices, { metric: "sixes", league: "IPL", role: "batter", limit: 25 }));
  push("most-fours-ipl-all-time", "Most fours (IPL, all time)", "IPL boundary accumulation ranked by fours.", "fours", "League: IPL, all seasons", computeLeaderboardRows(slices, { metric: "fours", league: "IPL", role: "batter", limit: 25 }));
  push("highest-average-ipl", "Highest average (IPL, min 10 dismissals)", "IPL batters with the strongest averages over a real sample.", "average", "League: IPL, minimum 10 dismissals", computeLeaderboardRows(slices, { metric: "average", league: "IPL", role: "batter", minThresholdType: "dismissals", minThresholdValue: 10, limit: 25 }));
  push("best-strike-rate-scorecard-archive", "Best strike rate (scorecard archive, min 20 innings)", "Fastest scoring batters over a meaningful sample.", "strike_rate", "Available scorecard archive, minimum 20 innings", computeLeaderboardRows(slices, { metric: "strike_rate", role: "batter", minThresholdType: "innings", minThresholdValue: 20, limit: 25 }));

  return popular.sort((left, right) => left.name.localeCompare(right.name));
}

export function getPopularLeaderboardBySlug(boards: PopularLeaderboard[], slug: string) {
  return boards.find((board) => board.slug === slug) ?? null;
}

export function serializeCustomLeaderboard(config: CustomLeaderboardConfig) {
  const params = new URLSearchParams();
  params.set("name", config.name);
  params.set("metric", config.metric);
  params.set("league", config.league);
  params.set("season", config.season);
  params.set("role", config.role);
  params.set("threshold_type", config.minThreshold.type);
  params.set("threshold_value", String(config.minThreshold.value));
  return params.toString();
}
