"use server";

import { revalidatePath } from "next/cache";
import type { Book } from "@/domain/types";
import { store } from "@/domain/store";
import * as booksService from "@/domain/services/books";

export async function createBook(data: booksService.NewBookData) {
  store.books = booksService.addBook(store.books, data);
  revalidatePath("/");
  revalidatePath("/biblioteca");
}

export async function updateBook(id: string, updates: Partial<Book>) {
  store.books = booksService.updateBook(store.books, id, updates);
  revalidatePath("/");
  revalidatePath("/biblioteca");
  revalidatePath(`/livros/${id}`);
}

export async function startReading(bookId: string) {
  store.books = booksService.startReading(store.books, bookId);
  revalidatePath("/");
  revalidatePath("/biblioteca");
  revalidatePath(`/livros/${bookId}`);
}
