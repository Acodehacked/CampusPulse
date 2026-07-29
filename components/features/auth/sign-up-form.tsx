"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signUpSchema } from "@/schemas/auth";
import { signUpAction } from "@/lib/actions/auth-actions";

type FieldErrors = Partial<Record<"email" | "password" | "displayName", string>>;

export function SignUpForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [values, setValues] = useState({ email: "", password: "", displayName: "" });
  const [errors, setErrors] = useState<FieldErrors>({});

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const parsed = signUpSchema.safeParse(values);
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

    startTransition(async () => {
      const result = await signUpAction(parsed.data);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      router.push(`/verify-email?email=${encodeURIComponent(parsed.data.email)}`);
    });
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="displayName">Full name</Label>
        <Input
          id="displayName"
          autoComplete="name"
          value={values.displayName}
          onChange={(e) => setValues((v) => ({ ...v, displayName: e.target.value }))}
          aria-invalid={!!errors.displayName}
          disabled={isPending}
        />
        {errors.displayName && <p className="text-sm text-destructive">{errors.displayName}</p>}
      </div>

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
          autoComplete="new-password"
          value={values.password}
          onChange={(e) => setValues((v) => ({ ...v, password: e.target.value }))}
          aria-invalid={!!errors.password}
          disabled={isPending}
        />
        {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Creating account..." : "Create account"}
      </Button>
    </form>
  );
}
