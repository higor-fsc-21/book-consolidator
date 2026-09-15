import { describe, expect, it } from "vitest"
import {
  avgScore,
  calculateScore,
  coverGradient,
  effectiveConsolidationState,
  getCompletedBooks,
  getReadingBook,
  getRecommendedBook,
  importanceLabel,
  isRevisionDueToday,
  lastPerformance,
  pendingSessions,
  pendingSessionsFor,
  readChapters,
  readingProgress,
  revisionRecords,
  sessionHistory,
  timeline,
  totalQuestions,
} from "./derived"
import type { Book, Question, RevisionSession } from "./types"

const makeQuestion = (id: string, text = "Question"): Question => ({
  id,
  chapterId: "c1",
  text,
  answer: "Answer",
  difficulty: "medium",
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
})

const makeBook = (overrides: Partial<Book> = {}): Book => ({
  id: "b1",
  userId: "u1",
  title: "Book Title",
  author: "Author",
  status: "reading",
  importance: 2,
  startDate: new Date("2026-01-01T00:00:00.000Z"),
  endDate: null,
  currentChapter: 1,
  totalChapters: 2,
  consolidationState: "consolidating",
  nextRevision: null,
  lastRevision: null,
  summary: null,
  pages: 200,
  year: 2024,
  coverUrl: null,
  googleBooksId: null,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  chapters: [
    {
      id: "c1",
      bookId: "b1",
      number: 1,
      title: "Chapter 1",
      description: null,
      summary: null,
      isRead: true,
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-01T00:00:00.000Z"),
      questions: [
        makeQuestion("q1", "Question 1"),
        makeQuestion("q2", "Question 2"),
      ],
    },
    {
      id: "c2",
      bookId: "b1",
      number: 2,
      title: "Chapter 2",
      description: null,
      summary: null,
      isRead: false,
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-01T00:00:00.000Z"),
      questions: [],
    },
  ],
  sessions: [],
  ...overrides,
})

describe("derived domain helpers", () => {
  it("calculates score from tallies correctly (D16)", () => {
    expect(
      calculateScore({ correct: 8, partial: 2, wrong: 0, total: 10 }),
    ).toBe(90)
    expect(calculateScore({ correct: 0, partial: 0, wrong: 5, total: 5 })).toBe(
      0,
    )
    expect(calculateScore({ correct: 0, partial: 0, wrong: 0, total: 0 })).toBe(
      0,
    )
  })

  it("calculates avgScore only for completed sessions with scores", () => {
    const book = makeBook({
      sessions: [
        {
          id: "s1",
          userId: "u1",
          bookId: "b1",
          chapterId: null,
          mode: "direct",
          score: 80,
          startedAt: new Date("2026-01-01T00:00:00.000Z"),
          completedAt: new Date("2026-01-01T00:10:00.000Z"),
          createdAt: new Date("2026-01-01T00:00:00.000Z"),
          attempts: [],
        },
        {
          id: "s2",
          userId: "u1",
          bookId: "b1",
          chapterId: null,
          mode: "guided",
          score: 100,
          startedAt: new Date("2026-01-02T00:00:00.000Z"),
          completedAt: new Date("2026-01-02T00:10:00.000Z"),
          createdAt: new Date("2026-01-02T00:00:00.000Z"),
          attempts: [],
        },
        {
          id: "s3",
          userId: "u1",
          bookId: "b1",
          chapterId: null,
          mode: null,
          score: null,
          startedAt: new Date("2026-01-03T00:00:00.000Z"),
          completedAt: null,
          createdAt: new Date("2026-01-03T00:00:00.000Z"),
          attempts: [],
        },
      ],
    })

    expect(avgScore(book)).toBe(90)
    expect(avgScore(makeBook())).toBeNull()
  })

  it("computes reading status filters and progress", () => {
    const b1 = makeBook({ id: "b1", status: "reading" })
    const b2 = makeBook({ id: "b2", status: "completed" })
    const books = [b1, b2]

    expect(getReadingBook(books)?.id).toBe("b1")
    expect(getCompletedBooks(books).map((b) => b.id)).toEqual(["b2"])
    expect(readChapters(b1)).toBe(1)
    expect(readingProgress(b1)).toBe(50)
    expect(totalQuestions(b1)).toBe(2)
    expect(importanceLabel(b1)).toBe("Importante")
  })

  it("computes pending sessions", () => {
    const sPending: RevisionSession = {
      id: "s1",
      userId: "u1",
      bookId: "b1",
      chapterId: null,
      mode: null,
      score: null,
      startedAt: new Date("2026-01-01T00:00:00.000Z"),
      completedAt: null,
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      attempts: [],
    }
    const book = makeBook({ sessions: [sPending] })
    expect(pendingSessions(book)).toHaveLength(1)
    expect(pendingSessionsFor([book])).toHaveLength(1)
  })

  it("detects due revisions and gets recommended book", () => {
    const now = new Date("2026-06-01T12:00:00.000Z")
    const dueBook = makeBook({
      id: "b-due",
      nextRevision: new Date("2026-06-01T00:00:00.000Z"),
    })
    const futureBook = makeBook({
      id: "b-future",
      nextRevision: new Date("2026-06-10T00:00:00.000Z"),
    })

    expect(isRevisionDueToday(dueBook, now)).toBe(true)
    expect(isRevisionDueToday(futureBook, now)).toBe(false)

    expect(getRecommendedBook([futureBook, dueBook], now)?.id).toBe("b-due")
  })

  it("derives deterministic cover gradient from bookId (D30/D41)", () => {
    const grad1 = coverGradient("book-123")
    const grad2 = coverGradient("book-123")
    const grad3 = coverGradient("book-456")

    expect(grad1).toEqual(grad2)
    expect(Array.isArray(grad1)).toBe(true)
    expect(grad1).toHaveLength(2)
  })

  it("maps revision records and session history with attempts and difficult topics", () => {
    const book = makeBook({
      sessions: [
        {
          id: "s1",
          userId: "u1",
          bookId: "b1",
          chapterId: null,
          mode: "direct",
          score: 50,
          startedAt: new Date("2026-01-01T10:00:00.000Z"),
          completedAt: new Date("2026-01-01T10:15:00.000Z"),
          createdAt: new Date("2026-01-01T10:00:00.000Z"),
          attempts: [
            {
              id: "a1",
              sessionId: "s1",
              questionId: "q1",
              performance: "wrong",
              userAnswer: null,
              attemptedAt: new Date("2026-01-01T10:05:00.000Z"),
            },
          ],
        },
      ],
    })

    const records = revisionRecords(book)
    expect(records).toHaveLength(1)
    expect(records[0].difficultTopics).toEqual(["Chapter 1"])

    const history = sessionHistory(book)
    expect(history).toHaveLength(1)
    expect(history[0].difficultTopics).toEqual(["Chapter 1"])
    expect(history[0].attempts[0].questionText).toBe("Question 1")

    const t = timeline([book])
    expect(t).toHaveLength(1)
    expect(t[0].book.id).toBe("b1")
  })

  it("resolves lastPerformance for a question across sessions", () => {
    const q1 = makeQuestion("q1")
    const book = makeBook({
      sessions: [
        {
          id: "s1",
          userId: "u1",
          bookId: "b1",
          chapterId: null,
          mode: "direct",
          score: 50,
          startedAt: new Date("2026-01-01T10:00:00.000Z"),
          completedAt: new Date("2026-01-01T10:15:00.000Z"),
          createdAt: new Date("2026-01-01T10:00:00.000Z"),
          attempts: [
            {
              id: "a1",
              sessionId: "s1",
              questionId: "q1",
              performance: "wrong",
              userAnswer: null,
              attemptedAt: new Date("2026-01-01T10:05:00.000Z"),
            },
            {
              id: "a2",
              sessionId: "s1",
              questionId: "q1",
              performance: "correct",
              userAnswer: null,
              attemptedAt: new Date("2026-01-01T10:10:00.000Z"),
            },
          ],
        },
      ],
    })

    expect(lastPerformance(q1, book)).toBe("correct")
  })
})
