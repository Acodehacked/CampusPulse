"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useIssueRealtime } from "@/lib/hooks/use-issue-realtime";

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

  // Adjust-state-during-render pattern (react.dev/learn/you-might-not-need-an-effect):
  // resyncs local state with fresh server props after a realtime-triggered
  // router.refresh() (e.g. someone else confirmed this issue), without an effect.
  const [prevInitialConfirmed, setPrevInitialConfirmed] = useState(initialConfirmed);
  const [prevInitialCount, setPrevInitialCount] = useState(initialCount);
  if (initialConfirmed !== prevInitialConfirmed || initialCount !== prevInitialCount) {
    setPrevInitialConfirmed(initialConfirmed);
    setPrevInitialCount(initialCount);
    setConfirmed(initialConfirmed);
    setCount(initialCount);
  }

  useIssueRealtime(issueId);

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
