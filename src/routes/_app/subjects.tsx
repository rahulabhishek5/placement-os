import { createFileRoute } from "@tanstack/react-router";
import { subjects, SUBJECT_TREE, type SubjectKey } from "@/lib/store";
import { PageHeader, Panel } from "@/components/ui-bits";
import { Check } from "lucide-react";

export const Route = createFileRoute("/_app/subjects")({
  head: () => ({ meta: [{ title: "Subjects — PlacementOS" }] }),
  component: SubjectsPage,
});

function SubjectsPage() {
  const state = subjects.useAll();
  return (
    <div className="space-y-6">
      <PageHeader title="CS Subjects" subtitle="Master the fundamentals. Check off as you go." />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {(Object.keys(SUBJECT_TREE) as SubjectKey[]).map((k) => {
          const p = subjects.progress(k, state);
          return (
            <Panel
              key={k}
              title={SUBJECT_TREE[k].name}
              subtitle={`${p.done} of ${p.total} topics complete`}
              action={<span className="mono text-xs text-brand">{p.pct}%</span>}
            >
              <div className="mb-4 h-1.5 rounded-full bg-surface-2 overflow-hidden">
                <div className="h-full bg-brand transition-all" style={{ width: `${p.pct}%` }} />
              </div>
              <ul className="space-y-1">
                {SUBJECT_TREE[k].topics.map((t) => {
                  const id = `${k}:${t}`;
                  const done = !!state[id];
                  return (
                    <li key={id}>
                      <button
                        onClick={() => subjects.toggle(id)}
                        className="w-full flex items-center gap-3 rounded-md px-2 py-2 text-left hover:bg-surface-2 transition"
                      >
                        <span className={"h-4 w-4 rounded-sm hairline grid place-items-center " + (done ? "bg-brand border-brand" : "")}>
                          {done && <Check className="h-3 w-3 text-brand-foreground" strokeWidth={3} />}
                        </span>
                        <span className={"text-sm " + (done ? "text-muted-foreground line-through" : "")}>{t}</span>
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
