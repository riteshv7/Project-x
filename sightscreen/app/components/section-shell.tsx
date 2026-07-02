"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { CaretLeft } from "@phosphor-icons/react";

export function PageFrame({ children }: { children: ReactNode }) {
  return (
    <motion.main
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
      className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8 gap-6"
    >
      {children}
    </motion.main>
  );
}

export function BackLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <div className="mb-2">
      <Link
        href={href}
        className="group inline-flex items-center gap-2 rounded-full border border-card-border bg-white/70 px-4 py-2 text-sm font-medium text-muted transition hover:border-accent/30 hover:text-accent-ink active:scale-[0.98]"
      >
        <CaretLeft size={16} className="transition-transform group-hover:-translate-x-0.5" />
        {children}
      </Link>
    </div>
  );
}

export function HeroCard({
  eyebrow,
  title,
  description,
  aside,
}: {
  eyebrow: string;
  title: string;
  description: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <section className="glass-card rounded-[2.5rem] p-8 sm:p-10">
      <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl space-y-4">
          <span className="inline-block rounded-full bg-accent/8 border border-accent/15 px-3.5 py-1 text-xs font-semibold tracking-wider text-accent-ink">
            {eyebrow}
          </span>
          <h1 className="text-4xl font-bold tracking-tight text-accent-ink sm:text-5xl md:text-6xl leading-tight">
            {title}
          </h1>
          <div className="text-base sm:text-lg leading-relaxed text-muted max-w-[65ch]">
            {description}
          </div>
        </div>
        {aside ? (
          <div className="grid gap-3 sm:grid-cols-3 lg:flex lg:flex-col lg:min-w-[180px]">
            {aside}
          </div>
        ) : null}
      </div>
    </section>
  );
}

export function StatPill({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="stat-pill flex flex-col justify-center rounded-[1.75rem] px-5 py-4">
      <span className="text-[10px] font-bold uppercase tracking-wider text-muted">
        {label}
      </span>
      <span className="mt-1 font-mono text-2xl font-bold tracking-tight text-accent-ink">
        {value}
      </span>
    </div>
  );
}

export function GridSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="mt-4">
      <div className="mb-4">
        <p className="section-title">{title}</p>
      </div>
      {children}
    </section>
  );
}
