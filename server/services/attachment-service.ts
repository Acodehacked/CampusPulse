import { createSupabaseAdminClient } from "@/server/supabase/admin";

const SIGNED_URL_TTL_SECONDS = 60 * 10;
const BUCKET = "issue-evidence";

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
