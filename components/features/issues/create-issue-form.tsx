"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ImagePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { issueCreateSchema } from "@/schemas/issues";
import { CATEGORY_LABELS } from "@/constants/issues";
import type { IssueDetail } from "@/types/issue";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

type FieldErrors = Partial<Record<"title" | "description" | "category" | "location", string>>;

export function CreateIssueForm() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const [values, setValues] = useState({ title: "", description: "", category: "", location: "" });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      toast.error("Image must be under 5MB");
      return;
    }

    setImage(file);
    setImagePreview(URL.createObjectURL(file));
  }

  function clearImage() {
    setImage(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

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

      const created = body.data as IssueDetail;

      if (image) {
        const formData = new FormData();
        formData.append("file", image);
        const uploadRes = await fetch(`/api/issues/${created.id}/attachments`, {
          method: "POST",
          body: formData,
        });
        if (!uploadRes.ok) {
          toast.warning("Issue reported, but the image failed to upload.");
          router.push(`/issues/${created.id}`);
          return;
        }
      }

      toast.success("Issue reported. Thanks for flagging it!");
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

      <div className="space-y-2">
        <Label>Photo (optional)</Label>
        {imagePreview ? (
          <div className="relative w-fit">
            {/* eslint-disable-next-line @next/next/no-img-element -- local object URL preview, not a remote image */}
            <img src={imagePreview} alt="Selected evidence" className="h-32 rounded-md border object-cover" />
            <button
              type="button"
              onClick={clearImage}
              className="absolute -right-2 -top-2 flex size-6 items-center justify-center rounded-full border bg-background shadow-sm"
              aria-label="Remove image"
            >
              <X className="size-3.5" />
            </button>
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isPending}
          >
            <ImagePlus className="size-4" />
            Attach photo
          </Button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleImageSelect}
          className="hidden"
        />
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? "Submitting..." : "Submit report"}
      </Button>
    </form>
  );
}
