import type { Book, Chapter } from "../types";
import { newId } from "../ids";

export const addChapter = (
  books: Book[],
  bookId: string,
  data: { title: string; description?: string },
): Book[] =>
  books.map((b) => {
    if (b.id !== bookId) return b;
    const number =
      b.chapters.reduce((max, c) => Math.max(max, c.number), 0) + 1;
    const chapter: Chapter = {
      id: newId(),
      bookId: b.id,
      number,
      title: data.title.trim() || `Capítulo ${number}`,
      description: data.description?.trim() || undefined,
      questions: [],
      isRead: false,
    };
    return {
      ...b,
      chapters: [...b.chapters, chapter],
      totalChapters: Math.max(b.totalChapters, number),
    };
  });

export const toggleChapterRead = (
  books: Book[],
  bookId: string,
  chapterId: string,
): Book[] =>
  books.map((b) => {
    if (b.id !== bookId) return b;
    const chapters = b.chapters.map((c) =>
      c.id === chapterId ? { ...c, isRead: !c.isRead } : c,
    );
    const readCount = chapters.filter((c) => c.isRead).length;
    return {
      ...b,
      chapters,
      currentChapter: Math.min(readCount + 1, b.totalChapters),
    };
  });
