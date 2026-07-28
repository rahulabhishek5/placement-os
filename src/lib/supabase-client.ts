import { createClient, type Session } from "@supabase/supabase-js";

export const SUPABASE_ACCESS_COOKIE = "sb-access-token";
export const SUPABASE_REFRESH_COOKIE = "sb-refresh-token";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Missing Supabase environment variables! Data operations will fail.");
}

function serializeCookie(name: string, value: string, maxAge: number) {
  // SECURITY NOTE — HttpOnly limitation:
  // The `HttpOnly` flag prevents JavaScript from reading a cookie via document.cookie.
  // However, HttpOnly can ONLY be set by the server via a `Set-Cookie` response header —
  // browsers silently ignore the HttpOnly attribute when set from JavaScript.
  //
  // This function runs client-side, so we CANNOT set HttpOnly here. The auth tokens
  // remain readable by JavaScript on this page. Acceptable risk given:
  //   a) React's JSX escaping eliminates reflected XSS vectors in this codebase.
  //   b) No raw HTML is ever injected (dangerouslySetInnerHTML audit: only in chart.tsx
  //      for CSS variable injection — not user-controlled data).
  //
  // FUTURE MIGRATION PATH (recommended before public launch):
  // Replace this client-side cookie management with @supabase/ssr + server functions.
  // The server function calls `response.headers.append("Set-Cookie", "...; HttpOnly")`
  // which allows the browser to enforce HttpOnly correctly.
  // See: https://supabase.com/docs/guides/auth/server-side/creating-a-client
  const secure = typeof window !== "undefined" && window.location.protocol === "https:";

  return [
    `${name}=${encodeURIComponent(value)}`,
    "Path=/",
    `Max-Age=${maxAge}`,
    // SameSite=Strict: cookie is NEVER sent on cross-site requests (not even on
    // top-level GET navigations from external sites). More restrictive than Lax.
    // Safe here because this app has no OAuth implicit-flow requiring Lax.
    "SameSite=Strict",
    secure ? "Secure" : "",
  ]
    .filter(Boolean)
    .join("; ");
}

export function syncSupabaseSessionCookies(session: Session | null) {
  if (typeof document === "undefined") {
    return;
  }

  if (!session?.access_token || !session.refresh_token) {
    document.cookie = serializeCookie(SUPABASE_ACCESS_COOKIE, "", 0);
    document.cookie = serializeCookie(SUPABASE_REFRESH_COOKIE, "", 0);
    return;
  }

  const expiresIn = Math.max(session.expires_in ?? 3600, 60);
  const refreshMaxAge = 60 * 60 * 24 * 30;

  document.cookie = serializeCookie(
    SUPABASE_ACCESS_COOKIE,
    session.access_token,
    expiresIn,
  );
  document.cookie = serializeCookie(
    SUPABASE_REFRESH_COOKIE,
    session.refresh_token,
    refreshMaxAge,
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    detectSessionInUrl: true,
    persistSession: true,
  },
});

let cookieSyncInitialized = false;

export function ensureSupabaseSessionCookieSync() {
  if (typeof window === "undefined" || cookieSyncInitialized) {
    return;
  }

  cookieSyncInitialized = true;

  void supabase.auth.getSession().then(({ data }) => {
    syncSupabaseSessionCookies(data.session ?? null);
  });

  supabase.auth.onAuthStateChange((_event, session) => {
    syncSupabaseSessionCookies(session);
  });
}
