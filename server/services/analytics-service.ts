import { count, desc, eq, inArray, sql } from "drizzle-orm";
import { getDb } from "@/server/db/client";
import { issues, issueConfirmations, issueUpdates, profiles } from "@/server/db/schema";
import type { IssueCategory, IssueStatus } from "@/constants/issues";

/**
 * Real, non-row-sensitive aggregate counts for the public landing page.
 * Uses Drizzle's service-role connection since this is a plain count with no
 * per-row authorization concerns — never returns individual issue data.
 */
export async function getPublicStats() {
  const db = getDb();

  const [[totalRow], [resolvedRow]] = await Promise.all([
    db.select({ value: count() }).from(issues),
    db.select({ value: count() }).from(issues).where(eq(issues.status, "resolved")),
  ]);

  return {
    totalIssues: totalRow?.value ?? 0,
    resolvedIssues: resolvedRow?.value ?? 0,
  };
}

/**
 * A handful of real recent issues (title + status only, no reporter identity)
 * for the landing page's activity preview — never fabricated placeholder
 * rows, matching the "no fake production statistics" rule applied to this
 * UI element too.
 */
export async function getRecentPublicIssues(limit = 3) {
  const db = getDb();
  const rows = await db
    .select({ id: issues.id, title: issues.title, status: issues.status, createdAt: issues.createdAt })
    .from(issues)
    .orderBy(desc(issues.createdAt))
    .limit(limit);

  return rows.map((r) => ({ id: r.id, title: r.title, status: r.status, createdAt: r.createdAt.toISOString() }));
}

const OPEN_STATUSES: IssueStatus[] = ["reported", "verified", "in_progress"];

/**
 * All figures come from live aggregate queries against the real tables —
 * never hardcoded (PRD requirement: no fake dashboard statistics).
 */
export async function getAdminAnalytics() {
  const db = getDb();

  const [
    [totalRow],
    [openRow],
    [resolvedRow],
    [confirmationRow],
    byCategory,
    byStatus,
    topUnresolved,
    recentActivity,
  ] = await Promise.all([
    db.select({ value: count() }).from(issues),
    db.select({ value: count() }).from(issues).where(inArray(issues.status, OPEN_STATUSES)),
    db.select({ value: count() }).from(issues).where(eq(issues.status, "resolved")),
    db.select({ value: count() }).from(issueConfirmations),

    db
      .select({ category: issues.category, value: count() })
      .from(issues)
      .groupBy(issues.category)
      .orderBy(desc(count())),

    db
      .select({ status: issues.status, value: count() })
      .from(issues)
      .groupBy(issues.status)
      .orderBy(desc(count())),

    db
      .select({
        id: issues.id,
        title: issues.title,
        status: issues.status,
        priority: issues.priority,
        confirmationCount: count(issueConfirmations.id).as("confirmation_count"),
      })
      .from(issues)
      .leftJoin(issueConfirmations, eq(issueConfirmations.issueId, issues.id))
      .where(inArray(issues.status, OPEN_STATUSES))
      .groupBy(issues.id)
      .orderBy(desc(sql`confirmation_count`))
      .limit(5),

    db
      .select({
        id: issueUpdates.id,
        eventType: issueUpdates.eventType,
        message: issueUpdates.message,
        createdAt: issueUpdates.createdAt,
        issueId: issues.id,
        issueTitle: issues.title,
        actorName: profiles.displayName,
      })
      .from(issueUpdates)
      .innerJoin(issues, eq(issues.id, issueUpdates.issueId))
      .leftJoin(profiles, eq(profiles.id, issueUpdates.actorId))
      .orderBy(desc(issueUpdates.createdAt))
      .limit(10),
  ]);

  return {
    totalIssues: totalRow?.value ?? 0,
    openIssues: openRow?.value ?? 0,
    resolvedIssues: resolvedRow?.value ?? 0,
    totalConfirmations: confirmationRow?.value ?? 0,
    issuesByCategory: byCategory.map((r) => ({ category: r.category as IssueCategory, count: r.value })),
    issuesByStatus: byStatus.map((r) => ({ status: r.status as IssueStatus, count: r.value })),
    topUnresolvedIssues: topUnresolved.map((r) => ({
      id: r.id,
      title: r.title,
      status: r.status,
      priority: r.priority,
      confirmationCount: Number(r.confirmationCount),
    })),
    recentActivity: recentActivity.map((r) => ({
      id: r.id,
      eventType: r.eventType,
      message: r.message,
      createdAt: r.createdAt.toISOString(),
      issueId: r.issueId,
      issueTitle: r.issueTitle,
      actorName: r.actorName,
    })),
  };
}
