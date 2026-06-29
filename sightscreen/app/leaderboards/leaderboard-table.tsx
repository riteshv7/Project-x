import Link from "next/link";

import type { LeaderboardRow } from "@/lib/types";

export function LeaderboardTable({
  rows,
  metricLabel,
}: {
  rows: LeaderboardRow[];
  metricLabel: string;
}) {
  return (
    <div className="overflow-x-auto rounded-[1.5rem] border border-card-border">
      <table className="min-w-[980px] divide-y divide-card-border text-sm">
        <thead className="bg-white/80 text-left text-muted">
          <tr>
            <th className="px-4 py-3 font-medium">Rank</th>
            <th className="px-4 py-3 font-medium">Player</th>
            <th className="px-4 py-3 font-medium">{metricLabel}</th>
            <th className="px-4 py-3 font-medium">Runs</th>
            <th className="px-4 py-3 font-medium">Wickets</th>
            <th className="px-4 py-3 font-medium">Avg</th>
            <th className="px-4 py-3 font-medium">SR</th>
            <th className="px-4 py-3 font-medium">Econ</th>
            <th className="px-4 py-3 font-medium">Matches</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-card-border bg-white/55">
          {rows.map((row) => (
            <tr key={row.slug}>
              <td className="px-4 py-3 font-semibold text-accent-ink">{row.rank}</td>
              <td className="px-4 py-3 font-medium text-foreground">
                <Link href={`/players/${row.slug}`} className="hover:text-accent-ink">
                  {row.player}
                </Link>
              </td>
              <td className="px-4 py-3 text-foreground">
                {row.metricLabel === "Economy" || row.metricLabel === "Death Econ"
                  ? row.metricValue.toFixed(2)
                  : row.metricValue.toFixed(1).replace(/\.0$/, "")}
              </td>
              <td className="px-4 py-3 text-foreground">{row.runs}</td>
              <td className="px-4 py-3 text-foreground">{row.wickets}</td>
              <td className="px-4 py-3 text-foreground">{row.average === null ? "-" : row.average.toFixed(1)}</td>
              <td className="px-4 py-3 text-foreground">{row.strikeRate.toFixed(1)}</td>
              <td className="px-4 py-3 text-foreground">{row.economy === null ? "-" : row.economy.toFixed(2)}</td>
              <td className="px-4 py-3 text-foreground">{row.matches}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
