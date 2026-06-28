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
