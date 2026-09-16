import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { db } from "./db";
import { createClient } from "./supabase/server";

type AuthIdentity = {
  id: string;
  email?: string;
  user_metadata?: {
    full_name?: string;
    name?: string;
  };
};

export const getCurrentUser = cache(async function getCurrentUser() {
  const requestHeaders = await headers();
  const forwardedAuthUserId = requestHeaders.get("x-memora-auth-user-id");
  let authUser: AuthIdentity;

  if (forwardedAuthUserId) {
    authUser = {
      id: forwardedAuthUserId,
      email: requestHeaders.get("x-memora-auth-user-email") ?? undefined,
      user_metadata: {
        full_name: requestHeaders.get("x-memora-auth-user-name") ?? undefined,
      },
    };
  } else {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      throw new Error("Unauthorized: no valid session found");
    }

    authUser = user;
  }

  let localUser = await db.user.findFirst({
    where: { authUserId: authUser.id, deletedAt: null },
  });

  const email = authUser.email;
  const resolvedName =
    authUser.user_metadata?.full_name ||
    authUser.user_metadata?.name ||
    (email ? email.split("@")[0] : null);

  if (localUser) {
    return localUser;
  }

  if (!email) {
    throw new Error("Auth user does not have an email address");
  }
  const name = resolvedName || "Usuário";

  localUser = await db.user.create({
    data: {
      authUserId: authUser.id,
      email,
      name,
    },
  });

  return localUser;
});
