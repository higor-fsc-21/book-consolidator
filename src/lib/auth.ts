import "server-only"
import { db } from "./db"
import { createClient } from "./supabase/server"

export async function getCurrentUser() {
  const supabase = await createClient()
  const {
    data: { user: authUser },
    error,
  } = await supabase.auth.getUser()

  if (error || !authUser) {
    throw new Error("Unauthorized: no valid session found")
  }

  // 1. Look up by authUserId
  let localUser = await db.user.findFirst({
    where: { authUserId: authUser.id, deletedAt: null },
  })

  // 2. JIT provisioning by authUserId only
  if (!localUser) {
    const email = authUser.email
    if (!email) {
      throw new Error("Auth user does not have an email address")
    }
    const name =
      authUser.user_metadata?.full_name ||
      authUser.user_metadata?.name ||
      email.split("@")[0] ||
      "Usuário"

    localUser = await db.user.create({
      data: {
        authUserId: authUser.id,
        email,
        name,
      },
    })
  }

  return localUser
}
