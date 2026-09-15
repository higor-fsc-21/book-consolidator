import { beforeEach, describe, expect, it } from "vitest"
import { db } from "@/lib/db"
import {
  getBooksForUser,
  getBookWithEverything,
  getChapterWithQuestions,
} from "@/domain/queries/books"
import { getSessionForUser } from "@/domain/queries/sessions"
import { addBook } from "@/domain/services/books"
import { addQuestion } from "@/domain/services/questions"
import { startSession } from "@/domain/services/sessions"
import { createUser, resetDatabase } from "./helpers/db"

describe("authorization and user data isolation", () => {
  beforeEach(async () => {
    await resetDatabase(db)
  })

  it("ensures a user can only read their own books and chapters", async () => {
    const userA = await createUser(db, {
      name: "User A",
      email: "usera@example.com",
    })
    const userB = await createUser(db, {
      name: "User B",
      email: "userb@example.com",
    })

    const bookA = await addBook(userA.id, {
      title: "Book of A",
      author: "Author A",
      status: "reading",
      importance: 3,
      totalChapters: 2,
    })

    const bookB = await addBook(userB.id, {
      title: "Book of B",
      author: "Author B",
      status: "reading",
      importance: 2,
      totalChapters: 1,
    })

    // Listing isolation
    const booksForA = await getBooksForUser(userA.id)
    expect(booksForA).toHaveLength(1)
    expect(booksForA[0].id).toBe(bookA.id)

    const booksForB = await getBooksForUser(userB.id)
    expect(booksForB).toHaveLength(1)
    expect(booksForB[0].id).toBe(bookB.id)

    // Direct detail isolation
    const bDetailForA = await getBookWithEverything(userA.id, bookB.id)
    expect(bDetailForA).toBeNull()

    const aDetailForB = await getBookWithEverything(userB.id, bookA.id)
    expect(aDetailForB).toBeNull()

    // Chapter with questions isolation
    const chaptersA = await db.chapter.findMany({
      where: { bookId: bookA.id },
      orderBy: { number: "asc" },
    })
    const chapterA = chaptersA[0]
    const chapterDetailForB = await getChapterWithQuestions(
      userB.id,
      bookA.id,
      chapterA.id,
    )
    expect(chapterDetailForB.book).toBeNull()
    expect(chapterDetailForB.chapter).toBeNull()
  })

  it("ensures a user cannot access another user's revision session", async () => {
    const userA = await createUser(db, {
      name: "User A",
      email: "usera2@example.com",
    })
    const userB = await createUser(db, {
      name: "User B",
      email: "userb2@example.com",
    })

    const bookA = await addBook(userA.id, {
      title: "Book of A",
      author: "Author A",
      status: "reading",
      importance: 3,
      totalChapters: 1,
    })

    const chaptersA = await db.chapter.findMany({
      where: { bookId: bookA.id },
      orderBy: { number: "asc" },
    })
    const chapterA = chaptersA[0]
    await addQuestion(userA.id, bookA.id, chapterA.id, {
      text: "Question A",
      answer: "Answer A",
      difficulty: "easy",
    })

    const sessionA = await startSession(userA.id, {
      bookId: bookA.id,
      chapterId: chapterA.id,
      mode: "direct",
    })

    const sessionForA = await getSessionForUser(userA.id, sessionA.id)
    expect(sessionForA).not.toBeNull()
    expect(sessionForA?.session.id).toBe(sessionA.id)

    const sessionForB = await getSessionForUser(userB.id, sessionA.id)
    expect(sessionForB).toBeNull()
  })
})
