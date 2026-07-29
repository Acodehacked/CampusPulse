"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PRIORITY_LABELS, STATUS_LABELS } from "@/constants/issues";
import type { IssuePriority, IssueStatus } from "@/constants/issues";
import { ISSUE_STATUS_TRANSITIONS } from "@/constants/status-transitions";
import type { IssueDetail } from "@/types/issue";

async function patchJson(url: string, body: unknown) {
  const res = await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message ?? "Request failed");
  return data;
}

export function AdminIssueControls({ issue }: { issue: IssueDetail }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [note, setNote] = useState("");

  const nextStatuses = ISSUE_STATUS_TRANSITIONS[issue.status];

  function handleStatusChange(status: string | null) {
    if (!status) return;
    startTransition(async () => {
      try {
        await patchJson(`/api/admin/issues/${issue.id}/status`, { status: status as IssueStatus });
        toast.success(`Status updated to ${STATUS_LABELS[status as IssueStatus]}`);
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to update status");
      }
    });
  }

  function handlePriorityChange(priority: string | null) {
    if (!priority) return;
    startTransition(async () => {
      try {
        await patchJson(`/api/admin/issues/${issue.id}/priority`, { priority: priority as IssuePriority });
        toast.success(`Priority updated to ${PRIORITY_LABELS[priority as IssuePriority]}`);
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to update priority");
      }
    });
  }

  function handleAddNote() {
    if (!note.trim()) return;
    startTransition(async () => {
      const res = await fetch(`/api/admin/issues/${issue.id}/updates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: note.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error?.message ?? "Failed to add note");
        return;
      }
      setNote("");
      toast.success("Note added");
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Admin controls</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={issue.status} onValueChange={handleStatusChange} disabled={isPending}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={issue.status}>{STATUS_LABELS[issue.status]} (current)</SelectItem>
              {nextStatuses.map((status) => (
                <SelectItem key={status} value={status}>
                  {STATUS_LABELS[status]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Priority</Label>
          <Select value={issue.priority} onValueChange={handlePriorityChange} disabled={isPending}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="admin-note">Add note</Label>
          <Textarea
            id="admin-note"
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Update the reporter on progress..."
            disabled={isPending}
          />
          <Button size="sm" onClick={handleAddNote} disabled={isPending || !note.trim()} className="w-full">
            Add note
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
