import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const appUrl = (process.env.NEXT_PUBLIC_SITE_URL || origin).replace(
    /\/$/,
    "",
  );
  // If "next" is in the param, use it as the redirect URL
  const next = searchParams.get("next") ?? "/painel";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${appUrl}${next}`);
    }
  }

  // return the user to an error page or login with instructions
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
