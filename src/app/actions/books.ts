"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { booksTag, bookTag } from "@/lib/cache-tags";
import * as booksService from "@/domain/services/books";

export async function createBook(data: booksService.NewBookData) {
  const user = await getCurrentUser();
  await booksService.addBook(user.id, data);
  revalidateTag(booksTag(user.id));
  revalidatePath("/");
  revalidatePath("/biblioteca");
}

export async function updateBook(
  id: string,
  updates: booksService.BookUpdateData,
) {
  const user = await getCurrentUser();
  await booksService.updateBook(user.id, id, updates);
  revalidateTag(booksTag(user.id));
  revalidateTag(bookTag(id));
  revalidatePath("/");
  revalidatePath("/biblioteca");
  revalidatePath(`/livros/${id}`);
}

export async function startReading(bookId: string) {
  const user = await getCurrentUser();
  await booksService.startReading(user.id, bookId);
  revalidateTag(booksTag(user.id));
  revalidateTag(bookTag(bookId));
  revalidatePath("/");
  revalidatePath("/biblioteca");
  revalidatePath(`/livros/${bookId}`);
}
