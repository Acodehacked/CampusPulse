import Link from "next/link";
import { SignUpForm } from "@/components/features/auth/sign-up-form";

export const metadata = { title: "Sign up | CampusPulse" };

export default function SignUpPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1 text-center">
        <h1 className="text-xl font-semibold tracking-tight">Create your account</h1>
        <p className="text-sm text-muted-foreground">Use your SJCET college email to get started.</p>
      </div>
      <SignUpForm />
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/sign-in" className="underline underline-offset-4">
          Sign in
        </Link>
      </p>
    </div>
  );
}
