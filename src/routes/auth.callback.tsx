import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase, syncSupabaseSessionCookies } from "@/lib/supabase";

function sanitizeRedirect(target: unknown) {
  if (typeof target !== "string" || !target.startsWith("/") || target.startsWith("//")) {
    return "/dashboard";
  }

  return target;
}

export const Route = createFileRoute("/auth/callback")({
  validateSearch: (search) => ({
    redirect: sanitizeRedirect(search.redirect),
  }),
  head: () => ({ meta: [{ title: "Signing in — PlacementOS" }] }),
  component: AuthCallbackPage,
});

function AuthCallbackPage() {
  const navigate = useNavigate();
  const router = useRouter();
  const search = Route.useSearch();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function finalizeLogin() {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        throw sessionError;
      }

      if (!session) {
        throw new Error("No authenticated session was returned by Supabase.");
      }

      syncSupabaseSessionCookies(session);
      await router.invalidate();

      if (!cancelled) {
        navigate({ to: search.redirect, replace: true });
      }
    }

    void finalizeLogin().catch((caughtError) => {
      if (!cancelled) {
        const message =
          caughtError instanceof Error
            ? caughtError.message
            : "We could not finish your sign-in. Please try again.";
        setError(message);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [navigate, router, search.redirect]);

  return (
    <div className="grid min-h-screen place-items-center bg-background px-4">
      <div className="w-full max-w-md rounded-xl border border-hairline bg-surface p-8 text-center">
        <h1 className="text-xl font-semibold tracking-tight">
          {error ? "Sign-in failed" : "Finishing sign-in"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {error ?? "We are syncing your session with the server and taking you back to the app."}
        </p>
      </div>
    </div>
  );
}
