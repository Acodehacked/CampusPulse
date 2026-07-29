export const ISSUE_CATEGORIES = ["network", "hardware", "software", "infrastructure", "other"] as const;
export type IssueCategory = (typeof ISSUE_CATEGORIES)[number];

export const ISSUE_PRIORITIES = ["low", "medium", "high", "critical"] as const;
export type IssuePriority = (typeof ISSUE_PRIORITIES)[number];

export const ISSUE_STATUSES = ["reported", "verified", "in_progress", "resolved", "rejected"] as const;
export type IssueStatus = (typeof ISSUE_STATUSES)[number];

export const ISSUE_UPDATE_EVENT_TYPES = [
  "issue_created",
  "status_changed",
  "priority_changed",
  "admin_note_added",
  "issue_resolved",
  "issue_reopened",
] as const;
export type IssueUpdateEventType = (typeof ISSUE_UPDATE_EVENT_TYPES)[number];

export const CATEGORY_LABELS: Record<IssueCategory, string> = {
  network: "Network",
  hardware: "Hardware",
  software: "Software",
  infrastructure: "Infrastructure",
  other: "Other",
};

export const PRIORITY_LABELS: Record<IssuePriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

export const STATUS_LABELS: Record<IssueStatus, string> = {
  reported: "Reported",
  verified: "Verified",
  in_progress: "In Progress",
  resolved: "Resolved",
  rejected: "Rejected",
};
