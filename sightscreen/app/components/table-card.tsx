import type { ReactNode } from "react";

export function TableCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div className="glass-card rounded-[1.75rem] p-5 sm:p-6">
      <p className="section-title">{title}</p>
      {subtitle ? (
        <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-accent-ink">
          {subtitle}
        </h2>
      ) : null}
      <div className="mt-5 overflow-hidden rounded-2xl border border-card-border">{children}</div>
    </div>
  );
}
