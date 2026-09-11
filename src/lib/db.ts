import "server-only";
import { PrismaClient } from "@prisma/client";

// Pinned on globalThis so the Prisma client survives Next.js HMR reloads in dev.
const globalForPrisma = globalThis as unknown as {
  __memoraPrisma?: PrismaClient;
};

export const db = globalForPrisma.__memoraPrisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.__memoraPrisma = db;
}
