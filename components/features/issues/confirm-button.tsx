"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function ConfirmButton({
  issueId,
  initialConfirmed,
  initialCount,
}: {
  issueId: string;
  initialConfirmed: boolean;
  initialCount: number;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirmed, setConfirmed] = useState(initialConfirmed);
  const [count, setCount] = useState(initialCount);

  function toggle() {
    if (isPending) return;
    const nextConfirmed = !confirmed;

    startTransition(async () => {
      const res = await fetch(`/api/issues/${issueId}/confirm`, {
        method: nextConfirmed ? "POST" : "DELETE",
      });
      const body = await res.json();

      if (!res.ok) {
        toast.error(body.error?.message ?? "Something went wrong");
        return;
      }

      setConfirmed(nextConfirmed);
      setCount(body.data.confirmationCount);
      router.refresh();
    });
  }

  return (
    <Button variant={confirmed ? "default" : "outline"} onClick={toggle} disabled={isPending} className="gap-2">
      <CheckCircle2 className="size-4" />
      {confirmed ? "You're affected" : "I'm affected too"}
      <span className="text-xs opacity-70">({count})</span>
    </Button>
  );
}
