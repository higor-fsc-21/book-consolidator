import { beforeEach, describe, expect, it } from "vitest"
import { db } from "@/lib/db"
import { addBook } from "@/domain/services/books"
import { createUser, resetDatabase } from "./helpers/db"

describe("books integration", () => {
  beforeEach(async () => {
    await resetDatabase(db)
  })

  it("creates a book with the expected chapter placeholders", async () => {
    const user = await createUser(db)

    const book = await addBook(user.id, {
      title: "Clean Code",
      author: "Robert C. Martin",
      status: "reading",
      importance: 2,
      totalChapters: 3,
      currentChapter: 1,
      summary: "Recommended reading",
      pages: 464,
      year: 2008,
    })

    expect(book.title).toBe("Clean Code")
    expect(book.totalChapters).toBe(3)

    const chapters = await db.chapter.findMany({
      where: { bookId: book.id },
      orderBy: { number: "asc" },
    })

    expect(chapters.map((chapter) => chapter.number)).toEqual([1, 2, 3])
    expect(
      chapters.every((chapter) => chapter.title.startsWith("Capítulo")),
    ).toBe(true)
  })
})
