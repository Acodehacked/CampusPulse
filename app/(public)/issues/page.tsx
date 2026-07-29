import Link from "next/link";
import { Suspense } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IssueCard } from "@/components/features/issues/issue-card";
import { IssueFilters } from "@/components/features/issues/issue-filters";
import { PaginationControls } from "@/components/features/issues/pagination-controls";
import { issueFiltersSchema } from "@/schemas/issues";
import { createSupabaseServerClient } from "@/server/supabase/server";
import { listIssuesFeed } from "@/server/services/issue-service";

export const metadata = { title: "Issues | CampusPulse" };

type SearchParams = Record<string, string | string[] | undefined>;

export default async function IssuesFeedPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const rawParams = await searchParams;
  const filters = issueFiltersSchema.parse({
    status: rawParams.status,
    category: rawParams.category,
    priority: rawParams.priority,
    location: rawParams.location,
    q: rawParams.q,
    page: rawParams.page,
    pageSize: rawParams.pageSize,
  });

  const supabase = await createSupabaseServerClient();
  const { issues, meta } = await listIssuesFeed(supabase, filters);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Issues</h1>
          <p className="text-sm text-muted-foreground">Browse what&apos;s being reported across campus.</p>
        </div>
        <Button
          render={
            <Link href="/issues/new">
              <Plus className="size-4" />
              Report Issue
            </Link>
          }
        />
      </div>

      <Suspense>
        <IssueFilters />
      </Suspense>

      {issues.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="font-medium">No issues match your filters</p>
          <p className="mt-1 text-sm text-muted-foreground">Try adjusting your search or filters.</p>
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
