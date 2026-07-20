import { useMemo } from "react";
import { useStore } from "@/lib/placement-store";
import { Panel } from "@/components/ui-bits";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

function diffBg(d: string) {
  return d === "Easy" ? "bg-emerald-400" : d === "Medium" ? "bg-brand" : "bg-coral";
}

export default function LeetCodeAnalytics() {
  const { data: all } = useStore((s) => s.leetcode);
  const { data: apiStats } = useStore((s) => s.lcApiStats);

  const localStats = useMemo(() => {
    const b = { Easy: 0, Medium: 0, Hard: 0 };
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
        count: all.filter((e) => new Date(e.solvedAt).toISOString().slice(0, 10) === key).length,
      });
    }
    return days;
  }, [all]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-6">
      <Panel title="Difficulty Breakdown" subtitle={apiStats ? "From your LeetCode profile." : "From your manual solve log."}>
        <div className="space-y-4">
          {(["Easy", "Medium", "Hard"] as const).map((d) => {
            const c = apiStats
              ? (d === "Easy" ? apiStats.easySolved : d === "Medium" ? apiStats.mediumSolved : apiStats.hardSolved)
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
  );
}
