import "server-only";
import { db } from "./db";
import { createClient } from "./supabase/server";

export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user: authUser },
    error,
  } = await supabase.auth.getUser();

  if (error || !authUser) {
    throw new Error("Unauthorized: no valid session found");
  }

  // 1. Look up by authUserId
  let localUser = await db.user.findFirst({
    where: { authUserId: authUser.id, deletedAt: null },
  });

  const email = authUser.email;
  const resolvedName =
    authUser.user_metadata?.full_name ||
    authUser.user_metadata?.name ||
    (email ? email.split("@")[0] : null);

  // Sync existing user if name is still the placeholder or out of date with Supabase metadata
  if (localUser) {
    if (
      resolvedName &&
      (localUser.name === "Rafael" ||
        (authUser.user_metadata?.full_name &&
          localUser.name !== authUser.user_metadata.full_name))
    ) {
      localUser = await db.user.update({
        where: { id: localUser.id },
        data: {
          name: resolvedName,
          ...(email && localUser.email !== email ? { email } : {}),
        },
      });
    }
    return localUser;
  }

  // 2. JIT provisioning by authUserId only
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
}
