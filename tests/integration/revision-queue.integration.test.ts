import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { rebuildRevisionQueueForUser } from "@/domain/services/revisionQueue";
import { addBook } from "@/domain/services/books";
import { createUser, resetDatabase } from "./helpers/db";

describe("revision queue integration", () => {
  beforeEach(async () => {
    await resetDatabase(db);
  });

  it("rebuilds only the current user's eligible books", async () => {
    const userA = await createUser(db, {
      name: "User A",
      email: "queue-a@example.com",
    });
    const userB = await createUser(db, {
      name: "User B",
      email: "queue-b@example.com",
    });

    const bookA = await addBook(userA.id, {
      title: "Older revision",
      author: "Author A",
      status: "completed",
      importance: 3,
      totalChapters: 1,
      nextRevision: new Date("2026-05-30T00:00:00.000Z"),
    });
    const bookAImportant = await addBook(userA.id, {
      title: "Important revision",
      author: "Author A",
      status: "completed",
      importance: 1,
      totalChapters: 1,
      nextRevision: new Date("2026-05-30T00:00:00.000Z"),
    });
    const bookAReading = await addBook(userA.id, {
      title: "Still reading",
      author: "Author A",
      status: "reading",
      importance: 1,
      totalChapters: 1,
      nextRevision: new Date("2026-05-30T00:00:00.000Z"),
    });
    const bookB = await addBook(userB.id, {
      title: "Other user",
      author: "Author B",
      status: "completed",
      importance: 1,
      totalChapters: 1,
      nextRevision: new Date("2026-05-30T00:00:00.000Z"),
    });

    const queue = await rebuildRevisionQueueForUser(
      userA.id,
      new Date("2026-06-01T12:00:00.000Z"),
    );

    expect(queue.map((entry) => entry.bookId)).toEqual([
      bookAImportant.id,
      bookA.id,
    ]);
    expect(queue.map((entry) => entry.revisionDate.toISOString())).toEqual([
      "2026-06-01T00:00:00.000Z",
      "2026-06-02T00:00:00.000Z",
    ]);

    const persisted = await db.book.findMany({
      where: {
        id: { in: [bookA.id, bookAImportant.id, bookAReading.id, bookB.id] },
      },
      orderBy: { title: "asc" },
      select: { id: true, status: true, nextRevision: true },
    });
    expect(persisted.find((book) => book.id === bookA.id)?.status).toBe(
      "completed",
    );
    expect(
      persisted.find((book) => book.id === bookAReading.id)?.nextRevision,
    ).toEqual(new Date("2026-05-30T00:00:00.000Z"));
    expect(
      persisted.find((book) => book.id === bookB.id)?.nextRevision,
    ).toEqual(new Date("2026-05-30T00:00:00.000Z"));
  });
});
