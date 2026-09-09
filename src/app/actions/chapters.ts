"use server";

import { revalidatePath } from "next/cache";
import { store } from "@/domain/store";
import * as chaptersService from "@/domain/services/chapters";

export async function createChapter(
  bookId: string,
  data: { title: string; description?: string },
) {
  store.books = chaptersService.addChapter(store.books, bookId, data);
  revalidatePath(`/livros/${bookId}`);
}

export async function toggleChapterRead(bookId: string, chapterId: string) {
  store.books = chaptersService.toggleChapterRead(
    store.books,
    bookId,
    chapterId,
  );
  revalidatePath(`/livros/${bookId}`);
  revalidatePath(`/livros/${bookId}/capitulos/${chapterId}`);
}
