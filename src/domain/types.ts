// Mirrors prisma/schema.prisma so the domain layer maps 1:1 onto Prisma reads.
export type ReadingStatus =
  | "want"
  | "reading"
  | "completed"
  | "paused"
  | "archived";
export type ConsolidationState = "consolidating" | "consolidated" | "archived";
export type Importance = 1 | 2 | 3;
export type SessionMode = "direct" | "guided" | "recognition";
export type Performance = "correct" | "partial" | "wrong";
export type Difficulty = "easy" | "medium" | "hard";

export interface Question {
  id: string;
  chapterId: string;
  text: string;
  answer: string;
  difficulty: Difficulty;
  createdAt: Date;
  updatedAt: Date;
}

export interface Chapter {
  id: string;
  bookId: string;
  number: number;
  title: string;
  description: string | null;
  summary: string | null;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
  questions: Question[];
}

export interface SessionAttempt {
  id: string;
  sessionId: string;
  questionId: string | null;
  performance: Performance;
  userAnswer: string | null;
  attemptedAt: Date;
}

// A pending (not yet completed) session has completedAt: null, score: null, mode: null.
export interface RevisionSession {
  id: string;
  userId: string;
  bookId: string;
  chapterId: string | null;
  mode: SessionMode | null;
  score: number | null;
  startedAt: Date;
  completedAt: Date | null;
  createdAt: Date;
  attempts: SessionAttempt[];
}

export interface Book {
  id: string;
  userId: string;
  title: string;
  author: string;
  status: ReadingStatus;
  importance: Importance;
  startDate: Date | null;
  endDate: Date | null;
  currentChapter: number | null;
  totalChapters: number;
  consolidationState: ConsolidationState;
  lastRevision: Date | null;
  nextRevision: Date | null;
  summary: string | null;
  pages: number | null;
  year: number | null;
  coverUrl: string | null;
  googleBooksId: string | null;
  createdAt: Date;
  updatedAt: Date;
  chapters: Chapter[];
  sessions: RevisionSession[];
}
