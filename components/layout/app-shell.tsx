import { SiteHeader } from "@/components/layout/site-header";
import { CommandPalette } from "@/components/command-palette/command-palette";
import { getCurrentProfile } from "@/lib/auth/session";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader profile={profile} />
      <CommandPalette profile={profile} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
    </div>
  );
}
