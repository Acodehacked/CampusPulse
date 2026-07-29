import { notFound } from "next/navigation";
import Image from "next/image";
import { MapPin, User } from "lucide-react";
import { CategoryBadge, PriorityBadge, StatusBadge } from "@/components/features/issues/issue-badges";
import { ConfirmButton } from "@/components/features/issues/confirm-button";
import { IssueTimeline } from "@/components/features/issues/issue-timeline";
import { AdminIssueControls } from "@/components/features/admin/admin-issue-controls";
import { formatDate } from "@/lib/format";
import { getCurrentProfile } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/server/supabase/server";
import { getIssueDetail } from "@/server/services/issue-service";
import { AppError } from "@/server/lib/app-error";

export default async function IssueDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const profile = await getCurrentProfile();

  const issue = await getIssueDetail(supabase, id, profile?.id ?? null).catch((error) => {
    if (error instanceof AppError && error.status === 404) return null;
    throw error;
  });

  if (!issue) notFound();

  return (
    <div className="mx-auto grid max-w-4xl gap-8 lg:grid-cols-[1fr_280px]">
      <div className="space-y-6">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <CategoryBadge category={issue.category} />
            <StatusBadge status={issue.status} />
            <PriorityBadge priority={issue.priority} />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">{issue.title}</h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <User className="size-3.5" />
              {issue.reporter?.displayName ?? "Unknown reporter"}
            </span>
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3.5" />
              {issue.location}
            </span>
            <time dateTime={issue.createdAt}>{formatDate(issue.createdAt)}</time>
          </div>
        </div>

        <p className="whitespace-pre-wrap text-sm leading-relaxed">{issue.description}</p>

        {issue.attachments.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {issue.attachments.map(
              (attachment) =>
                attachment.signedUrl && (
                  <a
                    key={attachment.id}
                    href={attachment.signedUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="block overflow-hidden rounded-lg border"
                  >
                    <Image
                      src={attachment.signedUrl}
                      alt="Issue evidence"
                      width={200}
                      height={150}
                      className="h-32 w-full object-cover"
                    />
                  </a>
                ),
            )}
          </div>
        )}

        {profile && (
          <ConfirmButton issueId={issue.id} initialConfirmed={issue.isConfirmedByMe} initialCount={issue.confirmationCount} />
        )}

        <div className="space-y-3 border-t pt-6">
          <h2 className="text-sm font-medium">Activity</h2>
          <IssueTimeline timeline={issue.timeline} />
        </div>
      </div>

      {profile?.role === "admin" && (
        <div>
          <AdminIssueControls issue={issue} />
        </div>
      )}
    </div>
  );
}
