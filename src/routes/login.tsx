import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { auth } from "@/lib/store";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in — PlacementOS" }] }),
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    auth.signIn(email);
    navigate({ to: "/dashboard" });
  };

  const google = () => {
    auth.signIn("dev@placementos.app");
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="min-h-screen bg-background text-foreground grid-bg grid place-items-center px-4 py-10">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <span className="text-brand text-lg">✓</span>
          <span className="mono text-sm">PlacementOS</span>
        </Link>

        <div className="rounded-xl border border-hairline bg-surface p-8">
          <h1 className="text-xl font-semibold tracking-tight">Welcome back</h1>
          <p className="mt-1 text-sm text-muted-foreground">Sign in to continue your prep.</p>

          <button
            onClick={google}
            className="mt-6 w-full flex items-center justify-center gap-3 rounded-md bg-foreground text-background px-4 py-2.5 text-sm font-semibold hover:opacity-90 transition"
          >
            <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09Z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.25 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z"/><path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.83Z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z"/></svg>
            Continue with Google
          </button>

          <div className="my-6 flex items-center gap-3 text-[10px] uppercase tracking-widest text-muted-foreground mono">
            <div className="h-px flex-1 bg-hairline" />
            or
            <div className="h-px flex-1 bg-hairline" />
          </div>

          <form onSubmit={submit} className="space-y-4">
            <label className="block">
              <span className="mono text-[10px] uppercase tracking-widest text-muted-foreground">Email</span>
              <input
                type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.dev"
                className="mt-1.5 w-full h-10 rounded-md bg-background hairline px-3 text-sm focus:outline-none focus:ring-1 focus:ring-brand"
              />
            </label>
            <label className="block">
              <div className="flex items-baseline justify-between">
                <span className="mono text-[10px] uppercase tracking-widest text-muted-foreground">Password</span>
                <a href="#" className="text-[11px] text-muted-foreground hover:text-brand">Forgot password?</a>
              </div>
              <input
                type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1.5 w-full h-10 rounded-md bg-background hairline px-3 text-sm focus:outline-none focus:ring-1 focus:ring-brand"
              />
            </label>
            <button
              type="submit"
              className="w-full h-10 rounded-md bg-brand text-brand-foreground text-sm font-semibold hover:bg-brand/90 transition"
            >
              Sign in
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          By continuing you agree to our terms. No account needed — sign in mints a local session.
        </p>
      </div>
    </div>
  );
}
