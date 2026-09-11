import "server-only";
import { db } from "./db";

// Phase 3 seam: resolves the single dev user by email. Phase 4 replaces the
// internals with Supabase Auth while keeping this call site unchanged.
export async function getCurrentUser() {
  const email = process.env.SEED_USER_EMAIL;
  if (!email) {
    throw new Error("SEED_USER_EMAIL must be set (see .env.example)");
  }
  const user = await db.user.findFirst({ where: { email, deletedAt: null } });
  if (!user) {
    throw new Error(
      `No user found for SEED_USER_EMAIL=${email}. Run pnpm db:seed.`,
    );
  }
  return user;
}
