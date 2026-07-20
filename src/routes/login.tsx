import { createFileRoute, Link, redirect, useNavigate, useRouter } from "@tanstack/react-router";
import { useState } from "react";


function sanitizeRedirect(target: unknown) {
  if (typeof target !== "string" || !target.startsWith("/") || target.startsWith("//")) {
    return "/dashboard";
  }

  return target;
}

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>): { redirect?: string } => ({
    redirect: search.redirect ? sanitizeRedirect(search.redirect) : undefined,
  }),
  beforeLoad: ({ context, search }) => {
    if (context.auth.isAuthenticated) {
      throw redirect({ to: sanitizeRedirect(search.redirect) });
    }
  },
  head: () => ({ meta: [{ title: "Sign in — PlacementOS" }] }),
  component: Login,
});

type Mode = "signin" | "signup";

function Login() {
  const navigate = useNavigate();
  const router = useRouter();
  const search = Route.useSearch();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<Mode>("signin");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  // ── Email / Password ───────────────────────────────────────────────────────
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);

    try {
      const { supabase, syncSupabaseSessionCookies } = await import("@/lib/supabase-client");

      if (mode === "signin") {
        const { data, error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
        syncSupabaseSessionCookies(data.session ?? null);
        await router.invalidate();
        const targetRedirect = sanitizeRedirect(search.redirect);
        navigate({ to: targetRedirect });
      } else {
        // signUp automatically triggers the handle_new_user() DB trigger
        // which inserts a row into public.profiles — no manual insert needed.
        const { error: err } = await supabase.auth.signUp({ email, password });
        if (err) throw err;
        setInfo("Account created! Check your inbox to confirm your email, then sign in.");
        setMode("signin");
        setPassword("");
      }
    } catch (err: any) {
      setError(err?.message ?? "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Google OAuth ───────────────────────────────────────────────────────────
  const continueWithGoogle = async () => {
    setError(null);
    setGoogleLoading(true);
    try {
      const { supabase } = await import("@/lib/supabase-client");
      const targetRedirect = sanitizeRedirect(search.redirect);
      const { error: err } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(targetRedirect)}`,
        },
      });
      if (err) throw err;
      // Supabase redirects the browser to Google; nothing else to do here.
    } catch (err: any) {
      setError(err?.message ?? "Google sign-in failed. Please try again.");
      setGoogleLoading(false);
    }
  };

  const switchMode = (next: Mode) => {
    setMode(next);
    setError(null);
    setInfo(null);
  };

  return (
    <div className="min-h-screen bg-background text-foreground grid-bg grid place-items-center px-4 py-10">
      <div className="w-full max-w-md">

        {/* Logo */}
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <span className="text-brand text-lg">✓</span>
          <span className="mono text-sm">PlacementOS</span>
        </Link>

        <div className="rounded-xl border border-hairline bg-surface p-8">

          {/* Heading */}
          <h1 className="text-xl font-semibold tracking-tight">
            {mode === "signin" ? "Welcome back" : "Create an account"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "signin"
              ? "Sign in to continue your prep."
              : "Start tracking your placement journey."}
          </p>

          {/* Banners */}
          {error && (
            <div className="mt-4 rounded-md bg-destructive/10 border border-destructive/30 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}
          {info && (
            <div className="mt-4 rounded-md bg-primary/10 border border-primary/30 px-3 py-2 text-sm text-primary">
              {info}
            </div>
          )}

          {/* Google OAuth */}
          <button
            onClick={continueWithGoogle}
            disabled={googleLoading || loading}
            className="mt-6 w-full flex items-center justify-center gap-3 rounded-md bg-foreground text-background px-4 py-2.5 text-sm font-semibold hover:opacity-90 transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {googleLoading ? (
              "Redirecting…"
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09Z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.25 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z"/>
                  <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.83Z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z"/>
                </svg>
                Continue with Google
              </>
            )}
          </button>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3 text-[10px] uppercase tracking-widest text-muted-foreground mono">
            <div className="h-px flex-1 bg-hairline" />
            or
            <div className="h-px flex-1 bg-hairline" />
          </div>

          {/* Email / Password form */}
          <form onSubmit={submit} className="space-y-4">
            <label className="block">
              <span className="mono text-[10px] uppercase tracking-widest text-muted-foreground">Email</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.dev"
                className="mt-1.5 w-full h-10 rounded-md bg-background hairline px-3 text-sm focus:outline-none focus:ring-1 focus:ring-brand"
              />
            </label>

            <label className="block">
              <div className="flex items-baseline justify-between">
                <span className="mono text-[10px] uppercase tracking-widest text-muted-foreground">Password</span>
                {mode === "signin" && (
                  <a href="#" className="text-[11px] text-muted-foreground hover:text-brand">
                    Forgot password?
                  </a>
                )}
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                minLength={6}
                className="mt-1.5 w-full h-10 rounded-md bg-background hairline px-3 text-sm focus:outline-none focus:ring-1 focus:ring-brand"
              />
            </label>

            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full h-10 rounded-md bg-brand text-brand-foreground text-sm font-semibold hover:bg-brand/90 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading
                ? "Please wait…"
                : mode === "signin"
                ? "Sign in"
                : "Create account"}
            </button>
          </form>

          {/* Switch mode */}
          <p className="mt-5 text-center text-xs text-muted-foreground">
            {mode === "signin" ? (
              <>
                Don't have an account?{" "}
                <button
                  onClick={() => switchMode("signup")}
                  className="text-brand hover:underline"
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  onClick={() => switchMode("signin")}
                  className="text-brand hover:underline"
                >
                  Sign in
                </button>
              </>
            )}
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          By continuing you agree to our terms.
        </p>
      </div>
    </div>
  );
}
