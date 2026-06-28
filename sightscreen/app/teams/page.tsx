import Link from "next/link";

import { HeroCard, PageFrame, StatPill } from "@/app/components/section-shell";
import { getAllMatches } from "@/lib/data";
import { getAllTeams, getTeamStats } from "@/lib/match-aggregator";

export default async function TeamsPage() {
  const matches = await getAllMatches();
  const teamNames = getAllTeams(matches);
  const teamCards = teamNames.map((teamName) => getTeamStats(teamName, matches));

  return (
    <PageFrame>
      <HeroCard
        eyebrow="Browse Teams"
        title="Every IPL team page"
        description={
          <p>
            Jump into franchise-level records, season arcs, and full match logs for every side in
            the Sightscreen archive.
          </p>
        }
        aside={
          <>
            <StatPill label="Teams" value={teamCards.length} />
            <StatPill label="Matches" value={matches.length} />
          </>
        }
      />

      <section className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {teamCards.map((team) => (
          <Link
            key={team.slug}
            href={`/teams/${team.slug}`}
            className="glass-card rounded-[1.75rem] p-6 transition duration-200 hover:-translate-y-1 hover:border-accent/30"
          >
            <p className="section-title">Team</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-accent-ink">
              {team.teamName}
            </h2>
            <div className="mt-6 grid gap-3 text-sm text-muted sm:grid-cols-2">
              <StatPill label="Seasons" value={team.seasonRange} />
              <StatPill label="Win Rate" value={`${team.winPct.toFixed(1)}%`} />
              <StatPill label="Wins" value={team.wins} />
              <StatPill label="Avg Score" value={team.avgScore.toFixed(1)} />
            </div>
          </Link>
        ))}
      </section>
    </PageFrame>
  );
}
