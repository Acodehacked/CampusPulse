import { Suspense } from "react";
import Link from "next/link";
import { SignInForm } from "@/components/features/auth/sign-in-form";

export const metadata = { title: "Sign in | CampusPulse" };

export default function SignInPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1 text-center">
        <h1 className="text-xl font-semibold tracking-tight">Welcome back</h1>
        <p className="text-sm text-muted-foreground">Sign in with your SJCET college email.</p>
      </div>
      <Suspense>
        <SignInForm />
      </Suspense>
      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link href="/sign-up" className="underline underline-offset-4">
          Create one
        </Link>
      </p>
    </div>
  );
}
