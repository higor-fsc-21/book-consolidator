import "server-only";
import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";
import { sessionTag } from "@/lib/cache-tags";
import { bookInclude, reviveBook, reviveSession } from "./shared";
import type { Book, RevisionSession } from "../types";

export async function getSessionForUser(
  userId: string,
  sessionId: string,
): Promise<{ session: RevisionSession; book: Book } | null> {
  const raw = await unstable_cache(
    async (uid: string, id: string) =>
      db.revisionSession.findFirst({
        where: { id, userId: uid },
        include: {
          attempts: { orderBy: { attemptedAt: "asc" } },
          book: { include: bookInclude },
        },
      }),
    ["session-for-user"],
    { tags: [sessionTag(sessionId)] },
  )(userId, sessionId);
  if (!raw) return null;

  const { book: rawBook, ...rawSession } = raw;
  return {
    book: reviveBook(rawBook),
    session: reviveSession(rawSession),
  };
}
