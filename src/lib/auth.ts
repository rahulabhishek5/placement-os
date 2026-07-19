import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import type { User } from "@supabase/supabase-js";
import {
  createServerSupabaseClient,
  SUPABASE_ACCESS_COOKIE,
  SUPABASE_REFRESH_COOKIE,
} from "@/lib/supabase";

export type AppAuthUser = {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
};

export type AppAuthState = {
  isAuthenticated: boolean;
  user: AppAuthUser | null;
};

export const anonymousAuthState: AppAuthState = {
  isAuthenticated: false,
  user: null,
};

function parseCookieHeader(cookieHeader: string | null) {
  if (!cookieHeader) {
    return {};
  }

  return cookieHeader.split(/;\s*/).reduce<Record<string, string>>((cookies, entry) => {
    const separator = entry.indexOf("=");

    if (separator === -1) {
      return cookies;
    }

    const name = entry.slice(0, separator);
    const value = entry.slice(separator + 1);

    cookies[name] = decodeURIComponent(value);
    return cookies;
  }, {});
}

function mapSupabaseUser(user: User): AppAuthUser {
  const fullName =
    typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name
      : undefined;
  const displayName =
    typeof user.user_metadata?.name === "string" ? user.user_metadata.name : undefined;
  const fallbackName = user.email?.split("@")[0] ?? "Developer";
  const avatarUrl =
    typeof user.user_metadata?.avatar_url === "string"
      ? user.user_metadata.avatar_url
      : null;

  return {
    id: user.id,
    email: user.email ?? "",
    name: fullName ?? displayName ?? fallbackName,
    avatarUrl,
  };
}

async function resolveAuthStateFromRequest(): Promise<AppAuthState> {
  const request = getRequest();
  const cookies = parseCookieHeader(request.headers.get("cookie"));
  const accessToken = cookies[SUPABASE_ACCESS_COOKIE];
  const refreshToken = cookies[SUPABASE_REFRESH_COOKIE];

  if (!accessToken) {
    return anonymousAuthState;
  }

  const supabase = createServerSupabaseClient();

  if (refreshToken) {
    const { data, error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    if (!error && data.user) {
      return {
        isAuthenticated: true,
        user: mapSupabaseUser(data.user),
      };
    }
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(accessToken);

  if (error || !user) {
    return anonymousAuthState;
  }

  return {
    isAuthenticated: true,
    user: mapSupabaseUser(user),
  };
}

export const getAuthState = createServerFn({ method: "GET" }).handler(async () => {
  return resolveAuthStateFromRequest();
});
