import type { Book, Question, RevisionSession, SessionMode } from "./types";
import { COVER_GRADIENTS } from "./constants";

export const avgScore = (book: Book): number | null => {
  const completed = book.sessions.filter(
    (s) => s.completedAt !== null && s.score !== null,
  );
  if (completed.length === 0) return null;
  return Math.round(
    completed.reduce((a, s) => a + (s.score ?? 0), 0) / completed.length,
  );
};

export const getReadingBook = (books: Book[]) =>
  books.find((b) => b.status === "reading");

export const getCompletedBooks = (books: Book[]) =>
  books.filter((b) => b.status === "completed");

// Picks the most overdue book by nextRevision, falling back to the current read.
export const getRecommendedBook = (books: Book[]) => {
  const overdue = [...books]
    .filter((b): b is Book & { nextRevision: Date } => b.nextRevision !== null)
    .sort((a, b) => a.nextRevision.getTime() - b.nextRevision.getTime())[0];
  return overdue ?? books.find((b) => b.status === "reading");
};

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

export const daysSince = (date: Date, from: Date = new Date()): number =>
  Math.floor((from.getTime() - date.getTime()) / 86400000);

// View-model projection matching the UI's original mock RevisionRecord shape.
export interface RevisionRecord {
  id: string;
  date: string;
  mode: SessionMode;
  score: number;
  questionsCount: number;
  difficultTopics: string[];
}

const chapterTitleByQuestionId = (book: Book): Map<string, string> => {
  const map = new Map<string, string>();
  for (const chapter of book.chapters) {
    for (const question of chapter.questions) {
      map.set(question.id, chapter.title);
    }
  }
  return map;
};

const toRevisionRecord = (
  session: RevisionSession,
  titleByQuestion: Map<string, string>,
): RevisionRecord => {
  const difficultTopics = [
    ...new Set(
      session.attempts
        .filter((a) => a.performance !== "correct")
        .map((a) =>
          a.questionId ? titleByQuestion.get(a.questionId) : undefined,
        )
        .filter((t): t is string => Boolean(t)),
    ),
  ];
  return {
    id: session.id,
    date: (session.completedAt ?? session.startedAt).toISOString().slice(0, 10),
    mode: session.mode ?? "direct",
    score: Math.round(session.score ?? 0),
    questionsCount: session.attempts.length,
    difficultTopics,
  };
};

export const revisionRecords = (book: Book): RevisionRecord[] => {
  const titleByQuestion = chapterTitleByQuestionId(book);
  return book.sessions
    .filter((s) => s.completedAt !== null && s.score !== null)
    .map((s) => toRevisionRecord(s, titleByQuestion));
};

export interface TimelineEntry extends RevisionRecord {
  book: Book;
}

export const timeline = (books: Book[], limit = 8): TimelineEntry[] =>
  books
    .flatMap((b) => revisionRecords(b).map((r) => ({ ...r, book: b })))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, limit);

// Performance of a question's latest attempt across all of the book's sessions.
export const lastPerformance = (question: Question, book: Book) => {
  const attempts = book.sessions
    .flatMap((s) => s.attempts)
    .filter((a) => a.questionId === question.id)
    .sort((a, b) => b.attemptedAt.getTime() - a.attemptedAt.getTime());
  return attempts[0]?.performance;
};

// Deterministic fallback cover so books without a coverUrl still render distinct art (D30).
export const coverGradient = (bookId: string): [string, string] => {
  let hash = 0;
  for (let i = 0; i < bookId.length; i++) {
    hash = (hash * 31 + bookId.charCodeAt(i)) >>> 0;
  }
  return COVER_GRADIENTS[hash % COVER_GRADIENTS.length];
};

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
