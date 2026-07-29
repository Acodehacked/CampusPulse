import { createServerClient } from "@supabase/ssr";
import { parseCookieHeader, serializeCookieHeader } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
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
 * Resolves the Supabase session for every Hono request, either from cookies
 * (the browser's normal path — Hono runs inside a plain Next.js Route
 * Handler here, so parseCookieHeader/serializeCookieHeader are @supabase/ssr's
 * framework-agnostic helpers for reading/writing them without next/headers)
 * or from an `Authorization: Bearer <access_token>` header for non-browser
 * API clients (e.g. scripts/smoke.ts, or a future mobile client).
 */
export const attachSupabase = createMiddleware<{ Variables: AuthVariables }>(async (c, next) => {
  const env = getServerEnv();
  const bearerToken = c.req.header("authorization")?.match(/^Bearer (.+)$/i)?.[1];

  const supabase = bearerToken
    ? createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
        global: { headers: { Authorization: `Bearer ${bearerToken}` } },
        auth: { autoRefreshToken: false, persistSession: false },
      })
    : createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
        cookies: {
          getAll() {
            return parseCookieHeader(c.req.header("cookie") ?? "").map(({ name, value }) => ({
              name,
              value: value ?? "",
            }));
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
  } = bearerToken ? await supabase.auth.getUser(bearerToken) : await supabase.auth.getUser();

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
