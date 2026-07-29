"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signInSchema } from "@/schemas/auth";
import { signInAction } from "@/lib/actions/auth-actions";

type FieldErrors = Partial<Record<"email" | "password", string>>;

export function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/dashboard";

  const [isPending, startTransition] = useTransition();
  const [values, setValues] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [needsVerification, setNeedsVerification] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const parsed = signInSchema.safeParse(values);
    if (!parsed.success) {
      const fieldErrors: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof FieldErrors;
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setNeedsVerification(false);

    startTransition(async () => {
      const result = await signInAction(parsed.data);
      if (!result.ok) {
        toast.error(result.message);
        if (result.message.toLowerCase().includes("verify")) {
          setNeedsVerification(true);
        }
        return;
      }
      router.push(next);
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">College email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="name2028@cs.sjcetpalai.ac.in"
          value={values.email}
          onChange={(e) => setValues((v) => ({ ...v, email: e.target.value }))}
          aria-invalid={!!errors.email}
          disabled={isPending}
        />
        {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          value={values.password}
          onChange={(e) => setValues((v) => ({ ...v, password: e.target.value }))}
          aria-invalid={!!errors.password}
          disabled={isPending}
        />
        {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
      </div>

      {needsVerification && (
        <p className="text-sm text-muted-foreground">
          Need a new link?{" "}
          <Link href={`/verify-email?email=${encodeURIComponent(values.email)}`} className="underline">
            Resend verification email
          </Link>
        </p>
      )}

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Signing in..." : "Sign in"}
      </Button>
    </form>
  );
}
