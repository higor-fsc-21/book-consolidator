import "server-only";
import { db } from "@/lib/db";
import { calculateScore } from "../derived";
import type { Performance, SessionMode } from "../types";

export async function startSession(
  userId: string,
  data: { bookId: string; chapterId?: string; mode?: SessionMode },
) {
  await db.book.findFirstOrThrow({
    where: { id: data.bookId, userId, deletedAt: null },
  });
  return db.revisionSession.create({
    data: {
      userId,
      bookId: data.bookId,
      chapterId: data.chapterId ?? null,
      mode: data.mode ?? null,
      startedAt: new Date(),
    },
  });
}

export interface SessionPerformanceEntry {
  questionId: string | null;
  performance: Performance;
}

export async function completeSession(
  userId: string,
  sessionId: string,
  mode: SessionMode,
  entries: SessionPerformanceEntry[],
) {
  const session = await db.revisionSession.findFirstOrThrow({
    where: { id: sessionId, userId },
  });

  const correct = entries.filter((e) => e.performance === "correct").length;
  const partial = entries.filter((e) => e.performance === "partial").length;
  const wrong = entries.filter((e) => e.performance === "wrong").length;
  const score = calculateScore({
    correct,
    partial,
    wrong,
    total: entries.length,
  });

  if (entries.length > 0) {
    await db.sessionAttempt.createMany({
      data: entries.map((e) => ({
        sessionId,
        questionId: e.questionId,
        performance: e.performance,
      })),
    });
  }

  const completedAt = new Date();
  await db.revisionSession.update({
    where: { id: sessionId },
    data: { mode, score, completedAt },
  });

  await db.book.update({
    where: { id: session.bookId },
    data: { lastRevision: completedAt },
  });

  return { bookId: session.bookId, score };
}
