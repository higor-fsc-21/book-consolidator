import "server-only"
import { db } from "@/lib/db"
import type { CreateBookInput, UpdateBookInput } from "@/lib/validators"

export type NewBookData = CreateBookInput
export type BookUpdateData = UpdateBookInput

export async function addBook(userId: string, data: NewBookData) {
  return db.book.create({
    data: {
      title: data.title,
      author: data.author,
      status: data.status ?? "want",
      importance: data.importance ?? 2,
      totalChapters: data.totalChapters,
      consolidationState: "consolidating",
      currentChapter: data.currentChapter ?? null,
      startDate: data.startDate ?? null,
      endDate: data.endDate ?? null,
      lastRevision: data.lastRevision ?? null,
      nextRevision: data.nextRevision ?? null,
      summary: data.summary ?? null,
      pages: data.pages ?? null,
      year: data.year ?? null,
      coverUrl: data.coverUrl || null,
      googleBooksId: data.googleBooksId ?? null,
      userId,
      chapters: {
        create: Array.from({ length: data.totalChapters }, (_, i) => ({
          number: i + 1,
          title: `Capítulo ${i + 1}`,
        })),
      },
    },
  })
}

export async function updateBook(
  userId: string,
  id: string,
  updates: BookUpdateData,
) {
  await db.book.findFirstOrThrow({ where: { id, userId, deletedAt: null } })
  return db.book.update({
    where: { id },
    data: {
      ...updates,
      coverUrl: updates.coverUrl === "" ? null : updates.coverUrl,
    },
  })
}

export async function softDeleteBook(userId: string, id: string) {
  await db.book.findFirstOrThrow({ where: { id, userId, deletedAt: null } })
  return db.book.update({
    where: { id },
    data: { deletedAt: new Date() },
  })
}

export async function startReading(userId: string, bookId: string) {
  const book = await db.book.findFirstOrThrow({
    where: { id: bookId, userId, deletedAt: null },
  })
  return db.book.update({
    where: { id: bookId },
    data: {
      status: "reading",
      startDate: book.startDate ?? new Date(),
      currentChapter: book.currentChapter ?? 1,
    },
  })
}
