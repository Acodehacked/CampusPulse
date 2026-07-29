import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import type { AuthVariables } from "@/server/middleware/auth";
import { requireAdmin } from "@/server/middleware/auth";
import { ok } from "@/server/lib/response";
import { issueIdParamSchema } from "@/schemas/issues";
import { adminStatusUpdateSchema, adminPriorityUpdateSchema, adminNoteSchema } from "@/schemas/admin";
import * as adminService from "@/server/services/admin-service";
import { getAdminAnalytics } from "@/server/services/analytics-service";

export const adminRoute = new Hono<{ Variables: AuthVariables }>()
  .use("*", requireAdmin)

  .patch(
    "/issues/:id/status",
    zValidator("param", issueIdParamSchema),
    zValidator("json", adminStatusUpdateSchema),
    async (c) => {
      const supabase = c.get("supabase");
      const profile = c.get("profile")!;
      const { id } = c.req.valid("param");
      const input = c.req.valid("json");
      const issue = await adminService.changeIssueStatus(supabase, id, profile.id, input);
      return c.json(ok(issue));
    },
  )

  .patch(
    "/issues/:id/priority",
    zValidator("param", issueIdParamSchema),
    zValidator("json", adminPriorityUpdateSchema),
    async (c) => {
      const supabase = c.get("supabase");
      const profile = c.get("profile")!;
      const { id } = c.req.valid("param");
      const input = c.req.valid("json");
      const issue = await adminService.changeIssuePriority(supabase, id, profile.id, input);
      return c.json(ok(issue));
    },
  )

  .post(
    "/issues/:id/updates",
    zValidator("param", issueIdParamSchema),
    zValidator("json", adminNoteSchema),
    async (c) => {
      const supabase = c.get("supabase");
      const profile = c.get("profile")!;
      const { id } = c.req.valid("param");
      const input = c.req.valid("json");
      const issue = await adminService.addAdminNote(supabase, id, profile.id, input);
      return c.json(ok(issue), 201);
    },
  )

  .get("/analytics", async (c) => {
    const analytics = await getAdminAnalytics();
    return c.json(ok(analytics));
  });
