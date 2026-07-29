import Link from "next/link";
import { ClipboardList, MessageSquareText, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getPublicStats } from "@/server/services/analytics-service";

export default async function LandingPage() {
  const stats = await getPublicStats().catch(() => null);

  return (
    <div className="space-y-24 py-8">
      <section className="mx-auto max-w-2xl space-y-6 text-center">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">CampusPulse</h1>
        <p className="text-xl font-medium text-muted-foreground">See it. Report it. Solve it.</p>
        <p className="text-muted-foreground">
          CampusPulse is where SJCET students report campus issues — broken equipment, network outages,
          infrastructure problems — confirm they&apos;re affected too, and track resolution in the open.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Button size="lg" render={<Link href="/issues/new">Report an Issue</Link>} />
          <Button size="lg" variant="outline" render={<Link href="/issues">Explore Issues</Link>} />
        </div>

        {stats && stats.totalIssues > 0 && (
          <div className="flex justify-center gap-8 pt-6 text-sm">
            <div>
              <p className="text-2xl font-semibold">{stats.totalIssues}</p>
              <p className="text-muted-foreground">Issues reported</p>
            </div>
            <div>
              <p className="text-2xl font-semibold">{stats.resolvedIssues}</p>
              <p className="text-muted-foreground">Issues resolved</p>
            </div>
          </div>
        )}
      </section>

      <section className="mx-auto max-w-4xl">
        <h2 className="text-center text-sm font-medium uppercase tracking-wide text-muted-foreground">
          How it works
        </h2>
        <div className="mt-6 grid gap-6 sm:grid-cols-3">
          <div className="space-y-2 rounded-lg border p-6">
            <ClipboardList className="size-5 text-muted-foreground" />
            <h3 className="font-medium">Report</h3>
            <p className="text-sm text-muted-foreground">
              Spot a problem on campus? Log it in seconds with a category, location, and optional photo.
            </p>
          </div>
          <div className="space-y-2 rounded-lg border p-6">
            <MessageSquareText className="size-5 text-muted-foreground" />
            <h3 className="font-medium">Confirm</h3>
            <p className="text-sm text-muted-foreground">
              Other students affected by the same issue confirm it, helping admins prioritize what matters most.
            </p>
          </div>
          <div className="space-y-2 rounded-lg border p-6">
            <ShieldCheck className="size-5 text-muted-foreground" />
            <h3 className="font-medium">Resolve</h3>
            <p className="text-sm text-muted-foreground">
              Admins verify, prioritize, and resolve issues — with every step tracked in a public timeline.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
