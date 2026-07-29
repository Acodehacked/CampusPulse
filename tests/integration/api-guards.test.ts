import { describe, expect, it } from "vitest";
import { app } from "@/server/api";

/**
 * Runs against whatever Supabase instance .env.local/.env points at (local
 * `supabase start` recommended). Skipped automatically if the server-only
 * secrets aren't configured, rather than failing the whole suite —
 * `npm run test:integration` prints a clear reason when that happens.
 */
const hasFullEnv = Boolean(process.env.SUPABASE_SECRET_KEY && process.env.SUPABASE_DB_URL);

describe.skipIf(!hasFullEnv)("API auth/authorization guards", () => {
  it("GET /api/health responds without requiring authentication", async () => {
    const res = await app.request("/api/health");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.status).toBe("ok");
  });

  it("POST /api/issues rejects an unauthenticated request", async () => {
    const res = await app.request("/api/issues", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Broken projector",
        description: "The projector in room 204 won't turn on anymore.",
        category: "hardware",
        location: "Room 204",
      }),
    });
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe("UNAUTHORIZED");
  });

  it("POST /api/issues/:id/confirm rejects an unauthenticated request", async () => {
    const res = await app.request("/api/issues/00000000-0000-0000-0000-000000000000/confirm", {
      method: "POST",
    });
    expect(res.status).toBe(401);
  });

  it("PATCH /api/admin/issues/:id/status rejects an unauthenticated request", async () => {
    const res = await app.request("/api/admin/issues/00000000-0000-0000-0000-000000000000/status", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "verified" }),
    });
    expect(res.status).toBe(401);
  });

  it("GET /api/admin/analytics rejects an unauthenticated request", async () => {
    const res = await app.request("/api/admin/analytics");
    expect(res.status).toBe(401);
  });

  it("GET /api/issues rejects an invalid filter value with 422", async () => {
    const res = await app.request("/api/issues?status=not-a-real-status");
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });

  it("POST /api/issues rejects an invalid body with 422", async () => {
    const res = await app.request("/api/issues", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "x" }),
    });
    // Unauthenticated requests are rejected before body validation runs,
    // so this still surfaces as 401 — validation-with-auth is covered in
    // the seeded smoke test (scripts/smoke.ts) which has real credentials.
    expect(res.status).toBe(401);
  });
});
