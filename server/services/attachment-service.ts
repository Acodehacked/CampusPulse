import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { createSupabaseAdminClient } from "@/server/supabase/admin";
import { AppError } from "@/server/lib/app-error";
import * as issuesRepo from "@/server/repositories/issues.repo";

type Client = SupabaseClient<Database>;

const SIGNED_URL_TTL_SECONDS = 60 * 10;
const BUCKET = "issue-evidence";
const MAX_SIZE_BYTES = 5 * 1024 * 1024;

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;
type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];

const EXTENSION_BY_MIME: Record<AllowedMimeType, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

/**
 * Sniffs the real file type from its magic bytes rather than trusting the
 * browser-supplied Content-Type — a renamed .exe claiming to be a .png
 * would otherwise sail through.
 */
function sniffImageMimeType(bytes: Uint8Array): AllowedMimeType | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return "image/png";
  }
  if (bytes.length >= 6 && bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38) {
    return "image/gif";
  }
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return "image/webp";
  }
  return null;
}

/**
 * Uploads through the caller's user-scoped Supabase client so the storage
 * policy (path must be prefixed with the uploader's own uid) and the
 * attachments RLS insert policy both apply — this is never done with the
 * service-role client.
 */
export async function uploadAttachment(
  supabase: Client,
  issueId: string,
  userId: string,
  file: File,
): Promise<{ id: string; storagePath: string; signedUrl: string | null }> {
  if (file.size <= 0 || file.size > MAX_SIZE_BYTES) {
    throw AppError.validation(`Image must be under ${MAX_SIZE_BYTES / (1024 * 1024)}MB`);
  }

  const issue = await issuesRepo.getIssueById(supabase, issueId);
  if (!issue) throw AppError.notFound("Issue not found");

  const buffer = new Uint8Array(await file.arrayBuffer());
  const sniffedType = sniffImageMimeType(buffer);
  if (!sniffedType) {
    throw AppError.validation("Only JPEG, PNG, WEBP, or GIF images are allowed");
  }

  const extension = EXTENSION_BY_MIME[sniffedType];
  const storagePath = `${userId}/${issueId}/${randomUUID()}.${extension}`;

  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(storagePath, buffer, {
    contentType: sniffedType,
    upsert: false,
  });
  if (uploadError) throw uploadError;

  const { data: attachment, error: insertError } = await supabase
    .from("attachments")
    .insert({
      issue_id: issueId,
      uploaded_by: userId,
      storage_path: storagePath,
      mime_type: sniffedType,
      size_bytes: file.size,
    })
    .select("id, storage_path")
    .single();

  if (insertError) {
    await supabase.storage.from(BUCKET).remove([storagePath]);
    throw insertError;
  }

  return {
    id: attachment.id,
    storagePath: attachment.storage_path,
    signedUrl: await getSignedAttachmentUrl(attachment.storage_path),
  };
}

/** Evidence photos live in a private bucket; the client only ever sees short-lived signed URLs, never the bucket path directly. */
export async function getSignedAttachmentUrl(storagePath: string): Promise<string | null> {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.storage.from(BUCKET).createSignedUrl(storagePath, SIGNED_URL_TTL_SECONDS);
  if (error) {
    console.error("[attachment-service] failed to sign url", error);
    return null;
  }
  return data.signedUrl;
}
