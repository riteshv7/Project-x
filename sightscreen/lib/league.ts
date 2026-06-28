import type { LeagueCode, LeagueMetadata } from "@/lib/types";

export const LEAGUE_ORDER: LeagueCode[] = ["IPL", "BBL", "PSL", "SA20", "HUNDRED"];

export const LEAGUE_METADATA: Record<LeagueCode, LeagueMetadata> = {
  IPL: {
    code: "IPL",
    slug: "ipl",
    name: "Indian Premier League",
    badge: "IPL",
    description: "Indian Premier League — India's flagship T20 competition.",
    shortLabel: "IPL",
  },
  BBL: {
    code: "BBL",
    slug: "bbl",
    name: "Big Bash League",
    badge: "BBL",
    description: "Big Bash League — Australia's T20 competition.",
    shortLabel: "BBL",
  },
  PSL: {
    code: "PSL",
    slug: "psl",
    name: "Pakistan Super League",
    badge: "PSL",
    description: "Pakistan Super League — Pakistan's franchise T20 competition.",
    shortLabel: "PSL",
  },
  SA20: {
    code: "SA20",
    slug: "sa20",
    name: "SA20",
    badge: "SA20",
    description: "SA20 — South Africa's franchise T20 competition.",
    shortLabel: "SA20",
  },
  HUNDRED: {
    code: "HUNDRED",
    slug: "the-hundred",
    name: "The Hundred",
    badge: "100",
    description: "The Hundred — England and Wales' 100-ball competition.",
    shortLabel: "The Hundred",
  },
};

export function getLeagueBySlug(slug: string): LeagueCode | null {
  const entry = LEAGUE_ORDER.find((league) => LEAGUE_METADATA[league].slug === slug);
  return entry ?? null;
}

export function getLeagueSlug(league: LeagueCode): string {
  return LEAGUE_METADATA[league].slug;
}
