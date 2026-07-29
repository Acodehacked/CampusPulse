import type { IssueStatus } from "@/constants/issues";

/**
 * Allowed issue status transitions. Kept in sync with
 * is_valid_issue_status_transition() in supabase/migrations/0007_functions_and_triggers.sql,
 * which enforces the same rules at the database level as a backstop —
 * update both if this ever changes.
 */
export const ISSUE_STATUS_TRANSITIONS: Record<IssueStatus, readonly IssueStatus[]> = {
  reported: ["verified", "rejected"],
  verified: ["in_progress", "rejected"],
  in_progress: ["resolved", "rejected"],
  resolved: ["in_progress"],
  rejected: ["reported"],
};

export function isValidIssueStatusTransition(from: IssueStatus, to: IssueStatus): boolean {
  if (from === to) return true;
  return ISSUE_STATUS_TRANSITIONS[from].includes(to);
}
