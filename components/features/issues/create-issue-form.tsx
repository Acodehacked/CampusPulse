"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { issueCreateSchema } from "@/schemas/issues";
import { CATEGORY_LABELS } from "@/constants/issues";
import type { IssueDetail } from "@/types/issue";

type FieldErrors = Partial<Record<"title" | "description" | "category" | "location", string>>;

export function CreateIssueForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [values, setValues] = useState({ title: "", description: "", category: "", location: "" });
  const [errors, setErrors] = useState<FieldErrors>({});

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isPending) return;

    const parsed = issueCreateSchema.safeParse(values);
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
      const res = await fetch("/api/issues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      const body = await res.json();
      if (!res.ok) {
        toast.error(body.error?.message ?? "Failed to report issue");
        return;
      }

      toast.success("Issue reported. Thanks for flagging it!");
      const created = body.data as IssueDetail;
      router.push(`/issues/${created.id}`);
    });
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          placeholder="Wi-Fi down in Block C hostel"
          value={values.title}
          onChange={(e) => setValues((v) => ({ ...v, title: e.target.value }))}
          aria-invalid={!!errors.title}
          disabled={isPending}
        />
        {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          rows={5}
          placeholder="What's happening? When did you first notice it?"
          value={values.description}
          onChange={(e) => setValues((v) => ({ ...v, description: e.target.value }))}
          aria-invalid={!!errors.description}
          disabled={isPending}
        />
        {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Select
            value={values.category}
            onValueChange={(v) => setValues((prev) => ({ ...prev, category: v ?? "" }))}
            disabled={isPending}
          >
            <SelectTrigger id="category" aria-invalid={!!errors.category}>
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.category && <p className="text-sm text-destructive">{errors.category}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            placeholder="Block C, 2nd floor"
            value={values.location}
            onChange={(e) => setValues((v) => ({ ...v, location: e.target.value }))}
            aria-invalid={!!errors.location}
            disabled={isPending}
          />
          {errors.location && <p className="text-sm text-destructive">{errors.location}</p>}
        </div>
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? "Submitting..." : "Submit report"}
      </Button>
    </form>
  );
}
