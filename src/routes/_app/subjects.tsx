import { createFileRoute } from "@tanstack/react-router";
import { useStore } from "@/lib/placement-store";
import { PageHeader, Panel } from "@/components/ui-bits";
import { Check } from "lucide-react";

export const Route = createFileRoute("/_app/subjects")({
  head: () => ({ meta: [{ title: "Subjects — PlacementOS" }] }),
  component: SubjectsPage,
});

function SubjectsPage() {
  const { store: allSubjects, update } = useStore((s) => s.subjects);

  const toggle = (subjId: string, topicId: string) => {
    update((s) => ({
      ...s,
      subjects: s.subjects.map((subj) =>
        subj.id === subjId
          ? {
              ...subj,
              topics: subj.topics.map((t) =>
                t.id === topicId ? { ...t, done: !t.done } : t
              ),
            }
          : subj
      ),
    }));
  };
  return (
    <div className="space-y-6">
      <PageHeader title="CS Subjects" subtitle="Master the fundamentals. Check off as you go." />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {allSubjects.map((subj) => {
          const total = subj.topics.length;
          const done = subj.topics.filter(t => t.done).length;
          const pct = total > 0 ? Math.round((done / total) * 100) : 0;
          return (
            <Panel
              key={subj.id}
              title={subj.name}
              subtitle={`${done} of ${total} topics complete`}
              action={<span className="mono text-xs text-brand">{pct}%</span>}
            >
              <div className="mb-4 h-1.5 rounded-full bg-surface-2 overflow-hidden">
                <div className="h-full bg-brand transition-all" style={{ width: `${pct}%` }} />
              </div>
              <ul className="space-y-1">
                {subj.topics.map((t) => {
                  return (
                    <li key={t.id}>
                      <button
                        onClick={() => toggle(subj.id, t.id)}
                        className="w-full flex items-center gap-3 rounded-md px-2 py-2 text-left hover:bg-surface-2 transition"
                      >
                        <span className={"h-4 w-4 rounded-sm hairline grid place-items-center " + (t.done ? "bg-brand border-brand" : "")}>
                          {t.done && <Check className="h-3 w-3 text-brand-foreground" strokeWidth={3} />}
                        </span>
                        <span className={"text-sm " + (t.done ? "text-muted-foreground line-through" : "")}>{t.title}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </Panel>
          );
        })}
      </div>
    </div>
  );
}
