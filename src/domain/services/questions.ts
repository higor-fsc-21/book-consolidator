import "server-only";
import { db } from "@/lib/db";
import type { Difficulty } from "../types";

export interface NewQuestionData {
  text: string;
  answer: string;
  difficulty: Difficulty;
}

export async function addQuestion(
  userId: string,
  bookId: string,
  chapterId: string,
  question: NewQuestionData,
) {
  await db.book.findFirstOrThrow({
    where: { id: bookId, userId, deletedAt: null },
  });
  return db.question.create({
    data: {
      chapterId,
      text: question.text,
      answer: question.answer,
      difficulty: question.difficulty,
    },
  });
}
