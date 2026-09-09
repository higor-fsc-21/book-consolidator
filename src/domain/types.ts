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
  text: string;
  answer: string;
  lastPerformance?: Performance;
  difficulty: Difficulty;
}

export interface Chapter {
  id: string;
  bookId: string;
  number: number;
  title: string;
  description?: string;
  summary?: string;
  questions: Question[];
  isRead: boolean;
}

export interface RevisionRecord {
  id: string;
  date: string;
  mode: SessionMode;
  score: number;
  questionsCount: number;
  difficultTopics: string[];
}

export interface Book {
  id: string;
  title: string;
  author: string;
  coverGradient: [string, string];
  status: ReadingStatus;
  importance: Importance;
  startDate?: string;
  endDate?: string;
  currentChapter?: number;
  totalChapters: number;
  consolidationState: ConsolidationState;
  lastRevision?: string;
  nextRevision?: string;
  revisions: RevisionRecord[];
  chapters: Chapter[];
  summary?: string;
  pages?: number;
  year?: number;
}

export interface RevisionSession {
  id: string;
  bookId: string;
  chapterId?: string;
  mode?: SessionMode;
  createdAt: string;
}
