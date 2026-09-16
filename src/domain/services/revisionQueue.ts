import "server-only";
import { db } from "@/lib/db";
import {
  rebuildRevisionQueue as buildRevisionQueue,
  type RevisionQueueBook,
} from "../scheduling";

export async function rebuildRevisionQueueForUser(
  userId: string,
  now: Date = new Date(),
) {
  return db.$transaction(async (tx) => {
    const books = await tx.book.findMany({
      where: {
        userId,
        deletedAt: null,
        status: "completed",
        consolidationState: { not: "archived" },
        nextRevision: { not: null },
      },
      select: {
        id: true,
        status: true,
        consolidationState: true,
        nextRevision: true,
        importance: true,
      },
    });

    const queue = buildRevisionQueue(
      books.map(
        (book): RevisionQueueBook => ({
          id: book.id,
          status: book.status,
          consolidationState: book.consolidationState,
          nextRevision: book.nextRevision,
          importance: book.importance as 1 | 2 | 3,
        }),
      ),
      now,
    );

    for (const entry of queue) {
      await tx.book.update({
        where: { id: entry.bookId },
        data: { nextRevision: entry.revisionDate },
      });
    }

    return queue;
  });
}
