"use server";

import { headers } from "next/headers";
import { createSupabaseServerClient } from "@/server/supabase/server";
import {
  signUpSchema,
  signInSchema,
  resendVerificationSchema,
  type SignUpInput,
  type SignInInput,
  type ResendVerificationInput,
} from "@/schemas/auth";

export type AuthActionResult = { ok: true } | { ok: false; message: string };

async function getOrigin() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

/**
 * Role is never sent here — it's derived server-side by the handle_new_user
 * trigger from the email itself (see 0001_enums_and_profiles.sql).
 */
export async function signUpAction(input: SignUpInput): Promise<AuthActionResult> {
  const parsed = signUpSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createSupabaseServerClient();
  const origin = await getOrigin();

  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { display_name: parsed.data.displayName },
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  return { ok: true };
}

export async function signInAction(input: SignInInput): Promise<AuthActionResult> {
  const parsed = signInSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    const message = error.message.toLowerCase().includes("confirm")
      ? "Please verify your email before signing in."
      : "Invalid email or password.";
    return { ok: false, message };
  }

  return { ok: true };
}

export async function signOutAction(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
}

export async function resendVerificationAction(input: ResendVerificationInput): Promise<AuthActionResult> {
  const parsed = resendVerificationSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createSupabaseServerClient();
  const origin = await getOrigin();

  const { error } = await supabase.auth.resend({
    type: "signup",
    email: parsed.data.email,
    options: { emailRedirectTo: `${origin}/auth/callback` },
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  return { ok: true };
}
