"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

/**
 * Refreshes the issue detail page when someone else confirms/unconfirms or
 * an admin changes its status/priority while it's already open — scoped to
 * exactly the two tables added to the supabase_realtime publication
 * (0009_realtime.sql), not a general-purpose realtime layer.
 */
export function useIssueRealtime(issueId: string) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    const channel = supabase
      .channel(`issue-${issueId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "issue_confirmations", filter: `issue_id=eq.${issueId}` },
        () => router.refresh(),
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "issues", filter: `id=eq.${issueId}` },
        () => router.refresh(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [issueId]);
}
