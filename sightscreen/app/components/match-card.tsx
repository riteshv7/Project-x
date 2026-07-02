"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight, Calendar, MapPin } from "@phosphor-icons/react";

import { LeagueBadge } from "@/app/components/league-badge";
import type { MatchSummary } from "@/lib/types";
import { formatDisplayDate, formatLeagueLabel } from "@/lib/utils";

export function MatchCard({ match }: { match: MatchSummary }) {
  return (
    <motion.div
      whileHover={{ y: -6, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="h-full"
    >
      <Link
        href={`/matches/${match.match_id}`}
        className="glass-card group flex flex-col justify-between h-full rounded-[2rem] p-6 sm:p-8 hover:border-accent/30 hover:shadow-xl transition-colors duration-200"
      >
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <LeagueBadge league={match.league} />
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted">
                  {formatLeagueLabel(match.league)} {match.season}
                </span>
              </div>
            </div>
            <span className="rounded-full border border-card-border bg-white/70 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-accent-ink">
              Match
            </span>
          </div>

          <h2 className="text-xl font-bold tracking-tight text-accent-ink leading-snug">
            {match.teams.team1} <span className="text-muted font-normal">vs</span> {match.teams.team2}
          </h2>

          <div className="space-y-2.5 pt-2 text-sm text-muted">
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-muted/70" />
              <span>{formatDisplayDate(match.date)}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin size={16} className="text-muted/70" />
              <span className="truncate max-w-[240px]">{match.venue}</span>
            </div>
            <div className="mt-4 rounded-xl bg-accent-soft/40 border border-accent/8 p-3">
              <p className="font-semibold text-accent-ink leading-normal">{match.resultText}</p>
              {match.scoreline && (
                <p className="mt-1 text-xs text-muted font-mono tracking-tight">{match.scoreline}</p>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between border-t border-card-border pt-4 text-sm font-semibold text-accent-ink">
          <span>Open Analysis</span>
          <ArrowUpRight size={18} className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </div>
      </Link>
    </motion.div>
  );
}
