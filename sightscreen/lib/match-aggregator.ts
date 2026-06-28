import type {
  H2HSeasonRow,
  H2HStats,
  H2HTeamSummary,
  MatchJson,
  MatchSummary,
  SeasonStats,
  TeamPerformanceRow,
  TeamSeasonRow,
  TeamStats,
  VenueStats,
} from "@/lib/types";
import {
  buildH2HSlug,
  matchToSummary,
  seasonFromDate,
  slugifySegment,
  sortMatchesByDateAsc,
  sortMatchesByDateDesc,
} from "@/lib/utils";

function isTeamInMatch(match: MatchJson, teamName: string): boolean {
  return match.teams.team1 === teamName || match.teams.team2 === teamName;
}

function getTeamInningsScores(match: MatchJson, teamName: string) {
  const batting = match.innings.find((innings) => innings.batting_team === teamName)?.final_score ?? null;
  const bowling =
    match.innings.find((innings) => innings.bowling_team === teamName)?.final_score ?? null;

  return { batting, bowling };
}

function summarizeMatches(matches: MatchJson[]): MatchSummary[] {
  return matches.map((match) => matchToSummary(match));
}

function computeTeamPerformance(teamName: string, matches: MatchJson[]): TeamPerformanceRow {
  let wins = 0;
  let losses = 0;
  let ties = 0;
  let battingScoreTotal = 0;
  let battingInningsCount = 0;
  let bowlingScoreTotal = 0;
  let bowlingInningsCount = 0;

  for (const match of matches) {
    if (!isTeamInMatch(match, teamName)) {
      continue;
    }

    if (match.result.winner === teamName) {
      wins += 1;
    } else if (match.result.winner === "") {
      ties += 1;
    } else {
      losses += 1;
    }

    const scores = getTeamInningsScores(match, teamName);
    if (scores.batting !== null) {
      battingScoreTotal += scores.batting;
      battingInningsCount += 1;
    }
    if (scores.bowling !== null) {
      bowlingScoreTotal += scores.bowling;
      bowlingInningsCount += 1;
    }
  }

  const matchesPlayed = wins + losses + ties;

  return {
    teamName,
    slug: slugifySegment(teamName),
    matchesPlayed,
    wins,
    losses,
    ties,
    winPct: matchesPlayed === 0 ? 0 : (wins / matchesPlayed) * 100,
    avgScore: battingInningsCount === 0 ? 0 : battingScoreTotal / battingInningsCount,
    avgOppositionScore: bowlingInningsCount === 0 ? 0 : bowlingScoreTotal / bowlingInningsCount,
  };
}

export function getAllTeams(matches: MatchJson[]): string[] {
  return Array.from(
    new Set(matches.flatMap((match) => [match.teams.team1, match.teams.team2])),
  ).sort((a, b) => a.localeCompare(b));
}

export function getAllSeasons(matches: MatchJson[]): string[] {
  return Array.from(new Set(matches.map((match) => seasonFromDate(match.date)))).sort(
    (a, b) => Number(b) - Number(a),
  );
}

export function getAllVenues(matches: MatchJson[]): string[] {
  return Array.from(new Set(matches.map((match) => match.venue))).sort((a, b) =>
    a.localeCompare(b),
  );
}

export function getAllH2HPairs(matches: MatchJson[]): { slug: string; team1: string; team2: string }[] {
  const pairs = new Map<string, { slug: string; team1: string; team2: string }>();

  for (const match of matches) {
    const [team1, team2] = [match.teams.team1, match.teams.team2].sort((a, b) =>
      a.localeCompare(b),
    );
    const slug = buildH2HSlug(team1, team2);
    pairs.set(slug, { slug, team1, team2 });
  }

  return Array.from(pairs.values()).sort((a, b) => a.slug.localeCompare(b.slug));
}

export function getTeamStats(teamName: string, matches: MatchJson[]): TeamStats {
  const teamMatches = matches.filter((match) => isTeamInMatch(match, teamName));
  const performance = computeTeamPerformance(teamName, teamMatches);
  const seasons = teamMatches.map((match) => seasonFromDate(match.date));
  const seasonRange =
    seasons.length === 0
      ? ""
      : `${Math.min(...seasons.map(Number))}-${Math.max(...seasons.map(Number))}`;
  const perSeason = new Map<string, MatchJson[]>();
  const opponentCounts = new Map<string, number>();

  for (const match of teamMatches) {
    const season = seasonFromDate(match.date);
    const seasonMatches = perSeason.get(season) ?? [];
    seasonMatches.push(match);
    perSeason.set(season, seasonMatches);

    const opponent = match.teams.team1 === teamName ? match.teams.team2 : match.teams.team1;
    opponentCounts.set(opponent, (opponentCounts.get(opponent) ?? 0) + 1);
  }

  const seasonBreakdown: TeamSeasonRow[] = Array.from(perSeason.entries())
    .map(([season, seasonMatches]) => ({ season, ...computeTeamPerformance(teamName, seasonMatches) }))
    .sort((a, b) => Number(b.season) - Number(a.season))
    .map(({ season, matchesPlayed, wins, losses, ties, winPct }) => ({
      season,
      matchesPlayed,
      wins,
      losses,
      ties,
      winPct,
    }));

  const opponents = Array.from(opponentCounts.entries())
    .map(([opponent, matchesPlayed]) => ({
      teamName: opponent,
      slug: buildH2HSlug(teamName, opponent),
      matchesPlayed,
    }))
    .sort((a, b) => {
      if (b.matchesPlayed === a.matchesPlayed) {
        return a.teamName.localeCompare(b.teamName);
      }
      return b.matchesPlayed - a.matchesPlayed;
    });

  return {
    teamName,
    slug: slugifySegment(teamName),
    seasonRange,
    matchesPlayed: performance.matchesPlayed,
    wins: performance.wins,
    losses: performance.losses,
    ties: performance.ties,
    winPct: performance.winPct,
    avgScore: performance.avgScore,
    avgOppositionScore: performance.avgOppositionScore,
    seasonBreakdown,
    opponents,
    matchSummaries: sortMatchesByDateDesc(summarizeMatches(teamMatches)),
  };
}

export function getSeasonStats(season: string, matches: MatchJson[]): SeasonStats {
  const seasonMatches = matches.filter((match) => seasonFromDate(match.date) === season);
  const teams = getAllTeams(seasonMatches);
  const leaderboard = teams
    .map((teamName) => computeTeamPerformance(teamName, seasonMatches))
    .sort((a, b) => {
      if (b.winPct === a.winPct) {
        if (b.wins === a.wins) {
          return a.teamName.localeCompare(b.teamName);
        }
        return b.wins - a.wins;
      }
      return b.winPct - a.winPct;
    });

  return {
    season,
    matchesPlayed: seasonMatches.length,
    leaderboard,
    matchSummaries: sortMatchesByDateAsc(summarizeMatches(seasonMatches)),
  };
}

export function getVenueStats(venue: string, matches: MatchJson[]): VenueStats {
  const venueMatches = matches.filter((match) => match.venue === venue);
  const teams = getAllTeams(venueMatches);
  const teamPerformance = teams
    .map((teamName) => computeTeamPerformance(teamName, venueMatches))
    .sort((a, b) => {
      if (b.winPct === a.winPct) {
        if (b.matchesPlayed === a.matchesPlayed) {
          return a.teamName.localeCompare(b.teamName);
        }
        return b.matchesPlayed - a.matchesPlayed;
      }
      return b.winPct - a.winPct;
    });

  let totalScore = 0;
  let inningsCount = 0;
  const pairingCounts = new Map<string, number>();

  for (const match of venueMatches) {
    inningsCount += match.innings.length;
    totalScore += match.innings.reduce((sum, innings) => sum + innings.final_score, 0);

    const pairLabel = [match.teams.team1, match.teams.team2].sort((a, b) => a.localeCompare(b)).join(" vs ");
    pairingCounts.set(pairLabel, (pairingCounts.get(pairLabel) ?? 0) + 1);
  }

  const homeTeamRow = [...teamPerformance].sort((a, b) => {
    if (b.matchesPlayed === a.matchesPlayed) {
      return b.winPct - a.winPct;
    }
    return b.matchesPlayed - a.matchesPlayed;
  })[0] ?? null;

  const mostCommonPairingEntry = [...pairingCounts.entries()].sort((a, b) => {
    if (b[1] === a[1]) {
      return a[0].localeCompare(b[0]);
    }
    return b[1] - a[1];
  })[0];

  return {
    venue,
    slug: slugifySegment(venue),
    matchesPlayed: venueMatches.length,
    avgScore: inningsCount === 0 ? 0 : totalScore / inningsCount,
    homeTeam: homeTeamRow
      ? {
          teamName: homeTeamRow.teamName,
          slug: homeTeamRow.slug,
          matchesPlayed: homeTeamRow.matchesPlayed,
          winPct: homeTeamRow.winPct,
        }
      : null,
    mostCommonPairing: mostCommonPairingEntry
      ? {
          label: mostCommonPairingEntry[0],
          matchesPlayed: mostCommonPairingEntry[1],
        }
      : null,
    teamPerformance,
    matchSummaries: sortMatchesByDateAsc(summarizeMatches(venueMatches)),
  };
}

function computeH2HTeamSummary(teamName: string, matches: MatchJson[]): H2HTeamSummary {
  const performance = computeTeamPerformance(teamName, matches);
  return {
    teamName,
    slug: performance.slug,
    matchesPlayed: performance.matchesPlayed,
    wins: performance.wins,
    losses: performance.losses,
    ties: performance.ties,
    winPct: performance.winPct,
    avgScore: performance.avgScore,
    avgOppositionScore: performance.avgOppositionScore,
  };
}

export function getH2HStats(team1: string, team2: string, matches: MatchJson[]): H2HStats {
  const h2hMatches = matches.filter((match) => {
    const teams = [match.teams.team1, match.teams.team2];
    return teams.includes(team1) && teams.includes(team2);
  });
  const bySeason = new Map<string, MatchJson[]>();

  for (const match of h2hMatches) {
    const season = seasonFromDate(match.date);
    const seasonMatches = bySeason.get(season) ?? [];
    seasonMatches.push(match);
    bySeason.set(season, seasonMatches);
  }

  const seriesBreakdown: H2HSeasonRow[] = Array.from(bySeason.entries())
    .map(([season, seasonMatches]) => {
      const team1Summary = computeTeamPerformance(team1, seasonMatches);
      const team2Summary = computeTeamPerformance(team2, seasonMatches);
      return {
        season,
        matchesPlayed: seasonMatches.length,
        team1Wins: team1Summary.wins,
        team2Wins: team2Summary.wins,
        ties: seasonMatches.length - team1Summary.wins - team2Summary.wins,
        team1WinPct: team1Summary.winPct,
        team2WinPct: team2Summary.winPct,
      };
    })
    .sort((a, b) => Number(b.season) - Number(a.season));

  return {
    team1,
    team2,
    slug: buildH2HSlug(team1, team2),
    matchesPlayed: h2hMatches.length,
    summaries: [computeH2HTeamSummary(team1, h2hMatches), computeH2HTeamSummary(team2, h2hMatches)],
    seriesBreakdown,
    matchSummaries: sortMatchesByDateAsc(summarizeMatches(h2hMatches)),
  };
}
