import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

// The whole issue feed/detail/create flow requires sign-in (no anonymous
// browsing) — CampusPulse has no public/anon role, only student and admin.
const PROTECTED_PREFIXES = ["/dashboard", "/admin", "/issues"];
const ADMIN_PREFIXES = ["/admin"];

/**
 * Refreshes the Supabase session cookie on every request (required by the
 * SSR cookie-based auth pattern) and gates protected routes. This is a
 * convenience redirect for UX only — the real enforcement for admin actions
 * is Hono's requireAdmin middleware plus RLS, not this check.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  if (isProtected && !user) {
    const redirectUrl = new URL("/sign-in", request.url);
    redirectUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  const isAdminRoute = ADMIN_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  if (isAdminRoute && user) {
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (profile?.role !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
