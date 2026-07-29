/**
 * Scripted rehearsal of the PRD's demo flow: student signs in, creates an
 * issue, a second student confirms it, an admin verifies/progresses/resolves
 * it, and the timeline reflects every step. Run against a seeded local
 * instance (`npm run db:seed` first) with the dev server running.
 *
 * Usage: npm run smoke   (defaults to http://localhost:3000)
 */
import { createClient } from "@supabase/supabase-js";
import { DEMO_USERS, SEED_PASSWORD } from "./demo-users";

process.loadEnvFile?.(".env.local");

const BASE_URL = process.env.SMOKE_BASE_URL ?? "http://localhost:3000";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !PUBLISHABLE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY. Aborting smoke test.");
  process.exit(1);
}

const [student1, student2, , adminUser] = DEMO_USERS;

async function getAccessToken(email: string): Promise<string> {
  const client = createClient(SUPABASE_URL!, PUBLISHABLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data, error } = await client.auth.signInWithPassword({ email, password: SEED_PASSWORD });
  if (error || !data.session) {
    throw new Error(`Failed to sign in as ${email}: ${error?.message ?? "no session"}`);
  }
  return data.session.access_token;
}

async function api(token: string, path: string, init: RequestInit = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: { ...init.headers, Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  });
  const body = await res.json();
  if (!res.ok) {
    throw new Error(`${init.method ?? "GET"} ${path} -> ${res.status}: ${JSON.stringify(body)}`);
  }
  return body.data;
}

function step(label: string) {
  console.log(`\n[smoke] ${label}`);
}

async function main() {
  step(`Signing in as student "${student1.displayName}"`);
  const student1Token = await getAccessToken(student1.email);

  step("Creating an issue");
  const issue = await api(student1Token, "/api/issues", {
    method: "POST",
    body: JSON.stringify({
      title: "Smoke test: flickering lights in seminar hall",
      description: "The overhead lights in the seminar hall keep flickering during evening classes.",
      category: "infrastructure",
      location: "Seminar Hall",
    }),
  });
  console.log(`  created issue ${issue.id}`);

  step(`Signing in as student "${student2.displayName}" and confirming the issue`);
  const student2Token = await getAccessToken(student2.email);
  const confirmed = await api(student2Token, `/api/issues/${issue.id}/confirm`, { method: "POST" });
  if (confirmed.confirmationCount !== 1) {
    throw new Error(`Expected confirmationCount 1, got ${confirmed.confirmationCount}`);
  }
  console.log(`  confirmation count is now ${confirmed.confirmationCount}`);

  step(`Signing in as admin "${adminUser.displayName}"`);
  const adminToken = await getAccessToken(adminUser.email);

  step("Verifying the issue");
  await api(adminToken, `/api/admin/issues/${issue.id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status: "verified" }),
  });

  step("Moving the issue to in_progress");
  await api(adminToken, `/api/admin/issues/${issue.id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status: "in_progress", message: "Electrician scheduled for tomorrow." }),
  });

  step("Resolving the issue");
  const resolved = await api(adminToken, `/api/admin/issues/${issue.id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status: "resolved", message: "Faulty ballast replaced, confirmed fixed." }),
  });
  if (resolved.status !== "resolved" || !resolved.resolvedAt) {
    throw new Error("Expected issue to be resolved with a resolvedAt timestamp");
  }

  step("Verifying the activity timeline reflects every step");
  const finalIssue = await api(student1Token, `/api/issues/${issue.id}`);
  const eventTypes = finalIssue.timeline.map((t: { eventType: string }) => t.eventType);
  const expected = ["issue_created", "status_changed", "status_changed", "issue_resolved"];
  if (JSON.stringify(eventTypes) !== JSON.stringify(expected)) {
    throw new Error(`Unexpected timeline: ${JSON.stringify(eventTypes)}`);
  }
  console.log(`  timeline: ${eventTypes.join(" -> ")}`);

  console.log("\n[smoke] All steps passed.");
}

main().catch((error) => {
  console.error("\n[smoke] FAILED:", error.message);
  process.exit(1);
});
