import { randomUUID } from "node:crypto";
import type { PrismaClient } from "@prisma/client";

export async function createUser(
  db: PrismaClient,
  overrides?: Partial<{ email: string; name: string; authUserId: string }>,
) {
  return db.user.create({
    data: {
      email: overrides?.email ?? `user-${randomUUID()}@example.com`,
      name: overrides?.name ?? "Integration User",
      authUserId: overrides?.authUserId ?? randomUUID(),
    },
  });
}

export async function resetDatabase(db: PrismaClient) {
  await db.sessionAttempt.deleteMany();
  await db.question.deleteMany();
  await db.chapter.deleteMany();
  await db.revisionSession.deleteMany();
  await db.book.deleteMany();
  await db.user.deleteMany();
}
