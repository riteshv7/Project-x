import { LEAGUE_ORDER } from "@/lib/league";
import type { LeagueCode, MatchJson, MatchSummary } from "@/lib/types";
import { matchToSummary } from "@/lib/utils";

export type MarginBucket =
  | "1-5-runs"
  | "6-10-runs"
  | "11-plus-runs"
  | "1-wicket"
  | "2-3-wickets"
  | "4-plus-wickets";

export interface ExploreMatch extends MatchSummary {
  marginBucket: MarginBucket | null;
  marginType: "runs" | "wickets";
}

export interface ExploreFilterOptions {
  leagues: LeagueCode[];
  venues: string[];
  teams: string[];
  minDate: string;
  maxDate: string;
  margins: { value: MarginBucket; label: string }[];
}

export interface ExploreDataset {
  matches: ExploreMatch[];
  options: ExploreFilterOptions;
}

export const MARGIN_BUCKET_LABELS: Record<MarginBucket, string> = {
  "1-5-runs": "Won by 1-5 runs",
  "6-10-runs": "Won by 6-10 runs",
  "11-plus-runs": "Won by 11+ runs",
  "1-wicket": "Won by 1 wicket",
  "2-3-wickets": "Won by 2-3 wickets",
  "4-plus-wickets": "Won by 4+ wickets",
};

function parseMarginNumber(margin: string): number {
  const [value] = margin.split(" ");
  return Number(value) || 0;
}

export function getMarginBucket(match: MatchJson): MarginBucket | null {
  const margin = parseMarginNumber(match.result.margin);
  if (match.result.margin_type === "runs") {
    if (margin >= 1 && margin <= 5) {
      return "1-5-runs";
    }
    if (margin >= 6 && margin <= 10) {
      return "6-10-runs";
    }
    return "11-plus-runs";
  }
  if (margin === 1) {
    return "1-wicket";
  }
  if (margin >= 2 && margin <= 3) {
    return "2-3-wickets";
  }
  return "4-plus-wickets";
}

export function buildExploreDataset(matches: MatchJson[]): ExploreDataset {
  const summaries = matches
    .map((match) => ({
      ...matchToSummary(match),
      marginBucket: getMarginBucket(match),
      marginType: match.result.margin_type,
    }))
    .sort((left, right) => {
      if (left.date === right.date) {
        return left.match_id.localeCompare(right.match_id);
      }
      return left.date < right.date ? 1 : -1;
    });
  const dates = summaries.map((match) => match.date).sort();

  return {
    matches: summaries,
    options: {
      leagues: LEAGUE_ORDER,
      venues: Array.from(new Set(matches.map((match) => match.venue))).sort((left, right) =>
        left.localeCompare(right),
      ),
      teams: Array.from(new Set(matches.flatMap((match) => [match.teams.team1, match.teams.team2]))).sort(
        (left, right) => left.localeCompare(right),
      ),
      minDate: dates[0] ?? "",
      maxDate: dates[dates.length - 1] ?? "",
      margins: Object.entries(MARGIN_BUCKET_LABELS).map(([value, label]) => ({
        value: value as MarginBucket,
        label,
      })),
    },
  };
}
