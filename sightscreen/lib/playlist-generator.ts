import type { LeagueCode, MatchJson, MatchPlaylist, MatchSummary, PlaylistSummary } from "@/lib/types";
import { matchToSummary, sortMatchesByDateDesc } from "@/lib/utils";

interface MatchMetrics {
  match: MatchJson;
  summary: MatchSummary;
  totalRuns: number;
  totalWickets: number;
  maxBatterRuns: number;
  peakWinProbability: number;
  minimumWinProbability: number;
  chasePeakProbability: number;
  chaseMinProbability: number;
  chaseWon: boolean;
  wicketsMargin: number | null;
  oversCompleted: number;
  pressureIndex: number;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function summarizeMatch(match: MatchJson): MatchMetrics {
  const summary = matchToSummary(match);
  const totalRuns = match.innings.reduce((sum, innings) => sum + innings.final_score, 0);
  const totalWickets = match.innings.reduce((sum, innings) => sum + innings.wickets, 0);
  const maxBatterRuns = Math.max(
    0,
    ...match.innings.flatMap((innings) => (innings.scorecard?.batters ?? []).map((batter) => batter.runs)),
  );
  const allProbabilities = match.innings.flatMap((innings) =>
    innings.win_probability_curve
      .map((point) => point.probability)
      .filter(isFiniteNumber),
  );
  const chaseCurve = match.innings[1]?.win_probability_curve ?? [];
  const chaseProbabilities = chaseCurve.map((point) => point.probability).filter(isFiniteNumber);
  const peakWinProbability = allProbabilities.length ? Math.max(...allProbabilities) : 0;
  const minimumWinProbability = allProbabilities.length ? Math.min(...allProbabilities) : 0;
  const chasePeakProbability = chaseProbabilities.length ? Math.max(...chaseProbabilities) : 0;
  const chaseMinProbability = chaseProbabilities.length ? Math.min(...chaseProbabilities) : 0;
  const wicketsMargin =
    match.result.margin_type === "wickets" ? Number(match.result.margin.split(" ")[0]) || null : null;
  const oversCompleted = Math.min(...match.innings.map((innings) => innings.overs));
  const pressureIndex =
    match.innings.reduce((sum, innings) => sum + (innings.pressure_index ?? 0), 0) /
    Math.max(match.innings.length, 1);

  return {
    match,
    summary,
    totalRuns,
    totalWickets,
    maxBatterRuns,
    peakWinProbability,
    minimumWinProbability,
    chasePeakProbability,
    chaseMinProbability,
    chaseWon: match.result.winner === match.innings[1]?.batting_team,
    wicketsMargin,
    oversCompleted,
    pressureIndex,
  };
}

function buildPlaylist(
  slug: string,
  name: string,
  description: string,
  criteria: string,
  metrics: MatchMetrics[],
): MatchPlaylist {
  const matches = sortMatchesByDateDesc(metrics.map((entry) => entry.summary));
  return {
    slug,
    name,
    description,
    criteria,
    generatedAt: new Date().toISOString().slice(0, 10),
    matches,
    availableLeagues: Array.from(new Set(matches.map((match) => match.league))),
    availableSeasons: Array.from(new Set(matches.map((match) => match.season))).sort(
      (left, right) => Number(right) - Number(left),
    ),
    availableVenues: Array.from(new Set(matches.map((match) => match.venue))).sort((left, right) =>
      left.localeCompare(right),
    ),
  };
}

export function generateCuratedPlaylists(matches: MatchJson[]): MatchPlaylist[] {
  const metrics = matches.map(summarizeMatch);
  const playlists: MatchPlaylist[] = [];

  const push = (
    slug: string,
    name: string,
    description: string,
    criteria: string,
    rows: MatchMetrics[],
  ) => {
    if (rows.length > 0) {
      playlists.push(buildPlaylist(slug, name, description, criteria, rows));
    }
  };

  const byLeague = (league: LeagueCode) => metrics.filter((entry) => entry.match.league === league);

  push(
    "most-tense-matches",
    "Most tense matches",
    "High-pressure finishes from across the archive.",
    "Pressure index above 0.65, sorted highest first.",
    metrics.filter((entry) => entry.pressureIndex > 0.65).sort((a, b) => b.pressureIndex - a.pressureIndex).slice(0, 24),
  );
  push(
    "highest-scoring-the-hundred",
    "Highest-scoring The Hundred matches",
    "Run-heavy nights in 100-ball cricket.",
    "The Hundred matches sorted by combined total runs.",
    byLeague("HUNDRED").sort((a, b) => b.totalRuns - a.totalRuns).slice(0, 24),
  );
  push(
    "lowest-scoring-psl",
    "Lowest-scoring PSL matches",
    "Scraps and squeezes from the PSL.",
    "PSL matches sorted by combined total runs ascending.",
    byLeague("PSL").sort((a, b) => a.totalRuns - b.totalRuns).slice(0, 24),
  );
  push(
    "biggest-upsets",
    "Biggest upsets",
    "Matches where the eventual winner spent long stretches behind.",
    "Winner came from a side whose win probability fell under 30%.",
    metrics
      .filter((entry) => entry.minimumWinProbability < 0.3)
      .sort((a, b) => a.minimumWinProbability - b.minimumWinProbability)
      .slice(0, 24),
  );
  push(
    "record-breaking-chases",
    "Record-breaking chases",
    "Successful pursuits that stayed hard deep into the chase.",
    "Chase won after reaching no better than 55% win probability mid-innings.",
    metrics
      .filter((entry) => entry.chaseWon && entry.chaseMinProbability < 0.4)
      .sort((a, b) => a.chaseMinProbability - b.chaseMinProbability)
      .slice(0, 24),
  );
  push(
    "one-wicket-finishes",
    "One-wicket finishes",
    "The chases that nearly fell apart at the line.",
    "Matches won by exactly one wicket.",
    metrics.filter((entry) => entry.wicketsMargin === 1).sort((a, b) => b.summary.date.localeCompare(a.summary.date)),
  );
  push(
    "highest-individual-scores",
    "Highest individual scores",
    "Matches featuring the biggest individual batting performances.",
    "Sorted by the top batter score recorded in the scorecard.",
    metrics.filter((entry) => entry.maxBatterRuns > 0).sort((a, b) => b.maxBatterRuns - a.maxBatterRuns).slice(0, 24),
  );
  push(
    "most-wickets-in-a-match",
    "Most wickets in a match",
    "Games where wickets kept falling all night.",
    "Sorted by total wickets fallen across both innings.",
    metrics.sort((a, b) => b.totalWickets - a.totalWickets).slice(0, 24),
  );
  push(
    "fastest-team-totals",
    "Fastest team totals",
    "Matches finished in a hurry.",
    "Sorted by the fewest overs completed in the winning chase or defense.",
    metrics.sort((a, b) => a.oversCompleted - b.oversCompleted).slice(0, 24),
  );
  push(
    "comeback-wins",
    "Comeback wins",
    "Matches that bent hardest before the final result flipped them back.",
    "Winner spent time below 25% win probability.",
    metrics
      .filter((entry) => entry.minimumWinProbability < 0.25)
      .sort((a, b) => a.minimumWinProbability - b.minimumWinProbability)
      .slice(0, 24),
  );
  push(
    "ipl-thrillers",
    "IPL thrillers",
    "Close, noisy IPL nights.",
    "IPL matches with pressure index above 0.6.",
    byLeague("IPL").filter((entry) => entry.pressureIndex > 0.6).sort((a, b) => b.pressureIndex - a.pressureIndex).slice(0, 24),
  );
  push(
    "bbl-nail-biters",
    "BBL nail-biters",
    "BBL finishes that kept changing shape.",
    "BBL matches with pressure index above 0.58.",
    byLeague("BBL").filter((entry) => entry.pressureIndex > 0.58).sort((a, b) => b.pressureIndex - a.pressureIndex).slice(0, 24),
  );
  push(
    "sa20-sprint-chases",
    "SA20 sprint chases",
    "Chases closed out with aggression in SA20.",
    "SA20 chase wins sorted by highest chase peak probability.",
    byLeague("SA20")
      .filter((entry) => entry.chaseWon)
      .sort((a, b) => b.chasePeakProbability - a.chasePeakProbability)
      .slice(0, 24),
  );
  push(
    "power-hitting-showcases",
    "Power-hitting showcases",
    "Combined scorecards that caught fire.",
    "Matches with combined runs above 380.",
    metrics.filter((entry) => entry.totalRuns >= 380).sort((a, b) => b.totalRuns - a.totalRuns).slice(0, 24),
  );
  push(
    "defensive-masterclasses",
    "Defensive masterclasses",
    "Low totals that still held.",
    "Matches won by the side batting first with combined runs under 300.",
    metrics
      .filter(
        (entry) =>
          entry.totalRuns < 300 &&
          entry.match.result.winner === entry.match.innings[0]?.batting_team,
      )
      .sort((a, b) => a.totalRuns - b.totalRuns)
      .slice(0, 24),
  );

  return playlists.sort((left, right) => left.name.localeCompare(right.name));
}

export function getPlaylistSummaries(playlists: MatchPlaylist[]): PlaylistSummary[] {
  return playlists.map((playlist) => ({
    slug: playlist.slug,
    name: playlist.name,
    description: playlist.description,
    matchCount: playlist.matches.length,
    generatedAt: playlist.generatedAt,
    criteria: playlist.criteria,
  }));
}

export function getPlaylistBySlug(playlists: MatchPlaylist[], slug: string): MatchPlaylist | null {
  return playlists.find((playlist) => playlist.slug === slug) ?? null;
}
