import type { Book } from "../types";
import { newId } from "../ids";

export type NewBookData = Omit<Book, "id" | "revisions" | "chapters">;

export const addBook = (books: Book[], data: NewBookData): Book[] => {
  const id = newId();
  const newBook: Book = {
    ...data,
    id,
    revisions: [],
    chapters: Array.from({ length: data.totalChapters }, (_, i) => ({
      id: newId(),
      bookId: id,
      number: i + 1,
      title: `Capítulo ${i + 1}`,
      questions: [],
      isRead: false,
    })),
  };
  return [...books, newBook];
};

export const updateBook = (
  books: Book[],
  id: string,
  updates: Partial<Book>,
): Book[] => books.map((b) => (b.id === id ? { ...b, ...updates } : b));

export const startReading = (books: Book[], bookId: string): Book[] =>
  books.map((b) =>
    b.id === bookId
      ? {
          ...b,
          status: "reading",
          startDate: b.startDate ?? new Date().toISOString().slice(0, 10),
          currentChapter: b.currentChapter ?? 1,
        }
      : b,
  );
