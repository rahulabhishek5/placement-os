import { createFileRoute } from "@tanstack/react-router";
import { auth } from "@/lib/store";
import { PageHeader, Panel } from "@/components/ui-bits";
import { useState } from "react";

export const Route = createFileRoute("/_app/profile")({
  head: () => ({ meta: [{ title: "Profile — PlacementOS" }] }),
  component: ProfilePage,
});

const AVATARS = ["A", "B", "C", "D", "E", "F"];

function ProfilePage() {
  const user = auth.useUser();
  const [name, setName] = useState(user?.name ?? "");
  const [role, setRole] = useState("Software Engineer");
  const [college, setCollege] = useState("");
  const [avatar, setAvatar] = useState(0);

  return (
    <div className="space-y-6">
      <PageHeader title="Profile" subtitle="How you show up in PlacementOS." />

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        <Panel title="Avatar">
          <div className="grid place-items-center">
            <div className="h-24 w-24 rounded-2xl bg-brand/10 border border-brand/40 grid place-items-center text-3xl mono text-brand">
              {AVATARS[avatar]}
            </div>
            <div className="mt-4 grid grid-cols-6 gap-2">
              {AVATARS.map((a, i) => (
                <button key={a} onClick={() => setAvatar(i)}
                  className={"h-8 w-8 rounded-md mono text-xs hairline grid place-items-center " + (i === avatar ? "bg-brand text-brand-foreground border-brand" : "bg-surface-2 text-muted-foreground hover:text-foreground")}>
                  {a}
                </button>
              ))}
            </div>
          </div>
        </Panel>

        <Panel title="Details">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Display Name"><input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} /></Field>
            <Field label="Email"><input disabled value={user?.email ?? ""} className={inputCls + " opacity-60"} /></Field>
            <Field label="Target Role"><input value={role} onChange={(e) => setRole(e.target.value)} className={inputCls} /></Field>
            <Field label="College / Company"><input value={college} onChange={(e) => setCollege(e.target.value)} className={inputCls} placeholder="e.g. IIT Delhi" /></Field>
          </div>
          <div className="mt-6 flex justify-end">
            <button className="rounded-md bg-brand text-brand-foreground px-4 py-2 text-sm font-semibold">Save changes</button>
          </div>
        </Panel>
      </div>
    </div>
  );
}

const inputCls = "w-full h-10 rounded-md bg-background hairline px-3 text-sm focus:outline-none focus:ring-1 focus:ring-brand";
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mono text-[10px] uppercase tracking-widest text-muted-foreground">{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}
