import { createClient } from "@supabase/supabase-js";
import { getServerEnv } from "@/lib/env.server";
import type { Database } from "@/types/database";

/**
 * Service-role Supabase client. Bypasses RLS entirely — only import this
 * inside server-only modules that have already performed their own
 * authorization check (e.g. admin-service.ts after requireAdmin), and only
 * for operations where RLS deliberately delegates to app logic
 * (issue_updates writes, admin analytics, signed URL generation).
 */
export function createSupabaseAdminClient() {
  const env = getServerEnv();
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
