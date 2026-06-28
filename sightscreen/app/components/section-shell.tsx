import Link from "next/link";
import type { ReactNode } from "react";

export function PageFrame({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-8 sm:px-6 lg:px-8">
      {children}
    </main>
  );
}

export function BackLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <div className="mb-6">
      <Link
        href={href}
        className="inline-flex items-center gap-2 rounded-full border border-card-border bg-white/70 px-4 py-2 text-sm font-medium text-muted transition hover:border-accent/30 hover:text-accent-ink"
      >
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
    <section className="glass-card rounded-[2rem] px-6 py-8 sm:px-10">
      <p className="section-title">{eyebrow}</p>
      <div className="mt-4 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <h1 className="text-4xl font-semibold tracking-[-0.04em] text-accent-ink sm:text-5xl">
            {title}
          </h1>
          <div className="mt-4 text-lg leading-8 text-muted">{description}</div>
        </div>
        {aside ? <div className="grid gap-3 text-sm text-muted sm:grid-cols-2">{aside}</div> : null}
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
    <div className="stat-pill rounded-2xl px-4 py-3">
      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-ink">
        {label}
      </div>
      <div className="mt-1 text-sm font-medium text-foreground">{value}</div>
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
    <section className="mt-8">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <p className="section-title">{title}</p>
        </div>
      </div>
      {children}
    </section>
  );
}
