import postgres from "postgres";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

process.loadEnvFile(".env.local");

const dbUrl = process.env.SUPABASE_DB_URL;
if (!dbUrl) {
  console.error("SUPABASE_DB_URL not set");
  process.exit(1);
}

// Manual parse instead of `new URL()`: the password can contain characters
// (e.g. `#`) that aren't valid unencoded in a URL's userinfo section.
const match = dbUrl.match(/^postgresql:\/\/([^:]+):(.+)@([^@:]+):(\d+)\/(.+)$/);
if (!match) {
  console.error("Could not parse SUPABASE_DB_URL");
  process.exit(1);
}
const [, username, password, host, port, database] = match;

const sql = postgres({
  host,
  port: Number(port),
  database,
  username,
  password,
  ssl: "require",
});

const dir = path.join(process.cwd(), "supabase", "migrations");
const files = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();

for (const file of files) {
  console.log(`Applying ${file}...`);
  const content = readFileSync(path.join(dir, file), "utf8");
  await sql.unsafe(content);
  console.log(`  done`);
}

await sql.end();
console.log("All migrations applied.");
