import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { lc, type LcEntry } from "@/lib/store";
import { PageHeader, Panel, StatCard } from "@/components/ui-bits";
import { Plus, Trash2 } from "lucide-react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export const Route = createFileRoute("/_app/leetcode")({
  head: () => ({ meta: [{ title: "LeetCode — PlacementOS" }] }),
  component: LcPage,
});

function LcPage() {
  const all = lc.useAll();
  const [title, setTitle] = useState("");
  const [diff, setDiff] = useState<LcEntry["difficulty"]>("easy");

  const stats = useMemo(() => {
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

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Total Solved" value={all.length} accent />
        <StatCard label="Easy" value={stats.easy} />
        <StatCard label="Medium" value={stats.medium} />
        <StatCard label="Hard" value={stats.hard} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-6">
        <Panel title="Difficulty Breakdown" subtitle="Where your effort landed.">
          <div className="space-y-4">
            {(["easy", "medium", "hard"] as const).map((d) => {
              const c = stats[d];
              const total = all.length || 1;
              const pct = Math.round((c / total) * 100);
              return (
                <div key={d}>
                  <div className="flex items-baseline justify-between text-sm mono">
                    <span className="uppercase text-xs tracking-widest">{d}</span>
                    <span className="text-muted-foreground text-xs">{c} · {pct}%</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-surface-2 overflow-hidden">
                    <div className={"h-full " + diffBg(d)} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>

        <Panel title="Weekly Trend" subtitle="Problems solved in the last 7 days.">
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

      <Panel title="Log a Solve">
        <form onSubmit={add} className="flex flex-col sm:flex-row gap-3">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Problem title (e.g. Two Sum)"
            className="flex-1 h-10 rounded-md bg-background hairline px-3 text-sm focus:outline-none focus:ring-1 focus:ring-brand" />
          <select value={diff} onChange={(e) => setDiff(e.target.value as LcEntry["difficulty"])}
            className="h-10 rounded-md bg-background hairline px-3 text-sm">
            <option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option>
          </select>
          <button className="h-10 rounded-md bg-brand text-brand-foreground px-4 text-sm font-semibold inline-flex items-center gap-2">
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
                <button onClick={() => lc.remove(e.id)} className="text-muted-foreground hover:text-coral">
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
