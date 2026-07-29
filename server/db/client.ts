import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { getServerEnv } from "@/lib/env.server";
import * as schema from "@/server/db/schema";

/**
 * Server-only Drizzle client on a direct Postgres connection (service-role
 * privileges — RLS does not apply here). Reserved for admin analytics and
 * other multi-join reads that don't carry per-row authorization semantics;
 * anything where row ownership matters goes through the Supabase client
 * instead (see server/supabase/server.ts).
 */
let cached: ReturnType<typeof drizzle<typeof schema>> | undefined;

export function getDb() {
  if (cached) return cached;
  const env = getServerEnv();
  const client = postgres(env.SUPABASE_DB_URL, { prepare: false });
  cached = drizzle(client, { schema });
  return cached;
}
