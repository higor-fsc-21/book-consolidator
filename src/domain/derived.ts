import type { Book, RevisionRecord } from "./types";

export const avgScore = (book: Book): number | null =>
  book.revisions.length === 0
    ? null
    : Math.round(
        book.revisions.reduce((a, r) => a + r.score, 0) / book.revisions.length,
      );

export const getReadingBook = (books: Book[]) =>
  books.find((b) => b.status === "reading");

export const getCompletedBooks = (books: Book[]) =>
  books.filter((b) => b.status === "completed");

// Preserves the prototype's editorial pick (falls back to the current reading book).
export const getRecommendedBook = (books: Book[]) =>
  books.find((b) => b.id === "b1") ?? books.find((b) => b.status === "reading");

export const readChapters = (book: Book) =>
  book.chapters.filter((c) => c.isRead).length;

export const readingProgress = (book: Book): number =>
  book.totalChapters > 0 && readChapters(book) > 0
    ? Math.round((readChapters(book) / book.totalChapters) * 100)
    : 0;

export const totalQuestions = (book: Book) =>
  book.chapters.reduce((a, c) => a + c.questions.length, 0);

export const chaptersWithQuestions = (book: Book) =>
  book.chapters.filter((c) => c.questions.length > 0);

export const daysSince = (dateStr: string, from: Date = new Date()): number =>
  Math.floor((from.getTime() - new Date(dateStr).getTime()) / 86400000);

export interface TimelineEntry extends RevisionRecord {
  book: Book;
}

export const timeline = (books: Book[], limit = 8): TimelineEntry[] =>
  books
    .flatMap((b) => b.revisions.map((r) => ({ ...r, book: b })))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, limit);

export interface ScoreTally {
  correct: number;
  partial: number;
  wrong: number;
  total: number;
}

export const calculateScore = ({
  correct,
  partial,
  total,
}: ScoreTally): number =>
  total > 0 ? Math.round(((correct + partial * 0.5) / total) * 100) : 0;
