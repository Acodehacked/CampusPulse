import { createBrowserClient } from "@supabase/ssr";
import { getClientEnv } from "@/lib/env.client";

/** Supabase client for use inside Client Components. Session lives in cookies, not localStorage. */
export function createSupabaseBrowserClient() {
  const env = getClientEnv();
  return createBrowserClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
}
