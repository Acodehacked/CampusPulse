import { createBrowserClient } from "@supabase/ssr";
import { getClientEnv } from "@/lib/env.client";
import type { Database } from "@/types/database";

/** Supabase client for use inside Client Components. Session lives in cookies, not localStorage. */
export function createSupabaseBrowserClient() {
  const env = getClientEnv();
  return createBrowserClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
}
