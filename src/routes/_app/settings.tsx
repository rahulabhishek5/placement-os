import { createFileRoute } from "@tanstack/react-router";
import { useStore } from "@/lib/placement-store";
import { AlertTriangle, Download } from "lucide-react";

export const Route = createFileRoute("/_app/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { store, update, hydrated } = useStore();

  if (!hydrated) return null;

  const exportData = () => {
    const blob = new Blob([JSON.stringify(store, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "placementos-backup.json"; a.click();
    URL.revokeObjectURL(url);
  };

  const wipe = () => {
    if (!confirm("Delete all local data? This cannot be undone.")) return;
    localStorage.removeItem("placementos::v1");
    location.reload();
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="mono text-xs text-muted-foreground">Preferences and data controls.</p>
      </div>


      <section className="rounded-xl border border-border bg-card p-6">
        <h3 className="text-lg font-semibold">Preferences</h3>
        <div className="mt-4 space-y-3">
          <Row
            title="Daily streak tracking"
            desc="Increment streak counter automatically on activity."
            checked={true}
          />
          <Row
            title="Revision reminders"
            desc="Flag LeetCode solves older than 7 days for revisit."
            checked={true}
          />
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-6">
        <h3 className="text-lg font-semibold">Data</h3>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button onClick={exportData} className="mono flex items-center justify-center gap-2 rounded-md border border-border px-4 py-2.5 text-xs font-semibold hover:border-primary hover:text-primary">
            <Download className="h-3.5 w-3.5" /> Export JSON
          </button>
          <button onClick={wipe} className="mono flex items-center justify-center gap-2 rounded-md border border-destructive/40 px-4 py-2.5 text-xs font-semibold text-destructive hover:bg-destructive/10">
            <AlertTriangle className="h-3.5 w-3.5" /> Reset all data
          </button>
        </div>
        <p className="mono mt-3 text-[11px] text-muted-foreground">
          All data lives locally in your browser, synced to Supabase when logged in.
        </p>
      </section>

      {/* TS validation fallback */}
      <div className="hidden" data-x={store.profile.email} data-noop={String(!!update)} />
    </div>
  );
}

function Row({ title, desc, checked }: { title: string; desc: string; checked: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-border bg-[oklch(0.21_0_0)] p-4">
      <div className="min-w-0 pr-4">
        <div className="text-sm font-medium text-foreground">{title}</div>
        <div className="mono mt-0.5 text-[11px] text-muted-foreground">{desc}</div>
      </div>
      <div className={[
        "relative h-6 w-11 shrink-0 rounded-full border transition-colors",
        checked ? "border-primary bg-primary/40" : "border-border bg-[oklch(0.26_0_0)]",
      ].join(" ")}>
        <span className={[
          "absolute top-0.5 h-4 w-4 rounded-full transition-all",
          checked ? "left-6 bg-primary" : "left-0.5 bg-muted-foreground",
        ].join(" ")} />
      </div>
    </div>
  );
}
