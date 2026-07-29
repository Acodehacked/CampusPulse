import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentProfile } from "@/lib/auth/session";
import { getAdminAnalytics } from "@/server/services/analytics-service";
import { StatTile } from "@/components/features/admin/stat-tile";
import { IssuesBarChart } from "@/components/features/admin/issues-bar-chart";
import { PriorityBadge, StatusBadge } from "@/components/features/issues/issue-badges";
import { CATEGORY_LABELS, STATUS_LABELS } from "@/constants/issues";
import { formatRelativeTime } from "@/lib/format";

export const metadata = { title: "Admin | CampusPulse" };

export default async function AdminDashboardPage() {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin") redirect("/dashboard");

  const analytics = await getAdminAnalytics();

  const byCategory = analytics.issuesByCategory.map((row) => ({
    label: CATEGORY_LABELS[row.category],
    count: row.count,
  }));
  const byStatus = analytics.issuesByStatus.map((row) => ({
    label: STATUS_LABELS[row.status],
    count: row.count,
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Admin dashboard</h1>
        <p className="text-sm text-muted-foreground">Live campus issue analytics.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Total issues" value={analytics.totalIssues} />
        <StatTile label="Open issues" value={analytics.openIssues} />
        <StatTile label="Resolved issues" value={analytics.resolvedIssues} />
        <StatTile label="Total confirmations" value={analytics.totalConfirmations} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border p-4">
          <h2 className="mb-2 text-sm font-medium">Issues by category</h2>
          <IssuesBarChart data={byCategory} />
        </div>
        <div className="rounded-lg border p-4">
          <h2 className="mb-2 text-sm font-medium">Issues by status</h2>
          <IssuesBarChart data={byStatus} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border p-4">
          <h2 className="mb-3 text-sm font-medium">High-impact unresolved issues</h2>
          {analytics.topUnresolvedIssues.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing unresolved right now.</p>
          ) : (
            <ul className="space-y-3">
              {analytics.topUnresolvedIssues.map((issue) => (
                <li key={issue.id}>
                  <Link href={`/issues/${issue.id}`} className="block rounded-md p-2 -m-2 hover:bg-accent/40">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium">{issue.title}</span>
                      <PriorityBadge priority={issue.priority} />
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                      <StatusBadge status={issue.status} />
                      <span>{issue.confirmationCount} confirmation{issue.confirmationCount === 1 ? "" : "s"}</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-lg border p-4">
          <h2 className="mb-3 text-sm font-medium">Recent activity</h2>
          {analytics.recentActivity.length === 0 ? (
            <p className="text-sm text-muted-foreground">No activity yet.</p>
          ) : (
            <ul className="space-y-3">
              {analytics.recentActivity.map((entry) => (
                <li key={entry.id} className="text-sm">
                  <Link href={`/issues/${entry.issueId}`} className="font-medium hover:underline">
                    {entry.issueTitle}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {entry.actorName ?? "System"} &middot; {formatRelativeTime(entry.createdAt)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
