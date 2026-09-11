import "server-only";
import type {
  Prisma,
  Book as PrismaBook,
  Chapter as PrismaChapter,
  Question as PrismaQuestion,
  RevisionSession as PrismaRevisionSession,
  SessionAttempt as PrismaSessionAttempt,
} from "@prisma/client";
import type {
  Book,
  Chapter,
  Importance,
  Question,
  RevisionSession,
  SessionAttempt,
} from "../types";

export const bookInclude = {
  chapters: {
    orderBy: { number: "asc" },
    include: { questions: { orderBy: { createdAt: "asc" } } },
  },
  sessions: {
    orderBy: { startedAt: "asc" },
    include: { attempts: { orderBy: { attemptedAt: "asc" } } },
  },
} satisfies Prisma.BookInclude;

type RawQuestion = PrismaQuestion;
type RawChapter = PrismaChapter & { questions: RawQuestion[] };
export type RawAttempt = PrismaSessionAttempt;
export type RawSession = PrismaRevisionSession & { attempts: RawAttempt[] };
type RawBook = PrismaBook & { chapters: RawChapter[]; sessions: RawSession[] };

// unstable_cache may round-trip Date fields through JSON, so every read is
// normalized back into real Date instances regardless of cache hit/miss.
const toDate = (v: Date | string): Date =>
  v instanceof Date ? v : new Date(v);
const toDateOrNull = (v: Date | string | null): Date | null =>
  v == null ? null : toDate(v);

function reviveQuestion(raw: RawQuestion): Question {
  return {
    ...raw,
    createdAt: toDate(raw.createdAt),
    updatedAt: toDate(raw.updatedAt),
  };
}

function reviveChapter(raw: RawChapter): Chapter {
  return {
    ...raw,
    createdAt: toDate(raw.createdAt),
    updatedAt: toDate(raw.updatedAt),
    questions: raw.questions.map(reviveQuestion),
  };
}

export function reviveAttempt(raw: RawAttempt): SessionAttempt {
  return { ...raw, attemptedAt: toDate(raw.attemptedAt) };
}

export function reviveSession(raw: RawSession): RevisionSession {
  return {
    ...raw,
    startedAt: toDate(raw.startedAt),
    completedAt: toDateOrNull(raw.completedAt),
    createdAt: toDate(raw.createdAt),
    attempts: raw.attempts.map(reviveAttempt),
  };
}

export function reviveBook(raw: RawBook): Book {
  return {
    ...raw,
    importance: raw.importance as Importance,
    startDate: toDateOrNull(raw.startDate),
    endDate: toDateOrNull(raw.endDate),
    lastRevision: toDateOrNull(raw.lastRevision),
    nextRevision: toDateOrNull(raw.nextRevision),
    createdAt: toDate(raw.createdAt),
    updatedAt: toDate(raw.updatedAt),
    chapters: raw.chapters.map(reviveChapter),
    sessions: raw.sessions.map(reviveSession),
  };
}
