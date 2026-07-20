import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Trash2, Building2, X } from "lucide-react";
import { useStore, stageOrder, stageLabels, type Stage, type Application, uid } from "@/lib/placement-store";

export const Route = createFileRoute("/_app/companies")({
  component: CompaniesPage,
});

const stageColor: Record<Stage, string> = {
  applied: "text-muted-foreground",
  oa: "text-yellow-400",
  interview: "text-primary",
  offer: "text-emerald-400",
  rejected: "text-destructive",
};

function CompaniesPage() {
  const { store: allApps, update, hydrated } = useStore((s) => s.applications);
  const [open, setOpen] = useState(false);
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [stage, setStage] = useState<Stage>("applied");

  const add = () => {
    if (!company.trim()) return;
    update((s) => ({
      ...s,
      applications: [
        ...s.applications,
        { id: uid(), company: company.trim(), role: role.trim() || "SDE", stage, createdAt: Date.now() },
      ],
    }));
    setCompany(""); setRole(""); setStage("applied"); setOpen(false);
  };

  const columns: Record<Stage, Application[]> = {
    applied: allApps.filter((a) => a.stage === "applied"),
    oa: allApps.filter((a) => a.stage === "oa"),
    interview: allApps.filter((a) => a.stage === "interview"),
    offer: allApps.filter((a) => a.stage === "offer"),
    rejected: allApps.filter((a) => a.stage === "rejected"),
  };

  const remove = (id: string) =>
    update((s) => ({ ...s, applications: s.applications.filter((a) => a.id !== id) }));

  const move = (id: string, to: Stage) =>
    update((s) => ({ ...s, applications: s.applications.map((a) => (a.id === id ? { ...a, stage: to } : a)) }));

  if (!hydrated) return null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
        <div className="min-w-0">
          <h2 className="truncate text-3xl font-bold tracking-tight">Companies</h2>
          <p className="mono text-xs text-muted-foreground">Track every application from applied to offer.</p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="mono inline-flex shrink-0 items-center gap-2 rounded-md bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:-translate-y-0.5 transition-transform"
        >
          <Plus className="h-4 w-4" /> Add
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        {stageOrder.map((s) => {
          const items = allApps.filter((a) => a.stage === s);
          return (
            <div key={s} className="flex flex-col rounded-xl border border-border bg-card">
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className={["mono text-xs font-bold uppercase tracking-widest", stageColor[s]].join(" ")}>
                    {stageLabels[s]}
                  </span>
                </div>
                <span className="mono rounded-md border border-border bg-[oklch(0.21_0_0)] px-2 py-0.5 text-[11px] text-muted-foreground">
                  {items.length}
                </span>
              </div>
              <div className="flex flex-1 flex-col gap-2 p-3">
                {items.length === 0 && (
                  <div className="rounded-md border border-dashed border-border p-4 text-center">
                    <p className="mono text-[10px] uppercase tracking-widest text-muted-foreground">Empty</p>
                  </div>
                )}
                {items.map((a) => (
                  <div key={a.id} className="group rounded-md border border-border bg-[oklch(0.21_0_0)] p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-3.5 w-3.5 shrink-0 text-primary" />
                          <span className="truncate text-sm font-semibold text-foreground">{a.company}</span>
                        </div>
                        <div className="mono mt-1 truncate text-[11px] text-muted-foreground">{a.role}</div>
                      </div>
                      <button
                        onClick={() => remove(a.id)}
                        className="grid h-6 w-6 shrink-0 place-items-center rounded text-muted-foreground opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                        aria-label="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <select
                      value={a.stage}
                      onChange={(e) => move(a.id, e.target.value as Stage)}
                      className="mono mt-3 h-7 w-full rounded border border-border bg-background px-2 text-[11px] text-muted-foreground focus:border-primary focus:outline-none"
                    >
                      {stageOrder.map((st) => (
                        <option key={st} value={st}>{stageLabels[st]}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-lg font-semibold">New Application</h3>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-4">
              <Field label="Company">
                <input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Google" className={fieldCls} />
              </Field>
              <Field label="Role">
                <input value={role} onChange={(e) => setRole(e.target.value)} placeholder="SDE-1" className={fieldCls} />
              </Field>
              <Field label="Stage">
                <select value={stage} onChange={(e) => setStage(e.target.value as Stage)} className={fieldCls}>
                  {stageOrder.map((s) => (
                    <option key={s} value={s}>{stageLabels[s]}</option>
                  ))}
                </select>
              </Field>
              <button
                onClick={add}
                className="mono w-full rounded-md bg-primary py-2.5 text-sm font-bold text-primary-foreground"
              >
                Add application
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const fieldCls =
  "mono h-10 w-full rounded-md border border-border bg-[oklch(0.21_0_0)] px-3 text-sm text-foreground focus:border-primary focus:outline-none";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mono mb-1.5 block text-[11px] uppercase tracking-wider text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}
