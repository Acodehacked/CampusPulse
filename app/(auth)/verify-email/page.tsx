import { MailCheck } from "lucide-react";
import { ResendVerificationButton } from "@/components/features/auth/resend-verification-button";

export const metadata = { title: "Verify your email | CampusPulse" };

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;

  return (
    <div className="space-y-6 text-center">
      <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted">
        <MailCheck className="size-6" />
      </div>
      <div className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">Check your inbox</h1>
        <p className="text-sm text-muted-foreground">
          We sent a confirmation link to{" "}
          {email ? <span className="font-medium text-foreground">{email}</span> : "your college email"}. Click it
          to activate your account.
        </p>
      </div>
      {email && <ResendVerificationButton email={email} />}
    </div>
  );
}
