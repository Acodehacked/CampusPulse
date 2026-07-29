import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { IssueCreateInput, IssueFiltersInput, MeIssuesQueryInput } from "@/schemas/issues";
import type { IssueDetail, IssueSummary, PaginationMeta } from "@/types/issue";
import { AppError } from "@/server/lib/app-error";
import * as issuesRepo from "@/server/repositories/issues.repo";
import { getSignedAttachmentUrl } from "@/server/services/attachment-service";

type Client = SupabaseClient<Database>;
type IssueRow = Database["public"]["Tables"]["issues"]["Row"];

function toPaginationMeta(page: number, pageSize: number, total: number): PaginationMeta {
  return { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}

async function toSummaries(
  supabase: Client,
  rows: IssueRow[],
): Promise<IssueSummary[]> {
  const issueIds = rows.map((r) => r.id);
  const creatorIds = [...new Set(rows.map((r) => r.created_by))];

  const [counts, reporters] = await Promise.all([
    issuesRepo.countConfirmationsForIssues(supabase, issueIds),
    issuesRepo.getProfilesByIds(supabase, creatorIds),
  ]);

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    category: row.category,
    location: row.location,
    priority: row.priority,
    status: row.status,
    createdAt: row.created_at,
    confirmationCount: counts[row.id] ?? 0,
    reporter: reporters[row.created_by] ?? null,
  }));
}

export async function listIssuesFeed(supabase: Client, filters: IssueFiltersInput) {
  const { issues, total } = await issuesRepo.listIssues(supabase, filters);
  const summaries = await toSummaries(supabase, issues);
  return { issues: summaries, meta: toPaginationMeta(filters.page, filters.pageSize, total) };
}

export async function getIssueDetail(supabase: Client, id: string, currentUserId: string | null): Promise<IssueDetail> {
  const issue = await issuesRepo.getIssueById(supabase, id);
  if (!issue) throw AppError.notFound("Issue not found");

  const [confirmationCount, reporter, isConfirmedByMe, attachmentRows, timelineRows] = await Promise.all([
    issuesRepo.countConfirmationsForIssue(supabase, id),
    issuesRepo.getProfilesByIds(supabase, [issue.created_by]).then((m) => m[issue.created_by] ?? null),
    currentUserId ? issuesRepo.isConfirmedByUser(supabase, id, currentUserId) : Promise.resolve(false),
    issuesRepo.getAttachmentsForIssue(supabase, id),
    issuesRepo.getTimelineForIssue(supabase, id),
  ]);

  const actorIds = [...new Set(timelineRows.map((t) => t.actor_id).filter((v): v is string => v !== null))];
  const actors = await issuesRepo.getProfilesByIds(supabase, actorIds);

  const attachments = await Promise.all(
    attachmentRows.map(async (a) => ({
      id: a.id,
      storagePath: a.storage_path,
      mimeType: a.mime_type,
      signedUrl: await getSignedAttachmentUrl(a.storage_path),
    })),
  );

  return {
    id: issue.id,
    title: issue.title,
    description: issue.description,
    category: issue.category,
    location: issue.location,
    priority: issue.priority,
    status: issue.status,
    createdAt: issue.created_at,
    updatedAt: issue.updated_at,
    resolvedAt: issue.resolved_at,
    confirmationCount,
    reporter,
    isConfirmedByMe,
    attachments,
    timeline: timelineRows.map((t) => ({
      id: t.id,
      eventType: t.event_type,
      message: t.message,
      oldValue: t.old_value,
      newValue: t.new_value,
      createdAt: t.created_at,
      actor: t.actor_id ? (actors[t.actor_id] ?? null) : null,
    })),
  };
}

export async function createIssue(supabase: Client, input: IssueCreateInput, userId: string) {
  const created = await issuesRepo.createIssue(supabase, input, userId);
  return getIssueDetail(supabase, created.id, userId);
}

export async function listMyIssues(supabase: Client, userId: string, query: MeIssuesQueryInput) {
  const { issues, total } =
    query.type === "reported"
      ? await issuesRepo.listIssuesByReporter(supabase, userId, query.status, query.page, query.pageSize)
      : await issuesRepo.listIssuesConfirmedByUser(supabase, userId, query.status, query.page, query.pageSize);

  const summaries = await toSummaries(supabase, issues);
  return { issues: summaries, meta: toPaginationMeta(query.page, query.pageSize, total) };
}
