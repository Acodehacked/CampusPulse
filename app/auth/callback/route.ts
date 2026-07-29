import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/server/supabase/server";

/** Exchanges the PKCE code from an email confirmation link for a session, then redirects in. */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/sign-in?error=verification_failed`);
}
