import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useStore, uid, type Task } from "@/lib/placement-store";
import { PageHeader, Panel } from "@/components/ui-bits";
import { Check, Plus, Trash2, Inbox } from "lucide-react";

export const Route = createFileRoute("/_app/tasks")({
  head: () => ({ meta: [{ title: "Daily Tasks — PlacementOS" }] }),
  component: TasksPage,
});

function TasksPage() {
  const { data: all, update, hydrated } = useStore((s) => s.tasks);
  
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<Task["priority"]>("med");
  const [filter, setFilter] = useState<"all" | "open" | "done">("open");

  const filtered = useMemo(() => {
    const list = filter === "all" ? all : filter === "open" ? all.filter((t) => !t.done) : all.filter((t) => t.done);
    return [...list].sort((a, b) => {
      const order = { high: 0, med: 1, low: 2 };
      return order[a.priority] - order[b.priority];
    });
  }, [all, filter]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    update((s) => ({
      ...s,
      tasks: [{ id: uid(), title: title.trim(), priority, done: false, createdAt: Date.now() }, ...s.tasks]
    }));
    setTitle("");
  };

  const toggle = (id: string) => {
    update((s) => ({
      ...s,
      tasks: s.tasks.map(t => t.id === id ? { ...t, done: !t.done } : t)
    }));
  };

  const remove = (id: string) => {
    update((s) => ({
      ...s,
      tasks: s.tasks.filter(t => t.id !== id)
    }));
  };

  if (!hydrated) return null;

  return (
    <div className="space-y-6">
      <PageHeader title="Daily Tasks" subtitle="Small units. Big compounding." />

      <Panel title="New Task">
        <form onSubmit={submit} className="flex flex-col sm:flex-row gap-3">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Solve 2 mediums on Trees"
            className="flex-1 h-10 rounded-md bg-background hairline px-3 text-sm focus:outline-none focus:ring-1 focus:ring-brand" />
          <select value={priority} onChange={(e) => setPriority(e.target.value as Task["priority"])}
            className="h-10 rounded-md bg-background hairline px-3 text-sm">
            <option value="high">High</option><option value="med">Medium</option><option value="low">Low</option>
          </select>
          <button className="h-10 rounded-md bg-brand text-brand-foreground px-4 text-sm font-semibold inline-flex items-center gap-2">
            <Plus className="h-4 w-4" /> Add
          </button>
        </form>
      </Panel>

      <Panel
        title="Tasks"
        action={
          <div className="flex gap-1 rounded-md hairline bg-background p-0.5">
            {(["open", "done", "all"] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className={"mono text-[10px] uppercase tracking-widest px-2.5 py-1 rounded " + (filter === f ? "bg-brand text-brand-foreground" : "text-muted-foreground hover:text-foreground")}>
                {f}
              </button>
            ))}
          </div>
        }
      >
        {filtered.length === 0 ? (
          <div className="py-16 grid place-items-center text-center">
            <div className="h-12 w-12 rounded-full bg-surface-2 hairline grid place-items-center">
              <Inbox className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="mt-4 text-sm font-medium">Nothing here.</div>
            <div className="mt-1 text-xs text-muted-foreground">Add your first task above.</div>
          </div>
        ) : (
          <ul className="divide-y divide-hairline -m-5">
            {filtered.map((t) => (
              <li key={t.id} className="group flex items-center gap-3 px-5 py-3">
                <button onClick={() => toggle(t.id)}
                  className={"h-5 w-5 rounded-sm hairline grid place-items-center transition " + (t.done ? "bg-brand border-brand" : "hover:border-brand")}>
                  {t.done && <Check className="h-3 w-3 text-brand-foreground" strokeWidth={3} />}
                </button>
                <span className={"text-sm flex-1 truncate " + (t.done ? "line-through text-muted-foreground" : "")}>{t.title}</span>
                <span className={"mono text-[10px] uppercase px-2 py-0.5 rounded " + priorityCls(t.priority)}>{t.priority}</span>
                <button onClick={() => remove(t.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-coral">
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

function priorityCls(p: string) {
  return p === "high" ? "bg-coral/10 text-coral" : p === "med" ? "bg-brand/10 text-brand" : "bg-surface-2 text-muted-foreground";
}
