import Link from "next/link";
import { ArrowRight, CheckCircle2, MegaphoneIcon, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/layout/site-header";
import { CommandPalette } from "@/components/command-palette/command-palette";
import { ActivityLog } from "@/components/features/landing/activity-log";
import { getCurrentProfile } from "@/lib/auth/session";
import { getPublicStats, getRecentPublicIssues } from "@/server/services/analytics-service";

export default async function LandingPage() {
  const [profile, stats, recentIssues] = await Promise.all([
    getCurrentProfile(),
    getPublicStats().catch(() => null),
    getRecentPublicIssues(3).catch(() => []),
  ]);

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader profile={profile} />
      <CommandPalette profile={profile} />

      {/* Hero: a deliberately dark "stage" regardless of the site's light/dark
          toggle — the rest of the page stays theme-aware as normal. This page
          lives outside the shared AppShell container specifically so this
          section can span the full viewport width without fighting a
          max-w-6xl ancestor. */}
      <section className="relative w-full bg-[#0a0b0d] px-4 pb-20 pt-16 text-[#edeff2] sm:pt-24">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(53,231,164,0.12), transparent)",
          }}
        />
        <div className="relative mx-auto grid max-w-6xl gap-12 lg:grid-cols-[1.1fr_1fr] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#23262b] bg-[#121417] px-3 py-1 font-mono text-[11px] tracking-wide text-[#8b93a1]">
              <span className="relative flex size-1.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#35e7a4] opacity-75 motion-reduce:animate-none" />
                <span className="relative inline-flex size-1.5 rounded-full bg-[#35e7a4]" />
              </span>
              OPEN SOURCE &middot; BUILT FOR SJCET
            </div>

            <h1 className="mt-6 text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
              See it.
              <br />
              Report it.
              <br />
              <span className="text-[#35e7a4]">Solve it.</span>
            </h1>

            <p className="mt-6 max-w-md text-lg text-[#8b93a1]">
              CampusPulse is where SJCET students report campus problems, confirm they&apos;re affected too, and
              watch them get fixed — in the open, not a black-hole ticket system.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button
                size="lg"
                className="bg-[#35e7a4] text-[#08120d] hover:bg-[#35e7a4]/90"
                nativeButton={false}
                render={<Link href="/issues/new">Report an issue</Link>}
              />
              <Button
                size="lg"
                variant="outline"
                className="gap-1.5 border-[#2b2f35] bg-transparent text-[#edeff2] hover:bg-[#121417] hover:text-[#edeff2]"
                nativeButton={false}
                render={
                  <Link href="/issues">
                    Browse issues
                    <ArrowRight className="size-4" />
                  </Link>
                }
              />
            </div>

            {stats && stats.totalIssues > 0 && (
              <dl className="mt-10 flex gap-8 font-mono text-sm">
                <div>
                  <dt className="text-[#8b93a1]">reported</dt>
                  <dd className="text-2xl text-[#edeff2]">{stats.totalIssues}</dd>
                </div>
                <div>
                  <dt className="text-[#8b93a1]">resolved</dt>
                  <dd className="text-2xl text-[#edeff2]">{stats.resolvedIssues}</dd>
                </div>
              </dl>
            )}
          </div>

          <ActivityLog issues={recentIssues} />
        </div>
      </section>

      {/* How it works — a real 3-step pipeline, tagged like commands rather
          than decorated with generic 01/02/03 numbering. */}
      <section className="mx-auto w-full max-w-6xl px-4 py-20">
        <h2 className="font-mono text-xs uppercase tracking-widest text-muted-foreground">How it works</h2>
        <div className="mt-6 grid gap-px overflow-hidden rounded-xl border bg-border sm:grid-cols-3">
          <div className="space-y-3 bg-background p-6">
            <span className="inline-block rounded-md bg-muted px-2 py-1 font-mono text-xs text-muted-foreground">
              [report]
            </span>
            <div className="flex items-center gap-2">
              <MegaphoneIcon className="size-4 text-muted-foreground" />
              <h3 className="font-medium">Report</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Spot a problem on campus? Log it in seconds with a category, location, and an optional photo.
            </p>
          </div>
          <div className="space-y-3 bg-background p-6">
            <span className="inline-block rounded-md bg-muted px-2 py-1 font-mono text-xs text-muted-foreground">
              [confirm]
            </span>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-4 text-muted-foreground" />
              <h3 className="font-medium">Confirm</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Other students affected by the same issue confirm it, so admins can see what actually matters most.
            </p>
          </div>
          <div className="space-y-3 bg-background p-6">
            <span className="inline-block rounded-md bg-muted px-2 py-1 font-mono text-xs text-muted-foreground">
              [resolve]
            </span>
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-muted-foreground" />
              <h3 className="font-medium">Resolve</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Admins verify, prioritize, and resolve issues — every step logged in a public activity timeline.
            </p>
          </div>
        </div>
      </section>

      <footer className="mx-auto w-full max-w-6xl border-t px-4 py-8">
        <p className="font-mono text-xs text-muted-foreground">
          CampusPulse &middot; built by students, for students &middot; MIT licensed
        </p>
      </footer>
    </div>
  );
}
