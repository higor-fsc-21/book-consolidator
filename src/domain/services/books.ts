import "server-only";
import { db } from "@/lib/db";
import type { Book } from "../types";

export type NewBookData = Pick<
  Book,
  | "title"
  | "author"
  | "status"
  | "importance"
  | "totalChapters"
  | "consolidationState"
> &
  Partial<
    Pick<
      Book,
      | "currentChapter"
      | "startDate"
      | "endDate"
      | "lastRevision"
      | "nextRevision"
      | "summary"
      | "pages"
      | "year"
      | "coverUrl"
      | "googleBooksId"
    >
  >;

export type BookUpdateData = Partial<
  Pick<
    Book,
    | "title"
    | "author"
    | "status"
    | "importance"
    | "startDate"
    | "endDate"
    | "currentChapter"
    | "totalChapters"
    | "consolidationState"
    | "lastRevision"
    | "nextRevision"
    | "summary"
    | "pages"
    | "year"
    | "coverUrl"
    | "googleBooksId"
  >
>;

export async function addBook(userId: string, data: NewBookData) {
  return db.book.create({
    data: {
      ...data,
      currentChapter: data.currentChapter ?? null,
      startDate: data.startDate ?? null,
      endDate: data.endDate ?? null,
      lastRevision: data.lastRevision ?? null,
      nextRevision: data.nextRevision ?? null,
      summary: data.summary ?? null,
      pages: data.pages ?? null,
      year: data.year ?? null,
      userId,
      chapters: {
        create: Array.from({ length: data.totalChapters }, (_, i) => ({
          number: i + 1,
          title: `Capítulo ${i + 1}`,
        })),
      },
    },
  });
}

export async function updateBook(
  userId: string,
  id: string,
  updates: BookUpdateData,
) {
  await db.book.findFirstOrThrow({ where: { id, userId, deletedAt: null } });
  return db.book.update({ where: { id }, data: updates });
}

export async function startReading(userId: string, bookId: string) {
  const book = await db.book.findFirstOrThrow({
    where: { id: bookId, userId, deletedAt: null },
  });
  return db.book.update({
    where: { id: bookId },
    data: {
      status: "reading",
      startDate: book.startDate ?? new Date(),
      currentChapter: book.currentChapter ?? 1,
    },
  });
}
