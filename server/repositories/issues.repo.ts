import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { IssueFiltersInput, IssueCreateInput } from "@/schemas/issues";

type Client = SupabaseClient<Database>;
type IssueRow = Database["public"]["Tables"]["issues"]["Row"];

export async function listIssues(supabase: Client, filters: IssueFiltersInput) {
  let query = supabase.from("issues").select("*", { count: "exact" });

  if (filters.status) query = query.eq("status", filters.status);
  if (filters.category) query = query.eq("category", filters.category);
  if (filters.priority) query = query.eq("priority", filters.priority);
  if (filters.location) query = query.ilike("location", `%${filters.location}%`);
  if (filters.q) query = query.textSearch("search_vector", filters.q, { type: "websearch", config: "english" });

  const from = (filters.page - 1) * filters.pageSize;
  const to = from + filters.pageSize - 1;

  const { data, error, count } = await query.order("created_at", { ascending: false }).range(from, to);
  if (error) throw error;

  return { issues: data ?? [], total: count ?? 0 };
}

export async function getIssueById(supabase: Client, id: string): Promise<IssueRow | null> {
  const { data, error } = await supabase.from("issues").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function createIssue(supabase: Client, input: IssueCreateInput, createdBy: string): Promise<IssueRow> {
  const { data, error } = await supabase
    .from("issues")
    .insert({ ...input, created_by: createdBy })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function updateIssueFields(
  supabase: Client,
  id: string,
  fields: Partial<Pick<IssueRow, "title" | "description" | "category" | "location">>,
): Promise<IssueRow> {
  const { data, error } = await supabase.from("issues").update(fields).eq("id", id).select("*").single();
  if (error) throw error;
  return data;
}

/** Batched tally for a page of issues — avoids N+1 by fetching all relevant confirmation rows in one query. */
export async function countConfirmationsForIssues(supabase: Client, issueIds: string[]): Promise<Record<string, number>> {
  if (issueIds.length === 0) return {};
  const { data, error } = await supabase.from("issue_confirmations").select("issue_id").in("issue_id", issueIds);
  if (error) throw error;

  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    counts[row.issue_id] = (counts[row.issue_id] ?? 0) + 1;
  }
  return counts;
}

export async function countConfirmationsForIssue(supabase: Client, issueId: string): Promise<number> {
  const { count, error } = await supabase
    .from("issue_confirmations")
    .select("*", { count: "exact", head: true })
    .eq("issue_id", issueId);
  if (error) throw error;
  return count ?? 0;
}

export async function getProfilesByIds(
  supabase: Client,
  ids: string[],
): Promise<Record<string, { id: string; displayName: string }>> {
  if (ids.length === 0) return {};
  const { data, error } = await supabase.from("profiles").select("id, display_name").in("id", ids);
  if (error) throw error;

  const map: Record<string, { id: string; displayName: string }> = {};
  for (const row of data ?? []) {
    map[row.id] = { id: row.id, displayName: row.display_name };
  }
  return map;
}

export async function isConfirmedByUser(supabase: Client, issueId: string, userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("issue_confirmations")
    .select("id")
    .eq("issue_id", issueId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data !== null;
}

export async function getAttachmentsForIssue(supabase: Client, issueId: string) {
  const { data, error } = await supabase
    .from("attachments")
    .select("id, storage_path, mime_type")
    .eq("issue_id", issueId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getTimelineForIssue(supabase: Client, issueId: string) {
  const { data, error } = await supabase
    .from("issue_updates")
    .select("id, event_type, message, old_value, new_value, created_at, actor_id")
    .eq("issue_id", issueId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function listIssuesByReporter(supabase: Client, userId: string, status: IssueRow["status"] | undefined, page: number, pageSize: number) {
  let query = supabase.from("issues").select("*", { count: "exact" }).eq("created_by", userId);
  if (status) query = query.eq("status", status);

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const { data, error, count } = await query.order("created_at", { ascending: false }).range(from, to);
  if (error) throw error;
  return { issues: data ?? [], total: count ?? 0 };
}

export async function listIssuesConfirmedByUser(
  supabase: Client,
  userId: string,
  status: IssueRow["status"] | undefined,
  page: number,
  pageSize: number,
) {
  const { data: confirmationRows, error: confirmationError } = await supabase
    .from("issue_confirmations")
    .select("issue_id")
    .eq("user_id", userId);
  if (confirmationError) throw confirmationError;

  const issueIds = (confirmationRows ?? []).map((r) => r.issue_id);
  if (issueIds.length === 0) return { issues: [] as IssueRow[], total: 0 };

  let query = supabase.from("issues").select("*", { count: "exact" }).in("id", issueIds);
  if (status) query = query.eq("status", status);

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const { data, error, count } = await query.order("created_at", { ascending: false }).range(from, to);
  if (error) throw error;
  return { issues: data ?? [], total: count ?? 0 };
}
