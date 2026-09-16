import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  for (const headerName of [
    "x-memora-auth-user-id",
    "x-memora-auth-user-email",
    "x-memora-auth-user-name",
  ]) {
    requestHeaders.delete(headerName);
  }

  let supabaseResponse = NextResponse.next({
    request: { headers: requestHeaders },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return supabaseResponse;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        supabaseResponse = NextResponse.next({
          request: { headers: requestHeaders },
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  // Do not run code between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: DO NOT USE getSession() HERE AS IT CAN BE SPOOFED.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isLoginPage = request.nextUrl.pathname.startsWith("/login");
  const isPublicPage = request.nextUrl.pathname === "/";
  const isAuthCallback = request.nextUrl.pathname.startsWith("/auth/callback");

  if (isAuthCallback) {
    return supabaseResponse;
  }

  if (!user && !isLoginPage && !isPublicPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user) {
    requestHeaders.set("x-memora-auth-user-id", user.id);
    if (user.email) requestHeaders.set("x-memora-auth-user-email", user.email);
    const name = user.user_metadata?.full_name || user.user_metadata?.name;
    if (typeof name === "string" && name) {
      requestHeaders.set(
        "x-memora-auth-user-name",
        name.replace(/[\r\n]/g, " "),
      );
    }

    const responseWithIdentity = NextResponse.next({
      request: { headers: requestHeaders },
    });
    for (const cookie of supabaseResponse.cookies.getAll()) {
      responseWithIdentity.cookies.set(cookie.name, cookie.value);
    }
    supabaseResponse = responseWithIdentity;
  }

  return supabaseResponse;
}
