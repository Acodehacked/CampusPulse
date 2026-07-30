import { STATUS_LABELS } from "@/constants/issues";
import type { IssueStatus } from "@/constants/issues";
import { cn } from "@/lib/utils";

const STATUS_LOG_COLOR: Record<IssueStatus, string> = {
  reported: "text-[#8b93a1]",
  verified: "text-[#5eb3f0]",
  in_progress: "text-[#f0b955]",
  resolved: "text-[#35e7a4]",
  rejected: "text-[#f0708a]",
};

export function ActivityLog({
  issues,
}: {
  issues: { id: string; title: string; status: IssueStatus; createdAt: string }[];
}) {
  return (
    <div className="rounded-xl border border-[#23262b] bg-[#121417]/90 shadow-2xl shadow-black/40 backdrop-blur">
      <div className="flex items-center gap-1.5 border-b border-[#23262b] px-4 py-3">
        <span className="size-2.5 rounded-full bg-[#2c2f34]" />
        <span className="size-2.5 rounded-full bg-[#2c2f34]" />
        <span className="size-2.5 rounded-full bg-[#2c2f34]" />
        <span className="ml-2 font-mono text-xs text-[#8b93a1]">campus-activity.log</span>
      </div>
      <div className="min-h-[168px] space-y-3 p-5 font-mono text-[13px] leading-relaxed">
        {issues.length === 0 ? (
          <p className="text-[#8b93a1]">$ waiting for the first report...</p>
        ) : (
          issues.map((issue, i) => (
            <div
              key={issue.id}
              className="animate-in fade-in slide-in-from-bottom-1 truncate duration-700 motion-reduce:animate-none"
              style={{ animationDelay: `${i * 180}ms`, animationFillMode: "backwards" }}
            >
              <span className="text-[#565c66]">{">"} </span>
              <span className="text-[#edeff2]">{issue.title}</span>
              <span className={cn("ml-2 shrink-0", STATUS_LOG_COLOR[issue.status])}>
                {STATUS_LABELS[issue.status].toLowerCase()}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
