"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { booksTag, bookTag } from "@/lib/cache-tags";
import * as questionsService from "@/domain/services/questions";

export async function createQuestion(
  bookId: string,
  chapterId: string,
  question: questionsService.NewQuestionData,
) {
  const user = await getCurrentUser();
  await questionsService.addQuestion(user.id, bookId, chapterId, question);
  revalidateTag(booksTag(user.id));
  revalidateTag(bookTag(bookId));
  revalidatePath(`/livros/${bookId}`);
  revalidatePath(`/livros/${bookId}/capitulos/${chapterId}`);
}
