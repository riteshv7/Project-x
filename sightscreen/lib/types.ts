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
  dismissal: string;
  dismissal_type: string;
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
  season: string;
  matchesPlayed: number;
  leaderboard: TeamPerformanceRow[];
  matchSummaries: MatchSummary[];
}

export interface VenueStats {
  venue: string;
  slug: string;
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
  matchesPlayed: number;
  summaries: [H2HTeamSummary, H2HTeamSummary];
  seriesBreakdown: H2HSeasonRow[];
  matchSummaries: MatchSummary[];
}
