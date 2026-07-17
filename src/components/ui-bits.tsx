import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Panel({
  title, subtitle, action, children, className,
}: {
  title?: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn("rounded-xl", className)}
      style={{ border: "1px solid var(--hairline)", background: "var(--surface)" }}
    >
      {(title || action) && (
        <header
          className="flex items-start justify-between gap-4 px-5 py-4"
          style={{ borderBottom: "1px solid var(--hairline)" }}
        >
          <div className="min-w-0">
            {title && <h3 className="text-sm font-semibold tracking-tight">{title}</h3>}
            {subtitle && <p className="mt-0.5 text-xs" style={{ color: "var(--muted-foreground)" }}>{subtitle}</p>}
          </div>
          {action}
        </header>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

export function StatCard({
  label, value, hint, accent,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  accent?: boolean;
}) {
  return (
    <div
      className="rounded-xl px-5 py-4 min-w-0"
      style={{
        background: "var(--surface)",
        border: accent
          ? "1px solid var(--brand)"          /* Cyber Orange full border for active/streak */
          : "1px solid var(--hairline)",
      }}
    >
      <div
        className="mono text-[10px] uppercase tracking-widest"
        style={{ color: "var(--muted-foreground)" }}
      >
        {label}
      </div>
      <div
        className={cn("mt-2 text-3xl font-semibold tabular-nums")}
        style={{ color: accent ? "var(--brand)" : "var(--foreground)" }}
      >
        {value}
      </div>
      {hint && (
        <div className="mt-1 text-xs" style={{ color: "var(--muted-foreground)" }}>
          {hint}
        </div>
      )}
    </div>
  );
}

export function PageHeader({
  title, subtitle, action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">{title}</h1>
        {subtitle && (
          <p className="mt-1 text-sm" style={{ color: "var(--muted-foreground)" }}>
            {subtitle}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}
