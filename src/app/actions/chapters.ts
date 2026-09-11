"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { booksTag, bookTag } from "@/lib/cache-tags";
import * as chaptersService from "@/domain/services/chapters";
import {
  CreateChapterInputSchema,
  UpdateChapterInputSchema,
  UuidSchema,
  type ActionResult,
} from "@/lib/validators";

export async function createChapter(
  bookId: string,
  data: unknown,
): Promise<ActionResult<{ id: string }>> {
  const user = await getCurrentUser();
  const bookIdParsed = UuidSchema.safeParse(bookId);
  if (!bookIdParsed.success) {
    return { success: false, error: "ID de livro inválido" };
  }

  const parsed = CreateChapterInputSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: "Dados do capítulo inválidos",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const chapter = await chaptersService.addChapter(
    user.id,
    bookIdParsed.data,
    parsed.data,
  );
  revalidateTag(booksTag(user.id));
  revalidateTag(bookTag(bookIdParsed.data));
  revalidatePath(`/livros/${bookIdParsed.data}`);
  return { success: true, data: { id: chapter.id } };
}

export async function updateChapter(
  bookId: string,
  chapterId: string,
  data: unknown,
): Promise<ActionResult> {
  const user = await getCurrentUser();
  const bookIdParsed = UuidSchema.safeParse(bookId);
  const chapterIdParsed = UuidSchema.safeParse(chapterId);
  if (!bookIdParsed.success || !chapterIdParsed.success) {
    return { success: false, error: "Identificadores inválidos" };
  }

  const parsed = UpdateChapterInputSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: "Dados de atualização inválidos",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  await chaptersService.updateChapter(
    user.id,
    bookIdParsed.data,
    chapterIdParsed.data,
    parsed.data,
  );
  revalidateTag(booksTag(user.id));
  revalidateTag(bookTag(bookIdParsed.data));
  revalidatePath(`/livros/${bookIdParsed.data}`);
  revalidatePath(
    `/livros/${bookIdParsed.data}/capitulos/${chapterIdParsed.data}`,
  );
  return { success: true };
}

export async function deleteChapter(
  bookId: string,
  chapterId: string,
): Promise<ActionResult> {
  const user = await getCurrentUser();
  const bookIdParsed = UuidSchema.safeParse(bookId);
  const chapterIdParsed = UuidSchema.safeParse(chapterId);
  if (!bookIdParsed.success || !chapterIdParsed.success) {
    return { success: false, error: "Identificadores inválidos" };
  }

  await chaptersService.deleteChapter(
    user.id,
    bookIdParsed.data,
    chapterIdParsed.data,
  );
  revalidateTag(booksTag(user.id));
  revalidateTag(bookTag(bookIdParsed.data));
  revalidatePath(`/livros/${bookIdParsed.data}`);
  return { success: true };
}

export async function toggleChapterRead(
  bookId: string,
  chapterId: string,
): Promise<ActionResult> {
  const user = await getCurrentUser();
  const bookIdParsed = UuidSchema.safeParse(bookId);
  const chapterIdParsed = UuidSchema.safeParse(chapterId);
  if (!bookIdParsed.success || !chapterIdParsed.success) {
    return { success: false, error: "Identificadores inválidos" };
  }

  await chaptersService.toggleChapterRead(
    user.id,
    bookIdParsed.data,
    chapterIdParsed.data,
  );
  revalidateTag(booksTag(user.id));
  revalidateTag(bookTag(bookIdParsed.data));
  revalidatePath(`/livros/${bookIdParsed.data}`);
  revalidatePath(
    `/livros/${bookIdParsed.data}/capitulos/${chapterIdParsed.data}`,
  );
  return { success: true };
}
