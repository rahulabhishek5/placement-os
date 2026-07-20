import { createClient, type Session } from "@supabase/supabase-js";

export const SUPABASE_ACCESS_COOKIE = "sb-access-token";
export const SUPABASE_REFRESH_COOKIE = "sb-refresh-token";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Missing Supabase environment variables! Data operations will fail.");
}

function serializeCookie(name: string, value: string, maxAge: number) {
  const secure = typeof window !== "undefined" && window.location.protocol === "https:";

  return [
    `${name}=${encodeURIComponent(value)}`,
    "Path=/",
    `Max-Age=${maxAge}`,
    "SameSite=Lax",
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
