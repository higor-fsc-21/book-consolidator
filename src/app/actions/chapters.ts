"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { booksTag, bookTag } from "@/lib/cache-tags";
import * as chaptersService from "@/domain/services/chapters";

export async function createChapter(
  bookId: string,
  data: { title: string; description?: string },
) {
  const user = await getCurrentUser();
  await chaptersService.addChapter(user.id, bookId, data);
  revalidateTag(booksTag(user.id));
  revalidateTag(bookTag(bookId));
  revalidatePath(`/livros/${bookId}`);
}

export async function toggleChapterRead(bookId: string, chapterId: string) {
  const user = await getCurrentUser();
  await chaptersService.toggleChapterRead(user.id, bookId, chapterId);
  revalidateTag(booksTag(user.id));
  revalidateTag(bookTag(bookId));
  revalidatePath(`/livros/${bookId}`);
  revalidatePath(`/livros/${bookId}/capitulos/${chapterId}`);
}
