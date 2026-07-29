import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getServerEnv } from "@/lib/env.server";

/**
 * Supabase client for Server Components / Server Actions. Reads and writes
 * the session via Next.js's cookie store, per Supabase's recommended SSR
 * pattern (no manual token storage).
 *
 * Server Components can't set cookies, so `setAll` is wrapped in a try/catch:
 * Next.js refreshes the session in middleware, which is where writes land.
 */
export async function createSupabaseServerClient() {
  const env = getServerEnv();
  const cookieStore = await cookies();

  return createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component without an outgoing response;
          // safe to ignore because middleware keeps the session refreshed.
        }
      },
    },
  });
}
