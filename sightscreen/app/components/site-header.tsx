import Link from "next/link";

export function SiteHeader() {
  const links = [
    { href: "/", label: "Home" },
    { href: "/explore", label: "Explore" },
    { href: "/playlists", label: "Playlists" },
    { href: "/leaderboards", label: "Leaderboards" },
    { href: "/leagues", label: "Leagues" },
    { href: "/teams", label: "Teams" },
    { href: "/players", label: "Players" },
    { href: "/seasons", label: "Seasons" },
    { href: "/venues", label: "Venues" },
  ];

  return (
    <header className="mx-auto w-full max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
      <nav className="glass-card flex flex-wrap items-center justify-between gap-4 rounded-[1.75rem] px-5 py-4">
        <Link href="/" className="text-lg font-semibold tracking-[-0.03em] text-accent-ink">
          Sightscreen
        </Link>
        <div className="flex flex-wrap gap-2 text-sm font-medium text-muted">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full border border-card-border bg-white/70 px-4 py-2 transition hover:border-accent/30 hover:text-accent-ink"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
