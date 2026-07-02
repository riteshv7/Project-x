"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { List, X } from "@phosphor-icons/react";

export function SiteHeader() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
    <header className="sticky top-0 z-50 mx-auto w-full max-w-7xl px-4 pt-4 sm:px-6 lg:px-8">
      <nav className="glass-card flex items-center justify-between rounded-[2rem] px-6 py-3.5 shadow-lg transition-all duration-300">
        <Link href="/" className="group flex items-center gap-2 text-xl font-bold tracking-tight text-accent-ink">
          <span className="h-2.5 w-2.5 rounded-full bg-accent animate-pulse" />
          Sightscreen
        </Link>

        {/* Desktop navigation */}
        <div className="hidden lg:flex items-center gap-1 text-sm font-medium text-muted">
          {links.map((link) => {
            const isActive = pathname === link.href || (link.href !== "/" && pathname?.startsWith(link.href));
            const isLinkActive = mounted && isActive;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="relative rounded-full px-4 py-2 transition duration-200 hover:text-accent-ink"
              >
                {isLinkActive && (
                  <motion.span
                    layoutId="active-nav-indicator"
                    className="absolute inset-0 rounded-full bg-accent/10 border border-accent/15"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <span className={`relative z-10 ${isLinkActive ? "text-accent-ink font-semibold" : "text-muted"}`}>
                  {link.label}
                </span>
              </Link>
            );
          })}
        </div>

        {/* Mobile menu toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="rounded-full p-2 text-muted hover:bg-black/5 hover:text-accent-ink lg:hidden transition active:scale-95"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X size={20} weight="bold" /> : <List size={20} weight="bold" />}
        </button>
      </nav>

      {/* Mobile navigation menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="glass-card mt-2 flex flex-col gap-1 rounded-[2rem] p-3 lg:hidden shadow-xl"
          >
            {links.map((link) => {
              const isActive = pathname === link.href || (link.href !== "/" && pathname?.startsWith(link.href));
              const isLinkActive = mounted && isActive;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`rounded-2xl px-4 py-2.5 text-sm font-medium transition ${
                    isLinkActive
                      ? "bg-accent/10 text-accent-ink font-semibold"
                      : "text-muted hover:bg-black/5 hover:text-accent-ink"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
