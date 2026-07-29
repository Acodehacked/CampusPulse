import Link from "next/link";
import { MapPin, MessageSquareText } from "lucide-react";
import { CategoryBadge, PriorityBadge, StatusBadge } from "@/components/features/issues/issue-badges";
import { formatRelativeTime } from "@/lib/format";
import type { IssueSummary } from "@/types/issue";

export function IssueCard({ issue }: { issue: IssueSummary }) {
  return (
    <Link
      href={`/issues/${issue.id}`}
      className="group block rounded-lg border bg-card p-4 transition-colors hover:border-foreground/20 hover:bg-accent/40"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-medium leading-snug group-hover:underline">{issue.title}</h3>
        <PriorityBadge priority={issue.priority} />
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <CategoryBadge category={issue.category} />
        <StatusBadge status={issue.status} />
        <span className="inline-flex items-center gap-1">
          <MapPin className="size-3.5" />
          {issue.location}
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between text-sm text-muted-foreground">
        <span>{issue.reporter?.displayName ?? "Unknown reporter"}</span>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1">
            <MessageSquareText className="size-3.5" />
            {issue.confirmationCount}
          </span>
          <time dateTime={issue.createdAt}>{formatRelativeTime(issue.createdAt)}</time>
        </div>
      </div>
    </Link>
  );
}
