import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { AdminStatusUpdateInput, AdminPriorityUpdateInput, AdminNoteInput } from "@/schemas/admin";
import { AppError } from "@/server/lib/app-error";
import { isValidIssueStatusTransition } from "@/constants/status-transitions";
import { createSupabaseAdminClient } from "@/server/supabase/admin";
import * as issuesRepo from "@/server/repositories/issues.repo";
import { getIssueDetail } from "@/server/services/issue-service";

type Client = SupabaseClient<Database>;

/**
 * The issues.status/priority mutation itself goes through the caller's
 * user-scoped Supabase client, so RLS's issues_update_admin_only policy is
 * the real enforcement (defense in depth alongside the Hono requireAdmin
 * check). issue_updates has no authenticated write policy at all (0006), so
 * the timeline entry is written with the service-role client afterward.
 */
export async function changeIssueStatus(supabase: Client, issueId: string, actorId: string, input: AdminStatusUpdateInput) {
  const issue = await issuesRepo.getIssueById(supabase, issueId);
  if (!issue) throw AppError.notFound("Issue not found");

  if (issue.status !== input.status && !isValidIssueStatusTransition(issue.status, input.status)) {
    throw AppError.validation(`Cannot change status from ${issue.status} to ${input.status}`);
  }

  const { error } = await supabase.from("issues").update({ status: input.status }).eq("id", issueId);
  if (error) throw error;

  const eventType =
    input.status === "resolved" ? "issue_resolved" : issue.status === "resolved" ? "issue_reopened" : "status_changed";

  const admin = createSupabaseAdminClient();
  const { error: logError } = await admin.from("issue_updates").insert({
    issue_id: issueId,
    actor_id: actorId,
    event_type: eventType,
    old_value: { status: issue.status },
    new_value: { status: input.status },
    message: input.message ?? null,
  });
  if (logError) throw logError;

  return getIssueDetail(supabase, issueId, actorId);
}

export async function changeIssuePriority(supabase: Client, issueId: string, actorId: string, input: AdminPriorityUpdateInput) {
  const issue = await issuesRepo.getIssueById(supabase, issueId);
  if (!issue) throw AppError.notFound("Issue not found");

  const { error } = await supabase.from("issues").update({ priority: input.priority }).eq("id", issueId);
  if (error) throw error;

  const admin = createSupabaseAdminClient();
  const { error: logError } = await admin.from("issue_updates").insert({
    issue_id: issueId,
    actor_id: actorId,
    event_type: "priority_changed",
    old_value: { priority: issue.priority },
    new_value: { priority: input.priority },
  });
  if (logError) throw logError;

  return getIssueDetail(supabase, issueId, actorId);
}

export async function addAdminNote(supabase: Client, issueId: string, actorId: string, input: AdminNoteInput) {
  const issue = await issuesRepo.getIssueById(supabase, issueId);
  if (!issue) throw AppError.notFound("Issue not found");

  const admin = createSupabaseAdminClient();
  const { error } = await admin.from("issue_updates").insert({
    issue_id: issueId,
    actor_id: actorId,
    event_type: "admin_note_added",
    message: input.message,
  });
  if (error) throw error;

  return getIssueDetail(supabase, issueId, actorId);
}
