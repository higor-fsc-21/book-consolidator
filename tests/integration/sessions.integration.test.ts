import { beforeEach, describe, expect, it } from "vitest"
import { db } from "@/lib/db"
import { completeSession, startSession } from "@/domain/services/sessions"
import { createUser, resetDatabase } from "./helpers/db"

describe("sessions integration", () => {
  beforeEach(async () => {
    await resetDatabase(db)
  })

  it("starts and completes a session, then updates the book revision state", async () => {
    const user = await createUser(db)

    const book = await db.book.create({
      data: {
        userId: user.id,
        title: "Domain-Driven Design",
        author: "Eric Evans",
        status: "reading",
        importance: 3,
        totalChapters: 1,
        consolidationState: "consolidating",
        startDate: new Date("2026-01-10"),
        chapters: {
          create: [{ number: 1, title: "Introdução" }],
        },
      },
    })

    const chapter = await db.chapter.findFirstOrThrow({
      where: { bookId: book.id },
    })
    const question = await db.question.create({
      data: {
        chapterId: chapter.id,
        text: "What is the key idea?",
        answer: "Model the domain explicitly.",
        difficulty: "medium",
      },
    })

    const session = await startSession(user.id, {
      bookId: book.id,
      chapterId: chapter.id,
      mode: "direct",
    })

    const result = await completeSession(user.id, session.id, "direct", [
      {
        questionId: question.id,
        performance: "correct",
        userAnswer: "Model the domain.",
      },
      {
        questionId: question.id,
        performance: "partial",
        userAnswer: "Domain modeling.",
      },
    ])

    expect(result.score).toBeGreaterThan(0)
    expect(result.nextRevision).toBeInstanceOf(Date)

    const updatedSession = await db.revisionSession.findUniqueOrThrow({
      where: { id: session.id },
    })

    expect(updatedSession.completedAt).not.toBeNull()
    expect(updatedSession.score).toBe(result.score)

    const updatedBook = await db.book.findUniqueOrThrow({
      where: { id: book.id },
    })
    expect(updatedBook.lastRevision).not.toBeNull()
    expect(updatedBook.nextRevision).not.toBeNull()
  })
})
