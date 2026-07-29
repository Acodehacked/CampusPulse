import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { AppError } from "@/server/lib/app-error";

type Client = SupabaseClient<Database>;

const UNIQUE_VIOLATION = "23505";

/**
 * The database's UNIQUE(issue_id, user_id) constraint is the real guarantee
 * here (see 0003_confirmations.sql) — this catch is just what turns a
 * constraint violation into a clean 409 instead of a raw Postgres error.
 */
export async function confirmIssue(supabase: Client, issueId: string, userId: string): Promise<{ confirmationCount: number }> {
  const { error } = await supabase.from("issue_confirmations").insert({ issue_id: issueId, user_id: userId });

  if (error) {
    if (error.code === UNIQUE_VIOLATION) {
      throw AppError.conflict("You've already confirmed this issue");
    }
    throw error;
  }

  return { confirmationCount: await getConfirmationCount(supabase, issueId) };
}

export async function unconfirmIssue(supabase: Client, issueId: string, userId: string): Promise<{ confirmationCount: number }> {
  const { data, error } = await supabase
    .from("issue_confirmations")
    .delete()
    .eq("issue_id", issueId)
    .eq("user_id", userId)
    .select("id");

  if (error) throw error;
  if (!data || data.length === 0) {
    throw AppError.notFound("You haven't confirmed this issue");
  }

  return { confirmationCount: await getConfirmationCount(supabase, issueId) };
}

async function getConfirmationCount(supabase: Client, issueId: string): Promise<number> {
  const { count, error } = await supabase
    .from("issue_confirmations")
    .select("*", { count: "exact", head: true })
    .eq("issue_id", issueId);
  if (error) throw error;
  return count ?? 0;
}
