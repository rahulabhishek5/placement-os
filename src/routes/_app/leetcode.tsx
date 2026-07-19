import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { lc, type LcEntry } from "@/lib/store";
import { useStore, fetchLcStats } from "@/lib/placement-store";
import { PageHeader, Panel, StatCard } from "@/components/ui-bits";
import { Plus, Trash2, ExternalLink, RefreshCw, Loader2 } from "lucide-react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export const Route = createFileRoute("/_app/leetcode")({
  head: () => ({ meta: [{ title: "LeetCode — PlacementOS" }] }),
  component: LcPage,
});

function LcPage() {
  const all = lc.useAll();
  const { store, hydrated } = useStore();
  const [title, setTitle] = useState("");
  const [diff, setDiff] = useState<LcEntry["difficulty"]>("easy");
  const [apiLoading, setApiLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const lcUsername = hydrated ? (store.profile.lcUsername ?? "") : "";
  const apiStats = hydrated ? store.lcApiStats : null;

  // Auto-fetch LC stats when username is available and stats not yet loaded
  useEffect(() => {
    if (!hydrated || !lcUsername || apiStats) return;

    let cancelled = false;
    setApiLoading(true);
    setApiError(null);

    fetchLcStats(lcUsername).then((result) => {
      if (cancelled) return;
      if (!result.ok) setApiError(result.error);
      setApiLoading(false);
    });

    return () => { cancelled = true; };
  }, [hydrated, lcUsername]); // Only re-run when username changes

  const refreshStats = async () => {
    if (!lcUsername) return;
    setApiLoading(true);
    setApiError(null);
    const result = await fetchLcStats(lcUsername);
    if (!result.ok) setApiError(result.error);
    setApiLoading(false);
  };

  // Use API stats for top cards if available, fall back to locally-logged stats
  const displayStats = apiStats
    ? { total: apiStats.solvedProblem, easy: apiStats.easySolved, medium: apiStats.mediumSolved, hard: apiStats.hardSolved }
    : { total: all.length, easy: 0, medium: 0, hard: 0 };

  // Local log stats (breakdown of manually logged problems)
  const localStats = useMemo(() => {
    const b = { easy: 0, medium: 0, hard: 0 };
    all.forEach((e) => b[e.difficulty]++);
    return b;
  }, [all]);

  const weekData = useMemo(() => {
    const days: { label: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const key = d.toISOString().slice(0, 10);
      days.push({
        label: d.toLocaleDateString(undefined, { weekday: "short" }),
        count: all.filter((e) => e.date === key).length,
      });
    }
    return days;
  }, [all]);

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    lc.add(title.trim(), diff);
    setTitle("");
  };

  return (
    <div className="space-y-6">
      <PageHeader title="LeetCode Tracker" subtitle="Log every solve. Watch momentum compound." />

      {/* Username connection banner */}
      {hydrated && (
        lcUsername ? (
          <div className="flex flex-wrap items-center gap-3 rounded-lg border border-hairline bg-surface px-4 py-3">
            <span className="mono text-[10px] uppercase tracking-widest text-muted-foreground">Connected as</span>
            <a
              href={`https://leetcode.com/${lcUsername}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md bg-brand/10 px-3 py-1 text-sm font-semibold text-brand hover:bg-brand/20 transition"
            >
              {lcUsername}
              <ExternalLink className="h-3 w-3" />
            </a>
            {apiLoading && (
              <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" /> Fetching stats…
              </span>
            )}
            {apiError && (
              <span className="text-xs text-destructive">{apiError}</span>
            )}
            <button
              onClick={refreshStats}
              disabled={apiLoading}
              className="cursor-pointer ml-auto inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition disabled:opacity-50"
              title="Refresh stats from LeetCode"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${apiLoading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between rounded-lg border border-dashed border-hairline bg-surface/50 px-4 py-3">
            <span className="text-sm text-muted-foreground">No LeetCode username linked yet.</span>
            <Link to="/settings" className="cursor-pointer mono text-xs font-semibold text-brand hover:underline">
              Link username in Settings →
            </Link>
          </div>
        )
      )}

      {/* Stats cards — show API data if available */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label={apiStats ? "Total Solved (LC)" : "Manually Logged"} value={displayStats.total} accent />
        <StatCard label="Easy" value={apiStats ? displayStats.easy : localStats.easy} />
        <StatCard label="Medium" value={apiStats ? displayStats.medium : localStats.medium} />
        <StatCard label="Hard" value={apiStats ? displayStats.hard : localStats.hard} />
      </div>

      {apiStats && (
        <p className="mono text-[10px] text-muted-foreground -mt-2">
          ↑ Live stats from LeetCode. Manual log below tracks your session solves.
        </p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-6">
        <Panel title="Difficulty Breakdown" subtitle={apiStats ? "From your LeetCode profile." : "From your manual solve log."}>
          <div className="space-y-4">
            {(["easy", "medium", "hard"] as const).map((d) => {
              const c = apiStats
                ? (d === "easy" ? apiStats.easySolved : d === "medium" ? apiStats.mediumSolved : apiStats.hardSolved)
                : localStats[d];
              const total = apiStats ? apiStats.solvedProblem : all.length;
              const pct = total > 0 ? Math.round((c / total) * 100) : 0;
              return (
                <div key={d}>
                  <div className="flex items-baseline justify-between text-sm mono">
                    <span className="uppercase text-xs tracking-widest">{d}</span>
                    <span className="text-muted-foreground text-xs">{c} · {pct}%</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-surface-2 overflow-hidden">
                    <div className={"h-full " + diffBg(d)} style={{ width: `${pct}%`, transition: "width 0.5s ease" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>

        <Panel title="Weekly Trend" subtitle="Problems logged in the last 7 days.">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weekData}>
                <XAxis dataKey="label" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: "var(--surface)", border: "1px solid var(--hairline)", borderRadius: 8, fontSize: 12 }}
                  cursor={{ fill: "var(--surface-2)" }}
                />
                <Bar dataKey="count" fill="var(--brand)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <Panel title="Log a Solve" subtitle="Manually track what you solved today.">
        <form onSubmit={add} className="flex flex-col sm:flex-row gap-3">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Problem title (e.g. Two Sum)"
            className="flex-1 h-10 rounded-md bg-background hairline px-3 text-sm focus:outline-none focus:ring-1 focus:ring-brand" />
          <select value={diff} onChange={(e) => setDiff(e.target.value as LcEntry["difficulty"])}
            className="cursor-pointer h-10 rounded-md bg-background hairline px-3 text-sm">
            <option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option>
          </select>
          <button type="submit" className="cursor-pointer h-10 rounded-md bg-brand text-brand-foreground px-4 text-sm font-semibold inline-flex items-center gap-2">
            <Plus className="h-4 w-4" /> Log
          </button>
        </form>

        {all.length > 0 && (
          <ul className="mt-6 divide-y divide-hairline">
            {all.slice(0, 12).map((e) => (
              <li key={e.id} className="flex items-center gap-3 py-2.5">
                <span className={"mono text-[10px] uppercase px-2 py-0.5 rounded " + diffPill(e.difficulty)}>{e.difficulty}</span>
                <span className="text-sm flex-1 truncate">{e.title}</span>
                <span className="mono text-[11px] text-muted-foreground">{e.date}</span>
                <button onClick={() => lc.remove(e.id)} className="cursor-pointer text-muted-foreground hover:text-coral">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}

function diffBg(d: string) {
  return d === "easy" ? "bg-emerald-400" : d === "medium" ? "bg-brand" : "bg-coral";
}
function diffPill(d: string) {
  return d === "easy" ? "bg-emerald-400/10 text-emerald-400" : d === "medium" ? "bg-brand/10 text-brand" : "bg-coral/10 text-coral";
}
