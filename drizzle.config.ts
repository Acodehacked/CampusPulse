import type { Config } from "drizzle-kit";

/**
 * Used only for `drizzle-kit studio` (browsing data) during development.
 * Never run `drizzle-kit generate`/`migrate`/`push` in this project —
 * supabase/migrations/*.sql is the single source of schema truth.
 */
export default {
  schema: "./server/db/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.SUPABASE_DB_URL ?? "",
  },
} satisfies Config;
