export type LeagueCode = "IPL" | "BBL" | "PSL" | "SA20" | "HUNDRED";

export interface LeagueMetadata {
  code: LeagueCode;
  slug: string;
  name: string;
  badge: string;
  description: string;
  shortLabel: string;
}

export interface WinProbabilityPoint {
  over: number;
  ball: number;
  probability: number;
}

export interface KeyMoment {
  over: number;
  ball: number;
  swing: number;
  probability_before: number;
  probability_after: number;
  description: string;
}

export interface PhaseSummary {
  overs: string;
  runs: number;
  wickets: number;
  run_rate: number;
  required_run_rate: number | null;
}

export interface BatterScorecardRow {
  name: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  dismissal: string | null;
  dismissal_type: string | null;
}

export interface BowlerScorecardRow {
  name: string;
  overs: number;
  runs_conceded: number;
  wickets: number;
  economy: number;
  maidens: number;
}

export interface RunsBreakdown {
  runs_off_bat: number;
  byes: number;
  legbyes: number;
  wides: number;
  noballs: number;
  total: number;
}

export interface InningsScorecard {
  batters: BatterScorecardRow[];
  bowlers: BowlerScorecardRow[];
  runs_breakdown: RunsBreakdown;
}

export interface InningsAnalysis {
  innings_number: number;
  batting_team: string;
  bowling_team: string;
  final_score: number;
  wickets: number;
  overs: number;
  target?: number;
  win_probability_curve: WinProbabilityPoint[];
  key_moments: KeyMoment[];
  phases: {
    powerplay: PhaseSummary;
    middle: PhaseSummary;
    death: PhaseSummary;
  };
  pressure_index: number;
  match_shape: number | null;
  scorecard: InningsScorecard;
}

export interface MatchResult {
  winner: string;
  margin: string;
  margin_type: "runs" | "wickets";
}

export interface MatchJson {
  match_id: string;
  league: LeagueCode;
  date: string;
  venue: string;
  teams: {
    team1: string;
    team2: string;
  };
  result: MatchResult;
  toss?: {
    winner: string;
    decision: string;
  };
  innings: [InningsAnalysis, InningsAnalysis];
}

export interface MatchSummary {
  match_id: string;
  league: LeagueCode;
  date: string;
  season: string;
  venue: string;
  teams: {
    team1: string;
    team2: string;
  };
  winner: string;
  resultText: string;
  scoreline: string;
}

export interface TeamSeasonRow {
  league: LeagueCode;
  season: string;
  matchesPlayed: number;
  wins: number;
  losses: number;
  ties: number;
  winPct: number;
}

export interface TeamStats {
  teamName: string;
  slug: string;
  leagues: LeagueCode[];
  primaryLeague: LeagueCode | null;
  seasonRange: string;
  matchesPlayed: number;
  wins: number;
  losses: number;
  ties: number;
  winPct: number;
  avgScore: number;
  avgOppositionScore: number;
  seasonBreakdown: TeamSeasonRow[];
  opponents: {
    teamName: string;
    slug: string;
    matchesPlayed: number;
  }[];
  matchSummaries: MatchSummary[];
}

export interface TeamPerformanceRow {
  teamName: string;
  slug: string;
  matchesPlayed: number;
  wins: number;
  losses: number;
  ties: number;
  winPct: number;
  avgScore: number;
  avgOppositionScore: number;
}

export interface SeasonStats {
  league: LeagueCode | "all";
  season: string;
  matchesPlayed: number;
  leaderboard: TeamPerformanceRow[];
  matchSummaries: MatchSummary[];
}

export interface VenueStats {
  venue: string;
  slug: string;
  leagues: LeagueCode[];
  matchesPlayed: number;
  avgScore: number;
  homeTeam: {
    teamName: string;
    slug: string;
    matchesPlayed: number;
    winPct: number;
  } | null;
  mostCommonPairing: {
    label: string;
    matchesPlayed: number;
  } | null;
  teamPerformance: TeamPerformanceRow[];
  matchSummaries: MatchSummary[];
}

export interface H2HTeamSummary {
  teamName: string;
  slug: string;
  matchesPlayed: number;
  wins: number;
  losses: number;
  ties: number;
  winPct: number;
  avgScore: number;
  avgOppositionScore: number;
}

export interface H2HSeasonRow {
  season: string;
  matchesPlayed: number;
  team1Wins: number;
  team2Wins: number;
  ties: number;
  team1WinPct: number;
  team2WinPct: number;
}

export interface H2HStats {
  team1: string;
  team2: string;
  slug: string;
  leagues: LeagueCode[];
  matchesPlayed: number;
  summaries: [H2HTeamSummary, H2HTeamSummary];
  seriesBreakdown: H2HSeasonRow[];
  matchSummaries: MatchSummary[];
}

export interface LeagueSeasonRow {
  season: string;
  matchesPlayed: number;
  teams: number;
}

export interface LeagueTeamRow {
  teamName: string;
  slug: string;
  matchesPlayed: number;
  wins: number;
  losses: number;
  winPct: number;
  avgScore: number;
}

export interface LeagueStats {
  metadata: LeagueMetadata;
  matchesPlayed: number;
  teams: string[];
  seasons: string[];
  leaderboard: LeagueTeamRow[];
  seasonBreakdown: LeagueSeasonRow[];
  matchSummaries: MatchSummary[];
}

export interface PlaylistSummary {
  slug: string;
  name: string;
  description: string;
  matchCount: number;
  generatedAt: string;
  criteria: string;
}

export interface MatchPlaylist {
  slug: string;
  name: string;
  description: string;
  criteria: string;
  generatedAt: string;
  matches: MatchSummary[];
  availableLeagues: LeagueCode[];
  availableSeasons: string[];
  availableVenues: string[];
}

export interface PersonalPlaylist {
  id: string;
  name: string;
  description: string;
  created_at: string;
  matches: string[];
}

export interface TeamAnalyticsBatterRow {
  name: string;
  matches: number;
  runs: number;
  average: number | null;
  strikeRate: number;
  fours: number;
  sixes: number;
}

export interface TeamAnalyticsBowlerRow {
  name: string;
  matches: number;
  overs: number;
  runs: number;
  wickets: number;
  economy: number;
  avgWicketsPerMatch: number;
}

export interface TeamAnalyticsSplitRow {
  matches: number;
  wins: number;
  losses: number;
  winPercent: number;
  avgScore: number;
  avgOppositionScore: number;
}

export interface TeamAnalyticsSeasonRow {
  season: string;
  matches: number;
  wins: number;
  losses: number;
  winPercent: number;
  avgScore: number;
  avgOppositionScore: number;
}

export interface TeamAnalyticsStats {
  teamName: string;
  slug: string;
  leagues: LeagueCode[];
  homeGround: string | null;
  batterStats: TeamAnalyticsBatterRow[];
  bowlerStats: TeamAnalyticsBowlerRow[];
  homeAway: {
    home: TeamAnalyticsSplitRow;
    away: TeamAnalyticsSplitRow;
  };
  seasonTrends: TeamAnalyticsSeasonRow[];
  battingInsight: string;
  bowlingInsight: string;
  homeAwayInsight: string;
  seasonInsight: string;
}

export type LeaderboardMetric =
  | "runs"
  | "wickets"
  | "strike_rate"
  | "economy"
  | "average"
  | "sixes"
  | "fours"
  | "all_rounder_score";

export type LeaderboardRole = "any" | "batter" | "bowler" | "all_rounder";

export type LeaderboardThresholdType = "innings" | "dismissals" | "overs" | "matches";

export interface LeaderboardThreshold {
  type: LeaderboardThresholdType;
  value: number;
}

export interface LeaderboardAggregateSlice {
  player: string;
  slug: string;
  league: LeagueCode;
  season: string;
  matches: number;
  innings: number;
  runs: number;
  balls: number;
  dismissals: number;
  fours: number;
  sixes: number;
  highestScore: number;
  scoreSumSquares: number;
  wickets: number;
  bowlingMatches: number;
  bowlingBalls: number;
  runsConceded: number;
  deathBalls: number;
  deathRunsConceded: number;
  deathWickets: number;
}

export interface LeaderboardRow {
  rank: number;
  player: string;
  slug: string;
  leagueLabel: string;
  matches: number;
  innings: number;
  runs: number;
  wickets: number;
  average: number | null;
  strikeRate: number;
  economy: number | null;
  overs: number;
  dismissals: number;
  fours: number;
  sixes: number;
  highestScore: number;
  allRounderScore: number;
  consistency: number | null;
  deathEconomy: number | null;
  metricValue: number;
  metricLabel: string;
}

export interface PopularLeaderboard {
  slug: string;
  name: string;
  description: string;
  metric: LeaderboardMetric | "consistency" | "death_economy" | "highest_score" | "improvement";
  filtersLabel: string;
  cutoffDate: string;
  rows: LeaderboardRow[];
}

export interface CustomLeaderboardConfig {
  id: string;
  name: string;
  metric: LeaderboardMetric;
  league: LeagueCode | "all";
  season: string | "all";
  role: LeaderboardRole;
  minThreshold: LeaderboardThreshold;
  created_at: string;
}
