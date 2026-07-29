import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getServerEnv } from "@/lib/env.server";
import type { Database } from "@/types/database";

/**
 * Supabase client for Server Components / Server Actions. Reads and writes
 * the session via Next.js's cookie store, per Supabase's recommended SSR
 * pattern (no manual token storage).
 *
 * Server Components can't set cookies, so `setAll` is wrapped in a try/catch:
 * Next.js refreshes the session in middleware, which is where writes land.
 */
export async function createSupabaseServerClient() {
  // cookies() must run first: it's what tells Next.js this route needs
  // dynamic rendering. If getServerEnv() threw first (e.g. during a static
  // prerender pass with placeholder build-time secrets), Next would never
  // see that dynamic marker and would report a hard build failure instead
  // of just rendering the route dynamically at request time.
  const cookieStore = await cookies();
  const env = getServerEnv();

  return createServerClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
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
