"use server";

import { revalidatePath } from "next/cache";
import type { Question } from "@/domain/types";
import { store } from "@/domain/store";
import * as questionsService from "@/domain/services/questions";

export async function createQuestion(
  bookId: string,
  chapterId: string,
  question: Omit<Question, "id">,
) {
  store.books = questionsService.addQuestion(
    store.books,
    bookId,
    chapterId,
    question,
  );
  revalidatePath(`/livros/${bookId}`);
  revalidatePath(`/livros/${bookId}/capitulos/${chapterId}`);
}
