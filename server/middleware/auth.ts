import { createServerClient } from "@supabase/ssr";
import { parseCookieHeader, serializeCookieHeader } from "@supabase/ssr";
import { createMiddleware } from "hono/factory";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { getServerEnv } from "@/lib/env.server";
import { AppError } from "@/server/lib/app-error";

export type CurrentProfile = {
  id: string;
  email: string;
  displayName: string;
  role: "student" | "admin";
};

export type AuthVariables = {
  supabase: SupabaseClient;
  user: User | null;
  profile: CurrentProfile | null;
};

/**
 * Resolves the Supabase session from the request's cookies for every Hono
 * request. Hono runs inside a plain Next.js Route Handler here, so it only
 * has the raw Request/Response — parseCookieHeader/serializeCookieHeader are
 * @supabase/ssr's framework-agnostic helpers for exactly this case.
 */
export const attachSupabase = createMiddleware<{ Variables: AuthVariables }>(async (c, next) => {
  const env = getServerEnv();
  const cookieHeader = c.req.header("cookie") ?? "";

  const supabase = createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll() {
        return parseCookieHeader(cookieHeader).map(({ name, value }) => ({ name, value: value ?? "" }));
      },
      setAll(cookiesToSet) {
        for (const { name, value, options } of cookiesToSet) {
          c.header("Set-Cookie", serializeCookieHeader(name, value, options), { append: true });
        }
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile: CurrentProfile | null = null;
  if (user) {
    const { data } = await supabase.from("profiles").select("id, email, display_name, role").eq("id", user.id).single();
    if (data) {
      profile = { id: data.id, email: data.email, displayName: data.display_name, role: data.role };
    }
  }

  c.set("supabase", supabase);
  c.set("user", user);
  c.set("profile", profile);

  await next();
});

export const requireAuth = createMiddleware<{ Variables: AuthVariables }>(async (c, next) => {
  if (!c.get("user") || !c.get("profile")) {
    throw AppError.unauthorized();
  }
  await next();
});

export const requireAdmin = createMiddleware<{ Variables: AuthVariables }>(async (c, next) => {
  const profile = c.get("profile");
  if (!profile) {
    throw AppError.unauthorized();
  }
  if (profile.role !== "admin") {
    throw AppError.forbidden("Admin access required");
  }
  await next();
});
