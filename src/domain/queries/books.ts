import "server-only";
import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";
import { booksTag, bookTag } from "@/lib/cache-tags";
import {
  bookInclude,
  bookSummaryInclude,
  reviveBook,
  reviveBookSummary,
} from "./shared";
import type { Book, BookSummary } from "../types";

export async function getBooksForUser(userId: string): Promise<Book[]> {
  const raw = await unstable_cache(
    async (uid: string) =>
      db.book.findMany({
        where: { userId: uid, deletedAt: null },
        include: bookInclude,
        orderBy: { createdAt: "asc" },
      }),
    ["books-for-user"],
    { tags: [booksTag(userId)] },
  )(userId);
  return raw.map(reviveBook);
}

export async function getBookSummariesForUser(
  userId: string,
): Promise<BookSummary[]> {
  const raw = await unstable_cache(
    async (uid: string) =>
      db.book.findMany({
        where: { userId: uid, deletedAt: null },
        include: bookSummaryInclude,
        orderBy: { createdAt: "asc" },
      }),
    ["book-summaries-for-user"],
    { tags: [booksTag(userId)] },
  )(userId);
  return raw.map(reviveBookSummary);
}

export async function getBookWithEverything(
  userId: string,
  bookId: string,
): Promise<Book | null> {
  const raw = await unstable_cache(
    async (uid: string, id: string) =>
      db.book.findFirst({
        where: { id, userId: uid, deletedAt: null },
        include: bookInclude,
      }),
    ["book-with-everything"],
    { tags: [booksTag(userId), bookTag(bookId)] },
  )(userId, bookId);
  return raw ? reviveBook(raw) : null;
}

export async function getChapterWithQuestions(
  userId: string,
  bookId: string,
  chapterId: string,
) {
  const book = await getBookWithEverything(userId, bookId);
  const chapter = book?.chapters.find((c) => c.id === chapterId) ?? null;
  return { book, chapter };
}
