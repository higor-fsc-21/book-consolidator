import "server-only";
import { db } from "@/lib/db";

export async function addChapter(
  userId: string,
  bookId: string,
  data: { title: string; description?: string },
) {
  await db.book.findFirstOrThrow({
    where: { id: bookId, userId, deletedAt: null },
  });
  const last = await db.chapter.aggregate({
    where: { bookId },
    _max: { number: true },
  });
  const number = (last._max.number ?? 0) + 1;
  const chapter = await db.chapter.create({
    data: {
      bookId,
      number,
      title: data.title.trim() || `Capítulo ${number}`,
      description: data.description?.trim() || null,
    },
  });
  await db.book.updateMany({
    where: { id: bookId, totalChapters: { lt: number } },
    data: { totalChapters: number },
  });
  return chapter;
}

export async function toggleChapterRead(
  userId: string,
  bookId: string,
  chapterId: string,
) {
  await db.book.findFirstOrThrow({
    where: { id: bookId, userId, deletedAt: null },
  });
  const chapter = await db.chapter.findFirstOrThrow({
    where: { id: chapterId, bookId },
  });
  const updated = await db.chapter.update({
    where: { id: chapterId },
    data: { isRead: !chapter.isRead },
  });
  const readCount = await db.chapter.count({
    where: { bookId, isRead: true },
  });
  const book = await db.book.findUniqueOrThrow({ where: { id: bookId } });
  await db.book.update({
    where: { id: bookId },
    data: { currentChapter: Math.min(readCount + 1, book.totalChapters) },
  });
  return updated;
}
