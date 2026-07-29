import { z } from "zod";

/**
 * Server-only environment. Importing this file from a client component
 * would fail at build time since these values are never inlined by Next.js
 * (they lack the NEXT_PUBLIC_ prefix), which is the point.
 */
const serverEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  SUPABASE_SECRET_KEY: z.string().min(1),
  SUPABASE_DB_URL: z.string().min(1),
  ALLOWED_ORIGIN: z.string().url().optional(),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

let cached: ServerEnv | undefined;

/** Validates required server env vars on first access; throws with a clear message if misconfigured. */
export function getServerEnv(): ServerEnv {
  if (cached) return cached;

  const parsed = serverEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new Error(
      `Invalid or missing server environment variables:\n${issues}\n\nCheck your .env file against .env.example.`,
    );
  }

  cached = parsed.data;
  return cached;
}
