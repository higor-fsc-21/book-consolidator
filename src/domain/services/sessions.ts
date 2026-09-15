import "server-only";
import { db } from "@/lib/db";
import { calculateScore } from "../derived";
import { consolidationStateFor, nextRevisionDate } from "../scheduling";
import type { Performance, SessionMode } from "../types";

export async function startSession(
  userId: string,
  data: {
    bookId: string;
    chapterId?: string;
    mode?: SessionMode;
  },
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
  questionId: string;
  performance: Performance;
  userAnswer?: string | null;
}

export async function completeSession(
  userId: string,
  sessionId: string,
  mode: SessionMode,
  entries: SessionPerformanceEntry[],
) {
  return db.$transaction(async (tx) => {
    const session = await tx.revisionSession.findFirst({
      where: { id: sessionId, userId },
    });
    if (!session) {
      throw new Error("Sessão não encontrada");
    }
    if (session.completedAt !== null) {
      throw new Error("Sessão já concluída");
    }

    const book = await tx.book.findFirstOrThrow({
      where: { id: session.bookId, userId, deletedAt: null },
    });

    await tx.sessionAttempt.createMany({
      data: entries.map((e) => ({
        sessionId,
        questionId: e.questionId,
        performance: e.performance,
        userAnswer: e.userAnswer ?? null,
      })),
    });

    const persisted = await tx.sessionAttempt.findMany({
      where: { sessionId },
    });
    const correct = persisted.filter((e) => e.performance === "correct").length;
    const partial = persisted.filter((e) => e.performance === "partial").length;
    const wrong = persisted.filter((e) => e.performance === "wrong").length;
    const score = calculateScore({
      correct,
      partial,
      wrong,
      total: persisted.length,
    });

    const completedAt = new Date();
    await tx.revisionSession.update({
      where: { id: sessionId },
      data: { mode, score, completedAt },
    });

    const completedSessions = await tx.revisionSession.findMany({
      where: {
        bookId: session.bookId,
        completedAt: { not: null },
        score: { not: null },
      },
      orderBy: { completedAt: "asc" },
      select: { score: true, completedAt: true },
    });

    const firstCompleted = completedSessions[0]?.completedAt ?? completedAt;
    const nextRevision = nextRevisionDate({
      endDate: book.endDate,
      firstCompletedSessionDate: firstCompleted,
      completedAt,
      completedCount: completedSessions.length,
    });
    const consolidationState = consolidationStateFor({
      current: book.consolidationState,
      completedSessions: completedSessions.map((s) => ({
        score: s.score ?? 0,
        completedAt: s.completedAt as Date,
      })),
      now: completedAt,
    });

    await tx.book.update({
      where: { id: session.bookId },
      data: {
        lastRevision: completedAt,
        nextRevision,
        consolidationState,
      },
    });

    return { bookId: session.bookId, score, nextRevision };
  });
}

export async function cancelSession(userId: string, sessionId: string) {
  const session = await db.revisionSession.findFirst({
    where: { id: sessionId, userId },
  });
  if (!session) {
    throw new Error("Sessão não encontrada");
  }
  if (session.completedAt !== null) {
    throw new Error("Sessão já concluída");
  }
  await db.revisionSession.delete({ where: { id: sessionId } });
  return { bookId: session.bookId };
}
