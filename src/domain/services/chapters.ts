import "server-only";
import { db } from "@/lib/db";
import type { CreateChapterInput, UpdateChapterInput } from "@/lib/validators";

export type NewChapterData = CreateChapterInput;
export type ChapterUpdateData = UpdateChapterInput;

export async function addChapter(
  userId: string,
  bookId: string,
  data: NewChapterData,
) {
  return db.$transaction(async (tx) => {
    await tx.book.findFirstOrThrow({
      where: { id: bookId, userId, deletedAt: null },
    });
    const last = await tx.chapter.aggregate({
      where: { bookId },
      _max: { number: true },
    });
    const number = (last._max.number ?? 0) + 1;
    const chapter = await tx.chapter.create({
      data: {
        bookId,
        number,
        title: data.title.trim() || `Capítulo ${number}`,
        description: data.description?.trim() || null,
      },
    });
    await tx.book.updateMany({
      where: { id: bookId, totalChapters: { lt: number } },
      data: { totalChapters: number },
    });
    return chapter;
  });
}

export async function updateChapter(
  userId: string,
  bookId: string,
  chapterId: string,
  data: ChapterUpdateData,
) {
  await db.book.findFirstOrThrow({
    where: { id: bookId, userId, deletedAt: null },
  });
  await db.chapter.findFirstOrThrow({
    where: { id: chapterId, bookId },
  });
  return db.chapter.update({
    where: { id: chapterId },
    data: {
      ...(data.title !== undefined ? { title: data.title.trim() } : {}),
      ...(data.description !== undefined
        ? { description: data.description?.trim() || null }
        : {}),
      ...(data.summary !== undefined
        ? { summary: data.summary?.trim() || null }
        : {}),
      ...(data.isRead !== undefined ? { isRead: data.isRead } : {}),
    },
  });
}

export async function deleteChapter(
  userId: string,
  bookId: string,
  chapterId: string,
) {
  return db.$transaction(async (tx) => {
    await tx.book.findFirstOrThrow({
      where: { id: bookId, userId, deletedAt: null },
    });
    await tx.chapter.findFirstOrThrow({
      where: { id: chapterId, bookId },
    });

    const questions = await tx.question.findMany({
      where: { chapterId },
      select: { id: true },
    });
    const questionIds = questions.map((q) => q.id);

    if (questionIds.length > 0) {
      await tx.sessionAttempt.deleteMany({
        where: { questionId: { in: questionIds } },
      });
      await tx.question.deleteMany({
        where: { id: { in: questionIds } },
      });
    }

    const deleted = await tx.chapter.delete({
      where: { id: chapterId },
    });

    const remainingCount = await tx.chapter.count({
      where: { bookId },
    });
    const readCount = await tx.chapter.count({
      where: { bookId, isRead: true },
    });

    await tx.book.update({
      where: { id: bookId },
      data: {
        totalChapters: Math.max(1, remainingCount),
        currentChapter: Math.min(readCount + 1, Math.max(1, remainingCount)),
      },
    });

    return deleted;
  });
}

export async function toggleChapterRead(
  userId: string,
  bookId: string,
  chapterId: string,
) {
  return db.$transaction(async (tx) => {
    await tx.book.findFirstOrThrow({
      where: { id: bookId, userId, deletedAt: null },
    });
    const chapter = await tx.chapter.findFirstOrThrow({
      where: { id: chapterId, bookId },
    });
    const updated = await tx.chapter.update({
      where: { id: chapterId },
      data: { isRead: !chapter.isRead },
    });
    const readCount = await tx.chapter.count({
      where: { bookId, isRead: true },
    });
    const book = await tx.book.findUniqueOrThrow({ where: { id: bookId } });
    await tx.book.update({
      where: { id: bookId },
      data: { currentChapter: Math.min(readCount + 1, book.totalChapters) },
    });
    return updated;
  });
}
