import "server-only"
import { db } from "@/lib/db"
import type { CreateQuestionInput, UpdateQuestionInput } from "@/lib/validators"

export type NewQuestionData = CreateQuestionInput
export type QuestionUpdateData = UpdateQuestionInput

export async function addQuestion(
  userId: string,
  bookId: string,
  chapterId: string,
  question: NewQuestionData,
) {
  await db.book.findFirstOrThrow({
    where: { id: bookId, userId, deletedAt: null },
  })
  // Verify chapter belongs to this book
  await db.chapter.findFirstOrThrow({
    where: { id: chapterId, bookId },
  })
  return db.question.create({
    data: {
      chapterId,
      text: question.text,
      answer: question.answer,
      difficulty: question.difficulty ?? "medium",
    },
  })
}

export async function updateQuestion(
  userId: string,
  bookId: string,
  questionId: string,
  updates: QuestionUpdateData,
) {
  await db.book.findFirstOrThrow({
    where: { id: bookId, userId, deletedAt: null },
  })
  const question = await db.question.findUniqueOrThrow({
    where: { id: questionId },
    include: { chapter: true },
  })
  if (question.chapter.bookId !== bookId) {
    throw new Error("Question does not belong to the specified book")
  }

  return db.question.update({
    where: { id: questionId },
    data: updates,
  })
}

export async function deleteQuestion(
  userId: string,
  bookId: string,
  questionId: string,
) {
  return db.$transaction(async (tx) => {
    await tx.book.findFirstOrThrow({
      where: { id: bookId, userId, deletedAt: null },
    })
    const question = await tx.question.findUniqueOrThrow({
      where: { id: questionId },
      include: { chapter: true },
    })
    if (question.chapter.bookId !== bookId) {
      throw new Error("Question does not belong to the specified book")
    }

    await tx.sessionAttempt.deleteMany({
      where: { questionId },
    })

    return tx.question.delete({
      where: { id: questionId },
    })
  })
}
