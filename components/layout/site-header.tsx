import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { UserMenu } from "@/components/layout/user-menu";
import type { CurrentProfile } from "@/lib/auth/session";

export function SiteHeader({ profile }: { profile: CurrentProfile | null }) {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-semibold tracking-tight">
            CampusPulse
          </Link>
          {profile && (
            <nav className="hidden items-center gap-4 text-sm text-muted-foreground sm:flex">
              <Link href="/issues" className="transition-colors hover:text-foreground">
                Issues
              </Link>
              <Link href="/dashboard" className="transition-colors hover:text-foreground">
                Dashboard
              </Link>
              {profile.role === "admin" && (
                <Link href="/admin" className="transition-colors hover:text-foreground">
                  Admin
                </Link>
              )}
            </nav>
          )}
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          {profile ? (
            <UserMenu profile={profile} />
          ) : (
            <>
              <Button variant="ghost" size="sm" render={<Link href="/sign-in">Sign in</Link>} />
              <Button size="sm" render={<Link href="/sign-up">Sign up</Link>} />
            </>
          )}
        </div>
      </div>
    </header>
  );
}
