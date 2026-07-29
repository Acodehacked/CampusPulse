import type { IssueCategory, IssuePriority, IssueStatus, IssueUpdateEventType } from "@/constants/issues";

export type IssueSummary = {
  id: string;
  title: string;
  category: IssueCategory;
  location: string;
  priority: IssuePriority;
  status: IssueStatus;
  createdAt: string;
  confirmationCount: number;
  reporter: { id: string; displayName: string } | null;
};

export type IssueDetail = IssueSummary & {
  description: string;
  updatedAt: string;
  resolvedAt: string | null;
  isConfirmedByMe: boolean;
  attachments: { id: string; storagePath: string; signedUrl: string | null; mimeType: string }[];
  timeline: {
    id: string;
    eventType: IssueUpdateEventType;
    message: string | null;
    oldValue: unknown;
    newValue: unknown;
    createdAt: string;
    actor: { id: string; displayName: string } | null;
  }[];
};

export type PaginationMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};
