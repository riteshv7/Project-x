"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, Variants } from "framer-motion";
import { 
  Sliders, 
  Trophy, 
  UsersThree, 
  User, 
  Calendar, 
  MapPin, 
  ArrowClockwise,
  ChartBar,
  Users,
  CalendarBlank
} from "@phosphor-icons/react";

import { MatchCard } from "@/app/components/match-card";
import { LEAGUE_ORDER } from "@/lib/league";
import type { LeagueCode, MatchSummary } from "@/lib/types";
import { formatLeagueLabel, teamResultForMatch } from "@/lib/utils";

type ResultFilter = "all" | "won" | "lost";
type LeagueFilter = "all" | LeagueCode;

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04
    }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { 
    opacity: 1, 
    y: 0,
    transition: { type: "spring", stiffness: 100, damping: 18 }
  }
};

export function HomePageClient({ matches }: { matches: MatchSummary[] }) {
  const [league, setLeague] = useState<LeagueFilter>("all");
  const [team, setTeam] = useState("");
  const [season, setSeason] = useState("");
  const [result, setResult] = useState<ResultFilter>("all");
  const [visibleCount, setVisibleCount] = useState(24);

  const leagueMatches = matches.filter((match) => (league === "all" ? true : match.league === league));

  const teams = Array.from(
    new Set(leagueMatches.flatMap((match) => [match.teams.team1, match.teams.team2])),
  ).sort();

  const seasons = Array.from(new Set(leagueMatches.map((match) => match.season))).sort(
    (a, b) => Number(b) - Number(a),
  );

  const filteredMatches = leagueMatches.filter((match) => {
    if (team && match.teams.team1 !== team && match.teams.team2 !== team) {
      return false;
    }
    if (season && match.season !== season) {
      return false;
    }
    if (result !== "all" && team) {
      return teamResultForMatch(match, team) === result;
    }
    return true;
  });

  return (
    <main className="mx-auto flex min-h-[100dvh] w-full max-w-7xl flex-col px-4 py-8 sm:px-6 lg:px-8 gap-8">
      {/* Asymmetric Split Hero Header */}
      <header className="glass-card rounded-[2.5rem] p-8 sm:p-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-accent/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between relative z-10">
          <div className="max-w-2xl space-y-4">
            <span className="inline-block rounded-full bg-accent/8 border border-accent/15 px-3 py-1 text-xs font-semibold tracking-wider text-accent-ink">
              Project X
            </span>
            <h1 className="text-5xl font-bold tracking-tight text-accent-ink sm:text-6xl leading-none">
              Sightscreen
            </h1>
            <p className="text-base sm:text-lg leading-relaxed text-muted max-w-[60ch]">
              Cricket analysis for the thinking fan. Browse every precomputed match across IPL,
              BBL, PSL, SA20, and The Hundred, then follow how a game bent, tightened, or slipped
              away.
            </p>
          </div>

          {/* Stats Section with Monospace Numbers */}
          <div className="grid grid-cols-3 gap-4 lg:min-w-[320px]">
            <div className="stat-pill rounded-2xl p-4 flex flex-col justify-center">
              <span className="font-mono text-3xl font-bold tracking-tight text-accent-ink">
                {matches.length}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted mt-1.5 flex items-center gap-1">
                <ChartBar size={12} /> Matches
              </span>
            </div>
            <div className="stat-pill rounded-2xl p-4 flex flex-col justify-center">
              <span className="font-mono text-3xl font-bold tracking-tight text-accent-ink">
                {teams.length}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted mt-1.5 flex items-center gap-1">
                <Users size={12} /> Teams
              </span>
            </div>
            <div className="stat-pill rounded-2xl p-4 flex flex-col justify-center">
              <span className="font-mono text-3xl font-bold tracking-tight text-accent-ink">
                {seasons.length}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted mt-1.5 flex items-center gap-1">
                <CalendarBlank size={12} /> Seasons
              </span>
            </div>
          </div>
        </div>

        {/* Dashboard Navigation Grid */}
        <div className="mt-10 pt-8 border-t border-card-border grid gap-3 grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
          <Link
            href="/explore"
            className="group flex flex-col gap-2 rounded-2xl border border-card-border bg-white/50 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/30 hover:bg-white/80"
          >
            <Sliders size={20} className="text-accent group-hover:scale-105 transition-transform" />
            <span className="text-xs font-semibold text-accent-ink">Advanced filters</span>
          </Link>
          <Link
            href="/leagues"
            className="group flex flex-col gap-2 rounded-2xl border border-card-border bg-white/50 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/30 hover:bg-white/80"
          >
            <Trophy size={20} className="text-accent group-hover:scale-105 transition-transform" />
            <span className="text-xs font-semibold text-accent-ink">Browse leagues</span>
          </Link>
          <Link
            href="/teams"
            className="group flex flex-col gap-2 rounded-2xl border border-card-border bg-white/50 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/30 hover:bg-white/80"
          >
            <UsersThree size={20} className="text-accent group-hover:scale-105 transition-transform" />
            <span className="text-xs font-semibold text-accent-ink">Browse by team</span>
          </Link>
          <Link
            href="/players"
            className="group flex flex-col gap-2 rounded-2xl border border-card-border bg-white/50 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/30 hover:bg-white/80"
          >
            <User size={20} className="text-accent group-hover:scale-105 transition-transform" />
            <span className="text-xs font-semibold text-accent-ink">Browse players</span>
          </Link>
          <Link
            href="/seasons"
            className="group flex flex-col gap-2 rounded-2xl border border-card-border bg-white/50 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/30 hover:bg-white/80"
          >
            <Calendar size={20} className="text-accent group-hover:scale-105 transition-transform" />
            <span className="text-xs font-semibold text-accent-ink">Browse by season</span>
          </Link>
          <Link
            href="/venues"
            className="group flex flex-col gap-2 rounded-2xl border border-card-border bg-white/50 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/30 hover:bg-white/80"
          >
            <MapPin size={20} className="text-accent group-hover:scale-105 transition-transform" />
            <span className="text-xs font-semibold text-accent-ink">Browse by venue</span>
          </Link>
        </div>
      </header>

      {/* Interactive Filter Panel */}
      <section className="glass-card rounded-[2rem] p-6 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end">
          <div className="grid flex-1 gap-5 md:grid-cols-4">
            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                League
              </span>
              <select
                value={league}
                onChange={(event) => {
                  setLeague(event.target.value as LeagueFilter);
                  setTeam("");
                  setSeason("");
                  setResult("all");
                  setVisibleCount(24);
                }}
                className="w-full rounded-2xl border border-card-border bg-white/70 px-4 py-3 text-sm text-foreground outline-none transition focus:border-accent hover:border-accent/20 cursor-pointer animate-none"
              >
                <option value="all">All leagues</option>
                {LEAGUE_ORDER.map((leagueOption) => (
                  <option key={leagueOption} value={leagueOption}>
                    {formatLeagueLabel(leagueOption)}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                Team
              </span>
              <select
                value={team}
                onChange={(event) => {
                  setTeam(event.target.value);
                  setVisibleCount(24);
                }}
                className="w-full rounded-2xl border border-card-border bg-white/70 px-4 py-3 text-sm text-foreground outline-none transition focus:border-accent hover:border-accent/20 cursor-pointer animate-none"
              >
                <option value="">All teams</option>
                {teams.map((teamName) => (
                  <option key={teamName} value={teamName}>
                    {teamName}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                Season
              </span>
              <select
                value={season}
                onChange={(event) => {
                  setSeason(event.target.value);
                  setVisibleCount(24);
                }}
                className="w-full rounded-2xl border border-card-border bg-white/70 px-4 py-3 text-sm text-foreground outline-none transition focus:border-accent hover:border-accent/20 cursor-pointer animate-none"
              >
                <option value="">All seasons</option>
                {seasons.map((seasonOption) => (
                  <option key={seasonOption} value={seasonOption}>
                    {seasonOption}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                Result
              </span>
              <select
                value={result}
                onChange={(event) => {
                  setResult(event.target.value as ResultFilter);
                  setVisibleCount(24);
                }}
                className="w-full rounded-2xl border border-card-border bg-white/70 px-4 py-3 text-sm text-foreground outline-none transition focus:border-accent hover:border-accent/20 cursor-pointer animate-none"
              >
                <option value="all">All results</option>
                <option value="won">Won</option>
                <option value="lost">Lost</option>
              </select>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={() => {
              setLeague("all");
              setTeam("");
              setSeason("");
              setResult("all");
              setVisibleCount(24);
            }}
            className="flex items-center justify-center gap-2 rounded-2xl border border-accent bg-accent text-white px-6 py-3 text-sm font-semibold hover:bg-accent-ink transition-colors cursor-pointer self-stretch lg:self-end lg:h-[46px]"
          >
            <ArrowClockwise size={16} weight="bold" />
            Reset
          </motion.button>
        </div>
        
        <p className="mt-4 text-xs font-medium text-muted tracking-tight">
          {team
            ? `Showing ${filteredMatches.length} ${league === "all" ? "" : `${formatLeagueLabel(league)} `}matches for ${team}${result !== "all" ? ` (${result})` : ""}.`
            : `Showing ${filteredMatches.length} matches ${league === "all" ? "across all leagues." : `in ${formatLeagueLabel(league)}.`}`}
        </p>
      </section>

      {/* Waterfall Reveal matches Grid */}
      <motion.section 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid gap-6 md:grid-cols-2 xl:grid-cols-3"
      >
        {filteredMatches.slice(0, visibleCount).map((match) => (
          <motion.div key={match.match_id} variants={itemVariants}>
            <MatchCard match={match} />
          </motion.div>
        ))}
      </motion.section>

      {/* Load More Button */}
      {filteredMatches.length > visibleCount && (
        <div className="flex justify-center mt-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setVisibleCount((prev) => prev + 24)}
            className="rounded-2xl border border-accent bg-accent text-white px-6 py-3 text-sm font-semibold hover:bg-accent-ink transition-colors cursor-pointer"
          >
            Load More Matches
          </motion.button>
        </div>
      )}
    </main>
  );
}
