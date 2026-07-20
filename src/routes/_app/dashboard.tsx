import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useEffect } from "react";
import { useStore, stageLabels, stageOrder, type Stage } from "@/lib/placement-store";
import {
  Flame,
  Percent,
  Code2,
  Repeat,
  Briefcase,
  Inbox,
  ArrowRight,
} from "lucide-react";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — PlacementOS" }] }),
  component: DashboardPage,
});

const stageColor: Record<Stage, string> = {
  applied: "text-muted-foreground",
  oa: "text-yellow-400",
  interview: "text-primary",
  offer: "text-emerald-400",
  rejected: "text-destructive",
};

// ── Greeting helper ──
function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function DashboardPage() {
  const { data: allTasks } = useStore((s) => s.tasks);
  const { data: allCompanies } = useStore((s) => s.applications);
  const { data: streakVal, update } = useStore((s) => s.streak);
  const { data: lastActive } = useStore((s) => s.lastActive);
  const { data: profile } = useStore((s) => s.profile);
  const { data: allLc } = useStore((s) => s.leetcode);
  const { data: allSubjects } = useStore((s) => s.subjects);
  
  // Ping streak on mount
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    const yest = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    if (lastActive === today) return;
    update((s) => ({
      ...s,
      lastActive: today,
      streak: s.lastActive === yest ? s.streak + 1 : 1,
    }));
  }, [lastActive, update]);

  const consistency = Math.min(
    100,
    Math.round(
      (allTasks.filter((t) => t.done).length / Math.max(1, allTasks.length)) * 100
    )
  );

  const dueRevisions = allLc.filter(
    (p) => Date.now() - new Date(p.solvedAt).getTime() > 7 * 86400000
  ).length;

  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const stageCounts = useMemo(() => {
    return stageOrder.reduce<Record<Stage, number>>(
      (acc, s) => {
        acc[s] = allCompanies.filter((c) => c.stage === s).length;
        return acc;
      },
      { applied: 0, oa: 0, interview: 0, offer: 0, rejected: 0 }
    );
  }, [allCompanies]);

  const subjectList = allSubjects.map((subj) => {
    const total = subj.topics.length;
    const done = subj.topics.filter((t) => t.done).length;
    return {
      key: subj.id,
      name: subj.name,
      progress: {
        done,
        total,
        pct: total > 0 ? Math.round((done / total) * 100) : 0,
      },
    };
  });

  return (
    <div className="space-y-8">
      {/* ── Greeting Header ── */}
      <div>
        <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">
          {greeting()},{" "}
          <span style={{ color: "var(--brand)" }}>
            {profile.name || "Dev"}
          </span>
        </h2>
        <p className="mono mt-1 text-xs" style={{ color: "var(--muted-foreground)" }}>
          {today}
        </p>
      </div>

      {/* ── 5 Metric Cards ── */}
      <div
        className="dash-stat-grid grid gap-3"
        style={{ gridTemplateColumns: "repeat(5, minmax(0, 1fr))" }}
      >
        {/* Day Streak — Cyber Orange accent border */}
        <div
          className="rounded-xl px-5 py-4 min-w-0"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--brand)",
          }}
        >
          <div
            className="mono text-[10px] uppercase tracking-widest flex items-center gap-1.5"
            style={{ color: "var(--muted-foreground)" }}
          >
            <Flame className="h-3 w-3" style={{ color: "var(--brand)" }} />
            Day Streak
          </div>
          <div className="mt-2 text-3xl font-semibold tabular-nums" style={{ color: "var(--brand)" }}>
            {streakVal || 0}
          </div>
          <div className="mt-1 text-xs" style={{ color: "var(--muted-foreground)" }}>
            days in a row
          </div>
        </div>

        {/* Consistency */}
        <div
          className="rounded-xl px-5 py-4 min-w-0"
          style={{ background: "var(--surface)", border: "1px solid var(--hairline)" }}
        >
          <div
            className="mono text-[10px] uppercase tracking-widest flex items-center gap-1.5"
            style={{ color: "var(--muted-foreground)" }}
          >
            <Percent className="h-3 w-3" />
            Consistency
          </div>
          <div className="mt-2 text-3xl font-semibold tabular-nums">
            {consistency}%
          </div>
          <div className="mt-1 text-xs" style={{ color: "var(--muted-foreground)" }}>
            tasks completed
          </div>
        </div>

        {/* LC Solved */}
        <div
          className="rounded-xl px-5 py-4 min-w-0"
          style={{ background: "var(--surface)", border: "1px solid var(--hairline)" }}
        >
          <div
            className="mono text-[10px] uppercase tracking-widest flex items-center gap-1.5"
            style={{ color: "var(--muted-foreground)" }}
          >
            <Code2 className="h-3 w-3" />
            LC Solved
          </div>
          <div className="mt-2 text-3xl font-semibold tabular-nums">
            {allLc.length}
          </div>
          <div className="mt-1 text-xs" style={{ color: "var(--muted-foreground)" }}>
            problems logged
          </div>
        </div>

        {/* Due Revisions */}
        <div
          className="rounded-xl px-5 py-4 min-w-0"
          style={{ background: "var(--surface)", border: "1px solid var(--hairline)" }}
        >
          <div
            className="mono text-[10px] uppercase tracking-widest flex items-center gap-1.5"
            style={{ color: "var(--muted-foreground)" }}
          >
            <Repeat className="h-3 w-3" />
            Due Revisions
          </div>
          <div className="mt-2 text-3xl font-semibold tabular-nums">
            {dueRevisions}
          </div>
          <div className="mt-1 text-xs" style={{ color: "var(--muted-foreground)" }}>
            items pending
          </div>
        </div>

        {/* Applications */}
        <div
          className="rounded-xl px-5 py-4 min-w-0"
          style={{ background: "var(--surface)", border: "1px solid var(--hairline)" }}
        >
          <div
            className="mono text-[10px] uppercase tracking-widest flex items-center gap-1.5"
            style={{ color: "var(--muted-foreground)" }}
          >
            <Briefcase className="h-3 w-3" />
            Applications
          </div>
          <div className="mt-2 text-3xl font-semibold tabular-nums">
            {allCompanies.length}
          </div>
          <div className="mt-1 text-xs" style={{ color: "var(--muted-foreground)" }}>
            companies tracked
          </div>
        </div>
      </div>

      {/* ── Main 2-column grid ── */}
      <div
        className="dash-main-grid grid gap-6"
        style={{ gridTemplateColumns: "1fr 360px" }}
      >
        {/* ── LEFT: Today's Tasks ── */}
        <section
          className="rounded-xl"
          style={{ border: "1px solid var(--hairline)", background: "var(--surface)" }}
        >
          <header
            className="flex items-center justify-between px-5 py-4"
            style={{ borderBottom: "1px solid var(--hairline)" }}
          >
            <div>
              <h3 className="text-sm font-semibold tracking-tight">Today's Tasks</h3>
              <p className="mono mt-0.5 text-xs" style={{ color: "var(--muted-foreground)" }}>
                What needs to happen today.
              </p>
            </div>
            <Link
              to="/tasks"
              className="mono inline-flex items-center gap-1 text-xs"
              style={{ color: "var(--brand)" }}
            >
              + manage
            </Link>
          </header>

          <div className="p-5">
            {allTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 text-center">
                <div
                  className="grid h-12 w-12 place-items-center rounded-full"
                  style={{ border: "1px solid var(--hairline)", background: "var(--surface-2)" }}
                >
                  <Inbox className="h-5 w-5" style={{ color: "var(--muted-foreground)" }} />
                </div>
                <p className="mt-4 text-sm font-medium">Inbox zero.</p>
                <p className="mono mt-1 text-xs" style={{ color: "var(--muted-foreground)" }}>
                  No pending tasks. Add one to keep the streak alive.
                </p>
                <Link
                  to="/tasks"
                  className="mono mt-6 inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-xs font-semibold transition-colors"
                  style={{
                    border: "1px solid var(--hairline)",
                    color: "var(--muted-foreground)",
                  }}
                >
                  Add a task <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            ) : (
              <ul className="space-y-2">
                {allTasks.slice(0, 8).map((t) => (
                  <li
                    key={t.id}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5"
                    style={{ border: "1px solid var(--hairline)", background: "var(--surface-2)" }}
                  >
                    <span
                      className="grid h-4 w-4 shrink-0 place-items-center rounded"
                      style={{
                        background: t.done ? "var(--brand)" : "transparent",
                        border: `1px solid ${t.done ? "var(--brand)" : "var(--hairline)"}`,
                      }}
                    >
                      {t.done && (
                        <span className="text-[8px] font-bold" style={{ color: "var(--brand-foreground)" }}>
                          ✓
                        </span>
                      )}
                    </span>
                    <span
                      className="flex-1 truncate text-sm"
                      style={{
                        textDecoration: t.done ? "line-through" : "none",
                        color: t.done ? "var(--muted-foreground)" : "var(--foreground)",
                      }}
                    >
                      {t.title}
                    </span>
                    <span
                      className="mono text-[10px] uppercase tracking-widest"
                      style={{ color: "var(--muted-foreground)" }}
                    >
                      {t.priority}
                    </span>
                  </li>
                ))}
                {allTasks.length > 8 && (
                  <li className="pt-1 text-center">
                    <Link
                      to="/tasks"
                      className="mono text-xs"
                      style={{ color: "var(--brand)" }}
                    >
                      +{allTasks.length - 8} more →
                    </Link>
                  </li>
                )}
              </ul>
            )}
          </div>
        </section>

        {/* ── RIGHT: Company Stats + Subjects ── */}
        <div className="flex flex-col gap-6 min-w-0">
          {/* Company Stats */}
          <section
            className="rounded-xl"
            style={{ border: "1px solid var(--hairline)", background: "var(--surface)" }}
          >
            <header
              className="px-5 py-4"
              style={{ borderBottom: "1px solid var(--hairline)" }}
            >
              <h3 className="text-sm font-semibold tracking-tight">Company Stats</h3>
              <p className="mono mt-0.5 text-xs" style={{ color: "var(--muted-foreground)" }}>
                Interview milestones across your applications.
              </p>
            </header>
            <div className="p-4">
              <div className="stage-grid grid grid-cols-2 gap-2">
                {stageOrder.map((s) => {
                  const count = allCompanies.filter((c) => c.stage === s).length;
                  return (
                    <div key={s} className="rounded-lg px-3 py-2.5" style={{ border: "1px solid var(--hairline)", background: "var(--surface-2)" }}>
                      <div className={`mono text-[10px] uppercase tracking-widest ${stageColor[s]}`}>
                        {stageLabels[s]}
                      </div>
                      <div className="mono mt-1 text-2xl font-bold">
                        {count}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* CS Core Subjects */}
          <section
            className="rounded-xl"
            style={{ border: "1px solid var(--hairline)", background: "var(--surface)" }}
          >
            <header
              className="px-5 py-4"
              style={{ borderBottom: "1px solid var(--hairline)" }}
            >
              <h3 className="text-sm font-semibold tracking-tight">Subjects</h3>
              <p className="mono mt-0.5 text-xs" style={{ color: "var(--muted-foreground)" }}>
                Core CS preparation progress.
              </p>
            </header>
            <div className="p-4 space-y-4">
              {subjectList.map(({ key, name, progress }) => (
                <div key={key}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium">{name}</span>
                    <span
                      className="mono text-[11px]"
                      style={{ color: "var(--muted-foreground)" }}
                    >
                      {progress.done}/{progress.total}
                    </span>
                  </div>
                  <div
                    className="h-1.5 w-full overflow-hidden rounded-full"
                    style={{ background: "var(--surface-2)" }}
                  >
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${progress.pct}%`,
                        background: "var(--brand)",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
