/**
 * Creates demo data for local development.
 *
 * Real `auth.users` rows can only be safely created through Supabase's Admin
 * API (not plain SQL), so this script uses the service-role client instead
 * of a seed.sql file. profiles rows appear automatically via the
 * handle_new_user trigger (0001_enums_and_profiles.sql) — role is derived
 * from each seeded email's shape, exactly as it would be for a real signup.
 *
 * Usage: npm run db:seed   (after `supabase start` + `npm run db:reset`)
 */
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { DEMO_USERS, SEED_PASSWORD } from "./demo-users";

process.loadEnvFile?.(".env.local");

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SECRET_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY in .env.local. Aborting seed.");
  process.exit(1);
}

const admin = createClient<Database>(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function createDemoUser(email: string, displayName: string): Promise<string> {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: SEED_PASSWORD,
    email_confirm: true,
    user_metadata: { display_name: displayName },
  });

  if (error) {
    if (error.message.toLowerCase().includes("already been registered")) {
      const { data: existing } = await admin.auth.admin.listUsers();
      const found = existing.users.find((u) => u.email === email);
      if (found) return found.id;
    }
    throw error;
  }

  return data.user.id;
}

async function main() {
  console.log("Seeding demo users...");
  const [priyaEmail, arjunEmail, fathimaEmail, adminEmail] = DEMO_USERS;
  const [priya, arjun, fathima, adminUser] = await Promise.all([
    createDemoUser(priyaEmail.email, priyaEmail.displayName),
    createDemoUser(arjunEmail.email, arjunEmail.displayName),
    createDemoUser(fathimaEmail.email, fathimaEmail.displayName),
    createDemoUser(adminEmail.email, adminEmail.displayName),
  ]);

  console.log("Seeding issues...");
  const issuesToCreate = [
    {
      title: "Wi-Fi down across Block C hostel",
      description: "No internet connectivity since last night in the entire Block C hostel building.",
      category: "network" as const,
      location: "Block C Hostel",
      priority: "critical" as const,
      status: "in_progress" as const,
      created_by: priya,
    },
    {
      title: "Projector not turning on in room 204",
      description: "The ceiling projector in room 204 doesn't power on, tried the remote and wall switch.",
      category: "hardware" as const,
      location: "Main Block, Room 204",
      priority: "medium" as const,
      status: "verified" as const,
      created_by: arjun,
    },
    {
      title: "Library portal login broken",
      description: "The library's online catalog login just spins and never signs in, on every browser tried.",
      category: "software" as const,
      location: "Central Library",
      priority: "high" as const,
      status: "reported" as const,
      created_by: fathima,
    },
    {
      title: "Broken tiles near canteen entrance",
      description: "Several cracked floor tiles right at the canteen entrance are a trip hazard, especially in rain.",
      category: "infrastructure" as const,
      location: "Canteen Entrance",
      priority: "medium" as const,
      status: "resolved" as const,
      created_by: priya,
    },
    {
      title: "Water cooler leaking on 3rd floor",
      description: "The water cooler outside the CS department office has been leaking steadily for two days.",
      category: "infrastructure" as const,
      location: "CS Department, 3rd floor",
      priority: "low" as const,
      status: "reported" as const,
      created_by: arjun,
    },
    {
      title: "Lecture hall AC blowing warm air",
      description: "The AC in the main lecture hall only blows warm air, makes afternoon classes unbearable.",
      category: "other" as const,
      location: "Main Lecture Hall",
      priority: "high" as const,
      status: "in_progress" as const,
      created_by: fathima,
    },
    {
      title: "Duplicate printer queue jam in admin block",
      description: "The shared printer in the admin block keeps jamming and duplicating print jobs.",
      category: "hardware" as const,
      location: "Admin Block",
      priority: "low" as const,
      status: "rejected" as const,
      created_by: priya,
    },
  ];

  const { data: createdIssues, error: issuesError } = await admin
    .from("issues")
    .insert(issuesToCreate)
    .select("id, title, status, created_by");
  if (issuesError) throw issuesError;

  console.log("Seeding confirmations...");
  const confirmationRows = [];
  for (const issue of createdIssues) {
    for (const userId of [priya, arjun, fathima]) {
      if (userId !== issue.created_by) {
        confirmationRows.push({ issue_id: issue.id, user_id: userId });
      }
    }
  }
  // A couple of issues get fewer confirmations for a realistic spread.
  const trimmed = confirmationRows.filter((_, i) => i % 3 !== 0);
  const { error: confirmError } = await admin.from("issue_confirmations").insert(trimmed);
  if (confirmError) throw confirmError;

  console.log("Seeding extra activity timeline entries...");
  const resolvedIssue = createdIssues.find((i) => i.status === "resolved");
  const inProgressIssues = createdIssues.filter((i) => i.status === "in_progress");

  const updates = [];
  if (resolvedIssue) {
    updates.push({
      issue_id: resolvedIssue.id,
      actor_id: adminUser,
      event_type: "admin_note_added" as const,
      message: "Facilities team retiled the entrance this morning. Confirmed fixed on-site.",
    });
  }
  for (const issue of inProgressIssues) {
    updates.push({
      issue_id: issue.id,
      actor_id: adminUser,
      event_type: "admin_note_added" as const,
      message: "Assigned to the maintenance team, checking on it today.",
    });
  }
  if (updates.length > 0) {
    const { error: updatesError } = await admin.from("issue_updates").insert(updates);
    if (updatesError) throw updatesError;
  }

  console.log("\nSeed complete.");
  console.log(`Demo password for all seeded accounts: ${SEED_PASSWORD}`);
  console.log("Demo accounts:");
  for (const u of DEMO_USERS) console.log(`  - ${u.email}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
