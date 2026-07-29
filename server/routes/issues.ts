import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import type { AuthVariables } from "@/server/middleware/auth";
import { requireAuth, requireAdmin } from "@/server/middleware/auth";
import { ok } from "@/server/lib/response";
import {
  issueCreateSchema,
  issueFiltersSchema,
  issueIdParamSchema,
  issueCorrectionSchema,
  meIssuesQuerySchema,
} from "@/schemas/issues";
import * as issueService from "@/server/services/issue-service";
import * as issuesRepo from "@/server/repositories/issues.repo";
import * as confirmationService from "@/server/services/confirmation-service";
import { uploadAttachment } from "@/server/services/attachment-service";
import { AppError } from "@/server/lib/app-error";

export const issuesRoute = new Hono<{ Variables: AuthVariables }>()
  .get("/", zValidator("query", issueFiltersSchema), async (c) => {
    const supabase = c.get("supabase");
    const filters = c.req.valid("query");
    const result = await issueService.listIssuesFeed(supabase, filters);
    return c.json(ok(result.issues, result.meta));
  })

  .post("/", requireAuth, zValidator("json", issueCreateSchema), async (c) => {
    const supabase = c.get("supabase");
    const profile = c.get("profile")!;
    const input = c.req.valid("json");
    const created = await issueService.createIssue(supabase, input, profile.id);
    return c.json(ok(created), 201);
  })

  .get("/:id", zValidator("param", issueIdParamSchema), async (c) => {
    const supabase = c.get("supabase");
    const user = c.get("user");
    const { id } = c.req.valid("param");
    const issue = await issueService.getIssueDetail(supabase, id, user?.id ?? null);
    return c.json(ok(issue));
  })

  .patch(
    "/:id",
    requireAdmin,
    zValidator("param", issueIdParamSchema),
    zValidator("json", issueCorrectionSchema),
    async (c) => {
      const supabase = c.get("supabase");
      const { id } = c.req.valid("param");
      const fields = c.req.valid("json");
      await issuesRepo.updateIssueFields(supabase, id, fields);
      const issue = await issueService.getIssueDetail(supabase, id, c.get("user")?.id ?? null);
      return c.json(ok(issue));
    },
  )

  .post("/:id/confirm", requireAuth, zValidator("param", issueIdParamSchema), async (c) => {
    const supabase = c.get("supabase");
    const profile = c.get("profile")!;
    const { id } = c.req.valid("param");
    const result = await confirmationService.confirmIssue(supabase, id, profile.id);
    return c.json(ok(result), 201);
  })

  .delete("/:id/confirm", requireAuth, zValidator("param", issueIdParamSchema), async (c) => {
    const supabase = c.get("supabase");
    const profile = c.get("profile")!;
    const { id } = c.req.valid("param");
    const result = await confirmationService.unconfirmIssue(supabase, id, profile.id);
    return c.json(ok(result));
  })

  .post("/:id/attachments", requireAuth, zValidator("param", issueIdParamSchema), async (c) => {
    const supabase = c.get("supabase");
    const profile = c.get("profile")!;
    const { id } = c.req.valid("param");

    const body = await c.req.parseBody();
    const file = body.file;
    if (!(file instanceof File)) {
      throw AppError.validation("An image file is required");
    }

    const attachment = await uploadAttachment(supabase, id, profile.id, file);
    return c.json(ok(attachment), 201);
  });

export const meIssuesRoute = new Hono<{ Variables: AuthVariables }>().get(
  "/",
  requireAuth,
  zValidator("query", meIssuesQuerySchema),
  async (c) => {
    const supabase = c.get("supabase");
    const profile = c.get("profile")!;
    const query = c.req.valid("query");
    const result = await issueService.listMyIssues(supabase, profile.id, query);
    return c.json(ok(result.issues, result.meta));
  },
);

