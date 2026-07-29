import { createSupabaseServerClient } from "@/server/supabase/server";

export type CurrentProfile = {
  id: string;
  email: string;
  displayName: string;
  role: "student" | "admin";
  department: string | null;
  graduationYear: number | null;
  avatarUrl: string | null;
};

/** For Server Components: the signed-in user's profile, or null if signed out. Never trust a role passed from the client instead of this. */
export async function getCurrentProfile(): Promise<CurrentProfile | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, display_name, role, department, graduation_year, avatar_url")
    .eq("id", user.id)
    .single();

  if (!profile) return null;

  return {
    id: profile.id,
    email: profile.email,
    displayName: profile.display_name,
    role: profile.role,
    department: profile.department,
    graduationYear: profile.graduation_year,
    avatarUrl: profile.avatar_url,
  };
}
