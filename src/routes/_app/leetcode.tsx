import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState, Suspense, lazy } from "react";
import { useStore, fetchLcStats, type LeetProblem } from "@/lib/placement-store";
import { PageHeader, Panel, StatCard } from "@/components/ui-bits";
import { Plus, Trash2, ExternalLink, RefreshCw, Loader2 } from "lucide-react";

const LeetCodeAnalytics = lazy(() => import("@/components/analytics/LeetCodeAnalytics"));

export const Route = createFileRoute("/_app/leetcode")({
  head: () => ({ meta: [{ title: "LeetCode — PlacementOS" }] }),
  component: LcPage,
});

function LcPage() {
  const { data: all, update, hydrated } = useStore((s) => s.leetcode);
  const { data: profile } = useStore((s) => s.profile);
  const { data: apiStats } = useStore((s) => s.lcApiStats);
  const [title, setTitle] = useState("");
  const [diff, setDiff] = useState<LeetProblem["difficulty"]>("Easy");
  const [apiLoading, setApiLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const lcUsername = hydrated ? (profile.lcUsername ?? "") : "";

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



  const add = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    update((s) => ({
      ...s,
      leetcode: [
        {
          id: crypto.randomUUID(),
          title: title.trim(),
          difficulty: diff,
          solvedAt: Date.now(),
        },
        ...s.leetcode,
      ],
    }));
    setTitle("");
  };

  const remove = (id: string) => {
    update((s) => ({ ...s, leetcode: s.leetcode.filter((e) => e.id !== id) }));
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
        <StatCard label="Easy" value={apiStats ? displayStats.easy : localStats.Easy} />
        <StatCard label="Medium" value={apiStats ? displayStats.medium : localStats.Medium} />
        <StatCard label="Hard" value={apiStats ? displayStats.hard : localStats.Hard} />
      </div>

      {apiStats && (
        <p className="mono text-[10px] text-muted-foreground -mt-2">
          ↑ Live stats from LeetCode. Manual log below tracks your session solves.
        </p>
      )}

      <Suspense fallback={<AnalyticsSkeleton />}>
        <LeetCodeAnalytics />
      </Suspense>

      <Panel title="Log a Solve" subtitle="Manually track what you solved today.">
        <form onSubmit={add} className="flex flex-col sm:flex-row gap-3">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Problem title (e.g. Two Sum)"
            className="flex-1 h-10 rounded-md bg-background hairline px-3 text-sm focus:outline-none focus:ring-1 focus:ring-brand" />
          <select value={diff} onChange={(e) => setDiff(e.target.value as LeetProblem["difficulty"])}
            className="cursor-pointer h-10 rounded-md bg-background hairline px-3 text-sm">
            <option value="Easy">Easy</option><option value="Medium">Medium</option><option value="Hard">Hard</option>
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
                <span className="mono text-[11px] text-muted-foreground">{new Date(e.solvedAt).toLocaleDateString()}</span>
                <button onClick={() => remove(e.id)} className="cursor-pointer text-muted-foreground hover:text-coral">
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

function AnalyticsSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-6 animate-pulse">
      <Panel title="Difficulty Breakdown" subtitle="Loading analytics...">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i}>
              <div className="flex justify-between mb-1">
                <div className="h-3 w-12 bg-surface-2 rounded"></div>
                <div className="h-3 w-16 bg-surface-2 rounded"></div>
              </div>
              <div className="mt-2 h-2 rounded-full bg-surface-2"></div>
            </div>
          ))}
        </div>
      </Panel>
      <Panel title="Weekly Trend" subtitle="Loading analytics...">
        <div className="h-56 bg-surface-2/50 rounded-md"></div>
      </Panel>
    </div>
  );
}
function diffPill(d: string) {
  return d === "easy" ? "bg-emerald-400/10 text-emerald-400" : d === "medium" ? "bg-brand/10 text-brand" : "bg-coral/10 text-coral";
}
