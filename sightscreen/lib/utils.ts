import type { InningsAnalysis, KeyMoment, MatchJson, MatchSummary } from "@/lib/types";

export function seasonFromDate(date: string): string {
  return new Date(date).getUTCFullYear().toString();
}

export function formatDisplayDate(date: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

export function formatResultText(match: Pick<MatchJson, "result">): string {
  return `${match.result.winner} won by ${match.result.margin}`;
}

export function formatScore(innings: InningsAnalysis): string {
  return `${innings.batting_team} ${innings.final_score}/${innings.wickets} (${innings.overs.toFixed(2)})`;
}

export function buildScoreline(match: MatchJson): string {
  return `${formatScore(match.innings[0])} • ${formatScore(match.innings[1])}`;
}

export function matchToSummary(match: MatchJson): MatchSummary {
  return {
    match_id: match.match_id,
    date: match.date,
    season: seasonFromDate(match.date),
    venue: match.venue,
    teams: match.teams,
    winner: match.result.winner,
    resultText: formatResultText(match),
    scoreline: buildScoreline(match),
  };
}

export function sortMatchesByDateDesc(matches: MatchSummary[]): MatchSummary[] {
  return [...matches].sort((a, b) => {
    if (a.date === b.date) {
      return a.match_id.localeCompare(b.match_id);
    }
    return a.date < b.date ? 1 : -1;
  });
}

export function teamResultForMatch(match: MatchSummary, team: string): "won" | "lost" | null {
  if (!team) {
    return null;
  }

  if (match.teams.team1 !== team && match.teams.team2 !== team) {
    return null;
  }

  return match.winner === team ? "won" : "lost";
}

export function momentSwingText(moment: KeyMoment): string {
  const direction = moment.probability_after >= moment.probability_before ? "+" : "-";
  return `${direction}${(moment.swing * 100).toFixed(1)}%`;
}

export function pressureLabel(value: number): string {
  if (value >= 0.66) {
    return "High";
  }
  if (value >= 0.4) {
    return "Moderate";
  }
  return "Low";
}

export function matchShapeCopy(peak: number | null): string {
  if (peak === null) {
    return "";
  }
  if (peak >= 0.75) {
    return `Peak chase probability: ${(peak * 100).toFixed(0)}% — the chase was very much on.`;
  }
  if (peak >= 0.45) {
    return `Peak chase probability: ${(peak * 100).toFixed(0)}% — there was a real window for the chase.`;
  }
  return `Peak chase probability: ${(peak * 100).toFixed(0)}% — the chase never really felt on.`;
}

export function inningsChartData(innings: InningsAnalysis) {
  return innings.win_probability_curve.map((point) => ({
    ...point,
    overBall: Number((point.over + point.ball / 10).toFixed(1)),
  }));
}

export function phaseRows(innings: InningsAnalysis) {
  return [
    ["Powerplay", innings.phases.powerplay],
    ["Middle", innings.phases.middle],
    ["Death", innings.phases.death],
  ] as const;
}
