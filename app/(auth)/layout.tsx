import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 px-4 py-16">
      <Link href="/" className="text-lg font-semibold tracking-tight">
        CampusPulse
      </Link>
      <div className="w-full max-w-sm rounded-lg border bg-card p-6 shadow-sm">{children}</div>
    </div>
  );
}
