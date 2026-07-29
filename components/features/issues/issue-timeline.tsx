import { CheckCircle2, FileEdit, MessageSquare, PlusCircle, RotateCcw, XCircle } from "lucide-react";
import { formatDate } from "@/lib/format";
import { STATUS_LABELS, PRIORITY_LABELS } from "@/constants/issues";
import type { IssueDetail } from "@/types/issue";

const EVENT_ICONS = {
  issue_created: PlusCircle,
  status_changed: FileEdit,
  priority_changed: FileEdit,
  admin_note_added: MessageSquare,
  issue_resolved: CheckCircle2,
  issue_reopened: RotateCcw,
} as const;

function describeEvent(entry: IssueDetail["timeline"][number]): string {
  switch (entry.eventType) {
    case "issue_created":
      return "Issue reported";
    case "status_changed": {
      const from = (entry.oldValue as { status?: string } | null)?.status;
      const to = (entry.newValue as { status?: string } | null)?.status;
      const toLabel = to && to in STATUS_LABELS ? STATUS_LABELS[to as keyof typeof STATUS_LABELS] : to;
      const fromLabel = from && from in STATUS_LABELS ? STATUS_LABELS[from as keyof typeof STATUS_LABELS] : from;
      return fromLabel ? `Status changed from ${fromLabel} to ${toLabel}` : `Status set to ${toLabel}`;
    }
    case "priority_changed": {
      const to = (entry.newValue as { priority?: string } | null)?.priority;
      const toLabel = to && to in PRIORITY_LABELS ? PRIORITY_LABELS[to as keyof typeof PRIORITY_LABELS] : to;
      return `Priority set to ${toLabel}`;
    }
    case "admin_note_added":
      return "Note added";
    case "issue_resolved":
      return "Issue resolved";
    case "issue_reopened":
      return "Issue reopened";
    default:
      return entry.eventType;
  }
}

export function IssueTimeline({ timeline }: { timeline: IssueDetail["timeline"] }) {
  if (timeline.length === 0) {
    return <p className="text-sm text-muted-foreground">No activity yet.</p>;
  }

  return (
    <ol className="space-y-4">
      {timeline
        .slice()
        .reverse()
        .map((entry) => {
          const Icon = EVENT_ICONS[entry.eventType] ?? XCircle;
          return (
            <li key={entry.id} className="flex gap-3">
              <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-muted">
                <Icon className="size-3.5 text-muted-foreground" />
              </div>
              <div className="space-y-0.5">
                <p className="text-sm">{describeEvent(entry)}</p>
                {entry.message && <p className="text-sm text-muted-foreground">{entry.message}</p>}
                <p className="text-xs text-muted-foreground">
                  {entry.actor?.displayName ?? "System"} &middot; {formatDate(entry.createdAt)}
                </p>
              </div>
            </li>
          );
        })}
    </ol>
  );
}
