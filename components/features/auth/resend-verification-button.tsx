"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { resendVerificationAction } from "@/lib/actions/auth-actions";

const COOLDOWN_SECONDS = 60;

export function ResendVerificationButton({ email }: { email: string }) {
  const [isPending, startTransition] = useTransition();
  const [cooldown, setCooldown] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  function handleResend() {
    startTransition(async () => {
      const result = await resendVerificationAction({ email });
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success("Verification email sent. Check your inbox.");
      setCooldown(COOLDOWN_SECONDS);
      intervalRef.current = setInterval(() => {
        setCooldown((c) => {
          if (c <= 1 && intervalRef.current) clearInterval(intervalRef.current);
          return Math.max(0, c - 1);
        });
      }, 1000);
    });
  }

  const disabled = isPending || cooldown > 0;

  return (
    <Button variant="outline" onClick={handleResend} disabled={disabled} className="w-full">
      {isPending ? "Sending..." : cooldown > 0 ? `Resend in ${cooldown}s` : "Resend verification email"}
    </Button>
  );
}
