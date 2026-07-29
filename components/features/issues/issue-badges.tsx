import { Badge } from "@/components/ui/badge";
import { CATEGORY_LABELS, PRIORITY_LABELS, STATUS_LABELS } from "@/constants/issues";
import type { IssueCategory, IssuePriority, IssueStatus } from "@/constants/issues";
import { cn } from "@/lib/utils";

const PRIORITY_STYLES: Record<IssuePriority, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  high: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  critical: "bg-red-500/10 text-red-600 dark:text-red-400",
};

const STATUS_STYLES: Record<IssueStatus, string> = {
  reported: "bg-muted text-muted-foreground",
  verified: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  in_progress: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  resolved: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  rejected: "bg-red-500/10 text-red-600 dark:text-red-400",
};

export function PriorityBadge({ priority }: { priority: IssuePriority }) {
  return (
    <Badge variant="secondary" className={cn("font-medium", PRIORITY_STYLES[priority])}>
      {PRIORITY_LABELS[priority]}
    </Badge>
  );
}

export function StatusBadge({ status }: { status: IssueStatus }) {
  return (
    <Badge variant="secondary" className={cn("font-medium", STATUS_STYLES[status])}>
      {STATUS_LABELS[status]}
    </Badge>
  );
}

export function CategoryBadge({ category }: { category: IssueCategory }) {
  return <Badge variant="outline">{CATEGORY_LABELS[category]}</Badge>;
}
