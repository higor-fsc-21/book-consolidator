import type {
  Book,
  ConsolidationState,
  Performance,
  Question,
  RevisionSession,
  SessionAttempt,
  SessionMode,
} from "./types"
import { COVER_GRADIENTS, importanceLabels } from "./constants"
import { consolidationStateFor, startOfUtcDay } from "./scheduling"

const completedSessionsOf = (book: Book): RevisionSession[] =>
  book.sessions.filter((s) => s.completedAt !== null && s.score !== null)

export const avgScore = (book: Book): number | null => {
  const completed = completedSessionsOf(book)
  if (completed.length === 0) return null
  return Math.round(
    completed.reduce((a, s) => a + (s.score ?? 0), 0) / completed.length,
  )
}

export const getReadingBook = (books: Book[]) =>
  books.find((b) => b.status === "reading")

export const getCompletedBooks = (books: Book[]) =>
  books.filter((b) => b.status === "completed")

export const effectiveConsolidationState = (
  book: Book,
  now: Date = new Date(),
): ConsolidationState =>
  consolidationStateFor({
    current: book.consolidationState,
    completedSessions: completedSessionsOf(book).map((s) => ({
      score: s.score ?? 0,
      completedAt: s.completedAt as Date,
    })),
    now,
  })

export const pendingSessions = (book: Book): RevisionSession[] =>
  book.sessions
    .filter((s) => s.completedAt === null)
    .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime())

export const pendingSessionsFor = (books: Book[]): RevisionSession[] =>
  books
    .flatMap((book) => pendingSessions(book))
    .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime())

export const importanceLabel = (book: Book): string =>
  importanceLabels[book.importance]

// Picks the most overdue book whose nextRevision is on or before today,
// falling back to the current read.
export const getRecommendedBook = (books: Book[], now: Date = new Date()) => {
  const today = startOfUtcDay(now)
  const due = [...books]
    .filter(
      (b): b is Book & { nextRevision: Date } =>
        b.nextRevision !== null &&
        startOfUtcDay(b.nextRevision).getTime() <= today.getTime(),
    )
    .sort((a, b) => a.nextRevision.getTime() - b.nextRevision.getTime())[0]
  return due ?? books.find((b) => b.status === "reading")
}

export const isRevisionDueToday = (
  book: Book,
  now: Date = new Date(),
): boolean => {
  if (!book.nextRevision) return false
  return (
    startOfUtcDay(book.nextRevision).getTime() <= startOfUtcDay(now).getTime()
  )
}

export const readChapters = (book: Book) =>
  book.chapters.filter((c) => c.isRead).length

export const readingProgress = (book: Book): number =>
  book.totalChapters > 0 && readChapters(book) > 0
    ? Math.round((readChapters(book) / book.totalChapters) * 100)
    : 0

export const totalQuestions = (book: Book) =>
  book.chapters.reduce((a, c) => a + c.questions.length, 0)

export const chaptersWithQuestions = (book: Book) =>
  book.chapters.filter((c) => c.questions.length > 0)

export const daysSince = (date: Date, from: Date = new Date()): number =>
  Math.floor((from.getTime() - date.getTime()) / 86400000)

// View-model projection matching the UI's original mock RevisionRecord shape.
export interface RevisionRecord {
  id: string
  date: string
  mode: SessionMode
  score: number
  questionsCount: number
  difficultTopics: string[]
}

const chapterTitleByQuestionId = (book: Book): Map<string, string> => {
  const map = new Map<string, string>()
  for (const chapter of book.chapters) {
    for (const question of chapter.questions) {
      map.set(question.id, chapter.title)
    }
  }
  return map
}

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
  ]
  return {
    id: session.id,
    date: (session.completedAt ?? session.startedAt).toISOString().slice(0, 10),
    mode: session.mode ?? "direct",
    score: Math.round(session.score ?? 0),
    questionsCount: session.attempts.length,
    difficultTopics,
  }
}

export const revisionRecords = (book: Book): RevisionRecord[] => {
  const titleByQuestion = chapterTitleByQuestionId(book)
  return completedSessionsOf(book).map((s) =>
    toRevisionRecord(s, titleByQuestion),
  )
}

export interface SessionAttemptView {
  id: string
  questionId: string | null
  questionText: string | null
  chapterTitle: string | null
  performance: Performance
  attemptedAt: Date
}

export interface SessionHistoryEntry {
  id: string
  startedAt: Date
  completedAt: Date | null
  mode: SessionMode | null
  score: number | null
  pending: boolean
  questionsCount: number
  attempts: SessionAttemptView[]
  difficultTopics: string[]
}

const questionMeta = (book: Book): Map<string, {
  text: string
  chapterTitle: string
}> => {
  const map = new Map<string, {
    text: string
    chapterTitle: string
  }>()
  for (const chapter of book.chapters) {
    for (const question of chapter.questions) {
      map.set(question.id, {
        text: question.text,
        chapterTitle: chapter.title,
      })
    }
  }
  return map
}

const toAttemptView = (
  attempt: SessionAttempt,
  meta: Map<string, {
    text: string
    chapterTitle: string
  }>,
): SessionAttemptView => {
  const info = attempt.questionId ? meta.get(attempt.questionId) : undefined
  return {
    id: attempt.id,
    questionId: attempt.questionId,
    questionText: info?.text ?? null,
    chapterTitle: info?.chapterTitle ?? null,
    performance: attempt.performance,
    attemptedAt: attempt.attemptedAt,
  }
}

export const sessionHistory = (book: Book): SessionHistoryEntry[] => {
  const meta = questionMeta(book)
  return [...book.sessions]
    .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime())
    .map((session) => {
      const attempts = session.attempts.map((a) => toAttemptView(a, meta))
      const difficultTopics = [
        ...new Set(
          attempts
            .filter((a) => a.performance !== "correct" && a.chapterTitle)
            .map((a) => a.chapterTitle as string),
        ),
      ]
      return {
        id: session.id,
        startedAt: session.startedAt,
        completedAt: session.completedAt,
        mode: session.mode,
        score: session.score === null ? null : Math.round(session.score),
        pending: session.completedAt === null,
        questionsCount: attempts.length,
        attempts,
        difficultTopics,
      }
    })
}

export interface TimelineEntry extends RevisionRecord {
  book: Book
}

export const timeline = (books: Book[], limit = 8): TimelineEntry[] =>
  books
    .flatMap((b) => revisionRecords(b).map((r) => ({ ...r, book: b })))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, limit)

// Performance of a question's latest attempt across all of the book's sessions.
export const lastPerformance = (question: Question, book: Book) => {
  const attempts = book.sessions
    .flatMap((s) => s.attempts)
    .filter((a) => a.questionId === question.id)
    .sort((a, b) => b.attemptedAt.getTime() - a.attemptedAt.getTime())
  return attempts[0]?.performance
}

// Deterministic fallback cover so books without a coverUrl still render distinct art (D30).
export const coverGradient = (bookId: string): [string, string] => {
  let hash = 0
  for (let i = 0; i < bookId.length; i++) {
    hash = (hash * 31 + bookId.charCodeAt(i)) >>> 0
  }
  return COVER_GRADIENTS[hash % COVER_GRADIENTS.length]
}

export interface ScoreTally {
  correct: number
  partial: number
  wrong: number
  total: number
}

export const calculateScore = ({
  correct,
  partial,
  total,
}: ScoreTally): number =>
  total > 0 ? Math.round(((correct + partial * 0.5) / total) * 100) : 0
