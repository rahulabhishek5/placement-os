import { createFileRoute } from "@tanstack/react-router";
import { useStore } from "@/lib/placement-store";
import { supabase } from "@/lib/supabase";
import { auth } from "@/lib/store";
import { useState } from "react";
import { AlertTriangle, Download, Save, Trash2, User, Settings2, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/settings")({
  head: () => ({ meta: [{ title: "Settings — PlacementOS" }] }),
  component: SettingsPage,
});

type Tab = "profile" | "data";

// ─── Shared UI ───────────────────────────────────────────────────────────────
const inputCls =
  "w-full h-10 rounded-md bg-background border border-border px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary transition";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mono text-[10px] uppercase tracking-widest text-muted-foreground">{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

function Banner({ type, msg }: { type: "success" | "error"; msg: string }) {
  return (
    <div className={cn(
      "mt-4 rounded-md px-3 py-2 text-sm",
      type === "success"
        ? "bg-primary/10 border border-primary/30 text-primary"
        : "bg-destructive/10 border border-destructive/30 text-destructive"
    )}>
      {msg}
    </div>
  );
}

// ─── Profile Section ──────────────────────────────────────────────────────────
function ProfileSection() {
  const { store, update, hydrated } = useStore();
  const user = auth.useUser();

  const [name, setName] = useState(store.profile.name ?? "");
  const [college, setCollege] = useState(store.profile.college ?? "");
  const [targetRole, setTargetRole] = useState(store.profile.targetRole ?? "Software Engineer");
  const [lcUsername, setLcUsername] = useState(store.profile.lcUsername ?? "");
  const [saving, setSaving] = useState(false);
  const [lcLoading, setLcLoading] = useState(false);
  const [lcStatus, setLcStatus] = useState<"idle" | "valid" | "invalid">("idle");
  const [lcPreview, setLcPreview] = useState<{ solved: number; easy: number; medium: number; hard: number } | null>(null);
  const [banner, setBanner] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // Sync local input if store changes externally (e.g. after Supabase hydration)
  const storeUsername = store.profile.lcUsername ?? "";

  if (!hydrated) return null;

  const showBanner = (type: "success" | "error", msg: string) => {
    setBanner({ type, msg });
    setTimeout(() => setBanner(null), 4000);
  };

  // Save profile details (name, role, college) to Supabase profiles table
  const saveProfile = async () => {
    setSaving(true);
    try {
      update((s) => ({
        ...s,
        profile: { ...s.profile, name, college, targetRole },
      }));

      const { data: { user: sbUser } } = await supabase.auth.getUser();
      if (sbUser) {
        const { error } = await supabase
          .from("profiles")
          .update({ name, college, target_role: targetRole })
          .eq("id", sbUser.id);
        if (error) throw error;
      }

      showBanner("success", "Profile saved successfully.");
    } catch (err: any) {
      showBanner("error", err?.message ?? "Failed to save profile.");
    } finally {
      setSaving(false);
    }
  };

  // Validate via alfa-leetcode-api then save if valid
  const saveLcUsername = async () => {
    const trimmed = lcUsername.trim();
    if (!trimmed) return;
    setLcLoading(true);
    setLcPreview(null);
    try {
      const { fetchLcStats } = await import("@/lib/placement-store");
      const result = await fetchLcStats(trimmed);

      if (!result.ok) {
        setLcStatus("invalid");
        showBanner("error", result.error);
        return;
      }

      // Valid — persist
      update((s) => ({
        ...s,
        profile: { ...s.profile, lcUsername: trimmed },
        lcApiStats: result.stats,
      }));

      const { data: { user: sbUser } } = await supabase.auth.getUser();
      if (sbUser) {
        await supabase
          .from("profiles")
          .update({ avatar_seed: trimmed })
          .eq("id", sbUser.id);
      }

      if (result.stats) {
        setLcPreview({
          solved: result.stats.solvedProblem,
          easy: result.stats.easySolved,
          medium: result.stats.mediumSolved,
          hard: result.stats.hardSolved,
        });
      }

      setLcStatus("valid");
      showBanner("success", `✓ "${trimmed}" verified — ${result.stats?.solvedProblem ?? 0} problems solved.`);
    } catch (err: any) {
      setLcStatus("invalid");
      showBanner("error", err?.message ?? "Failed to save LeetCode username.");
    } finally {
      setLcLoading(false);
    }
  };

  // Clear / unlink LeetCode username
  const clearLcUsername = async () => {
    if (!confirm("Unlink your LeetCode username?")) return;
    setLcLoading(true);
    try {
      update((s) => ({
        ...s,
        profile: { ...s.profile, lcUsername: "" },
        lcApiStats: null,
      }));
      setLcUsername("");
      setLcPreview(null);
      setLcStatus("idle");

      const { data: { user: sbUser } } = await supabase.auth.getUser();
      if (sbUser) {
        await supabase
          .from("profiles")
          .update({ avatar_seed: "" })
          .eq("id", sbUser.id);
      }

      showBanner("success", "LeetCode username removed.");
    } catch (err: any) {
      showBanner("error", err?.message ?? "Failed to remove LeetCode username.");
    } finally {
      setLcLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {banner && <Banner type={banner.type} msg={banner.msg} />}

      {/* Account info (read-only) */}
      <section className="rounded-xl border border-border bg-card p-6">
        <h3 className="text-base font-semibold">Account</h3>
        <p className="mono mt-1 text-[11px] text-muted-foreground">
          Signed-in identity. Email cannot be changed here.
        </p>
        <div className="mt-4">
          <Field label="Email (read-only)">
            <input
              disabled
              value={user?.email ?? ""}
              className={cn(inputCls, "opacity-50 cursor-not-allowed")}
            />
          </Field>
        </div>
      </section>

      {/* Profile details */}
      <section className="rounded-xl border border-border bg-card p-6">
        <h3 className="text-base font-semibold">Profile Details</h3>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Display Name">
            <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} placeholder="Your name" />
          </Field>
          <Field label="Target Role">
            <input value={targetRole} onChange={(e) => setTargetRole(e.target.value)} className={inputCls} placeholder="Software Engineer" />
          </Field>
          <Field label="College / Company">
            <input value={college} onChange={(e) => setCollege(e.target.value)} className={inputCls} placeholder="e.g. IIT Delhi" />
          </Field>
        </div>
        <div className="mt-6 flex justify-end">
          <button
            onClick={saveProfile}
            disabled={saving}
            className="cursor-pointer inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Save className="h-3.5 w-3.5" />
            {saving ? "Saving…" : "Save profile"}
          </button>
        </div>
      </section>

      {/* LeetCode Username */}
      <section className="rounded-xl border border-border bg-card p-6">
        <h3 className="text-base font-semibold">LeetCode Username</h3>
        <p className="mono mt-1 text-[11px] text-muted-foreground">
          Enter your LeetCode username to auto-fetch stats. Username is verified before saving.
        </p>

        {/* Current linked username badge */}
        {storeUsername && lcStatus !== "valid" && (
          <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <CheckCircle2 className="h-3 w-3" />
            Linked: {storeUsername}
          </div>
        )}

        <div className="mt-4 flex gap-2">
          <input
            value={lcUsername}
            onChange={(e) => { setLcUsername(e.target.value); setLcStatus("idle"); setLcPreview(null); }}
            onKeyDown={(e) => { if (e.key === "Enter") saveLcUsername(); }}
            className={cn(inputCls, "flex-1", lcStatus === "invalid" && "border-destructive focus:ring-destructive")}
            placeholder="e.g. john_doe_99"
          />
          <button
            onClick={saveLcUsername}
            disabled={lcLoading || !lcUsername.trim()}
            className="cursor-pointer inline-flex shrink-0 items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {lcLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            {lcLoading ? "Verifying…" : "Verify & Save"}
          </button>
        </div>

        {/* Validation status */}
        {lcStatus !== "idle" && (
          <div className={cn("mt-3 flex items-center gap-2 text-xs font-medium", lcStatus === "valid" ? "text-emerald-500" : "text-destructive")}>
            {lcStatus === "valid" ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
            {lcStatus === "valid" ? "Username verified and synced to LeetCode page." : "Username does not exist on LeetCode."}
          </div>
        )}

        {/* Stats preview */}
        {lcPreview && (
          <div className="mt-4 grid grid-cols-4 gap-3">
            {([
              { label: "Total", val: lcPreview.solved, cls: "text-foreground" },
              { label: "Easy", val: lcPreview.easy, cls: "text-emerald-400" },
              { label: "Medium", val: lcPreview.medium, cls: "text-primary" },
              { label: "Hard", val: lcPreview.hard, cls: "text-destructive" },
            ] as const).map(({ label, val, cls }) => (
              <div key={label} className="rounded-lg border border-border bg-background p-3 text-center">
                <div className={`text-xl font-bold tabular-nums ${cls}`}>{val}</div>
                <div className="mono mt-1 text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
              </div>
            ))}
          </div>
        )}

        {store.profile.lcUsername && (
          <div className="mt-4">
            <button
              onClick={clearLcUsername}
              disabled={lcLoading}
              className="inline-flex items-center gap-2 rounded-md border border-destructive/40 px-4 py-2 text-sm font-semibold text-destructive hover:bg-destructive/10 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Unlink
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

// ─── Data Section ─────────────────────────────────────────────────────────────
function DataSection() {
  const { store, update, hydrated } = useStore();

  if (!hydrated) return null;

  const exportData = () => {
    const blob = new Blob([JSON.stringify(store, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "placementos-backup.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const wipe = () => {
    if (!confirm("Delete all local data? This cannot be undone.")) return;
    localStorage.removeItem("placementos::v1");
    location.reload();
  };

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-border bg-card p-6">
        <h3 className="text-base font-semibold">Preferences</h3>
        <div className="mt-4 space-y-3">
          <Row title="Daily streak tracking" desc="Increment streak counter automatically on activity." checked={true} />
          <Row title="Revision reminders" desc="Flag LeetCode solves older than 7 days for revisit." checked={true} />
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-6">
        <h3 className="text-base font-semibold">Data</h3>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            onClick={exportData}
            className="mono flex items-center justify-center gap-2 rounded-md border border-border px-4 py-2.5 text-xs font-semibold hover:border-primary hover:text-primary transition"
          >
            <Download className="h-3.5 w-3.5" /> Export JSON
          </button>
          <button
            onClick={wipe}
            className="mono flex items-center justify-center gap-2 rounded-md border border-destructive/40 px-4 py-2.5 text-xs font-semibold text-destructive hover:bg-destructive/10 transition"
          >
            <AlertTriangle className="h-3.5 w-3.5" /> Reset all data
          </button>
        </div>
        <p className="mono mt-3 text-[11px] text-muted-foreground">
          All data lives locally in your browser, synced to Supabase when logged in.
        </p>
      </section>

      {/* TS validation fallback */}
      <div className="hidden" data-noop={String(!!update)} />
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
function SettingsPage() {
  const [tab, setTab] = useState<Tab>("profile");

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "profile", label: "Profile", icon: User },
    { id: "data", label: "Preferences & Data", icon: Settings2 },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="mono text-xs text-muted-foreground">Manage your profile, LeetCode integration, and data.</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 rounded-lg border border-border bg-card p-1">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors",
              tab === id
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-[oklch(0.21_0_0)]"
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "profile" ? <ProfileSection /> : <DataSection />}
    </div>
  );
}

// ─── Toggle Row ───────────────────────────────────────────────────────────────
function Row({ title, desc, checked }: { title: string; desc: string; checked: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-border bg-[oklch(0.21_0_0)] p-4">
      <div className="min-w-0 pr-4">
        <div className="text-sm font-medium text-foreground">{title}</div>
        <div className="mono mt-0.5 text-[11px] text-muted-foreground">{desc}</div>
      </div>
      <div className={cn(
        "relative h-6 w-11 shrink-0 rounded-full border transition-colors",
        checked ? "border-primary bg-primary/40" : "border-border bg-[oklch(0.26_0_0)]"
      )}>
        <span className={cn(
          "absolute top-0.5 h-4 w-4 rounded-full transition-all",
          checked ? "left-6 bg-primary" : "left-0.5 bg-muted-foreground"
        )} />
      </div>
    </div>
  );
}
