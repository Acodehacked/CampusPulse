import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getCurrentProfile } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/server/supabase/server";
import { listMyIssues } from "@/server/services/issue-service";
import { meIssuesQuerySchema } from "@/schemas/issues";
import { DashboardTabs } from "@/components/features/issues/dashboard-tabs";
import { IssueCard } from "@/components/features/issues/issue-card";
import { PaginationControls } from "@/components/features/issues/pagination-controls";

export const metadata = { title: "Dashboard | CampusPulse" };

type SearchParams = Record<string, string | string[] | undefined>;

export default async function DashboardPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/sign-in");

  const raw = await searchParams;
  const query = meIssuesQuerySchema.parse({
    type: raw.type,
    status: raw.status,
    page: raw.page,
    pageSize: raw.pageSize,
  });

  const supabase = await createSupabaseServerClient();
  const { issues, meta } = await listMyIssues(supabase, profile.id, query);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">My issues</h1>
        <p className="text-sm text-muted-foreground">Track what you&apos;ve reported and what affects you.</p>
      </div>

      <Suspense>
        <DashboardTabs active={query.type} />
      </Suspense>

      {issues.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="font-medium">
            {query.type === "reported" ? "You haven't reported any issues yet" : "You haven't confirmed any issues yet"}
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {issues.map((issue) => (
            <IssueCard key={issue.id} issue={issue} />
          ))}
        </div>
      )}

      <PaginationControls meta={meta} />
    </div>
  );
}
