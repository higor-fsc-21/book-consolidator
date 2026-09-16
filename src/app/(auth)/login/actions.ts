"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function login() {
  const supabase = await createClient();
  const headersList = await headers();
  const host = headersList.get("host") || "localhost:8443";
  const protocol =
    headersList.get("x-forwarded-proto") ||
    (host.startsWith("localhost") ? "http" : "https");
  const requestOrigin = `${protocol}://${host}`;
  const appUrl = (process.env.NEXT_PUBLIC_SITE_URL || requestOrigin).replace(
    /\/$/,
    "",
  );

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${appUrl}/auth/callback`,
    },
  });

  if (error || !data.url) {
    throw new Error(error?.message || "Could not authenticate with Google");
  }

  redirect(data.url);
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
