import { beforeEach, describe, expect, it } from "vitest"
import { db } from "@/lib/db"
import { getBooksForUser, getBookWithEverything } from "@/domain/queries/books"
import { addBook, softDeleteBook } from "@/domain/services/books"
import { createUser, resetDatabase } from "./helpers/db"

describe("soft delete behavior", () => {
  beforeEach(async () => {
    await resetDatabase(db)
  })

  it("omits soft-deleted books from listings and detail queries while preserving rows in DB", async () => {
    const user = await createUser(db)

    const book1 = await addBook(user.id, {
      title: "Active Book",
      author: "Active Author",
      status: "reading",
      importance: 2,
      totalChapters: 2,
    })

    const book2 = await addBook(user.id, {
      title: "Book to Delete",
      author: "Deleted Author",
      status: "want",
      importance: 1,
      totalChapters: 1,
    })

    // Before soft-delete
    let books = await getBooksForUser(user.id)
    expect(books).toHaveLength(2)

    // Perform soft-delete
    await softDeleteBook(user.id, book2.id)

    // After soft-delete: listing should only contain book1
    books = await getBooksForUser(user.id)
    expect(books).toHaveLength(1)
    expect(books[0].id).toBe(book1.id)

    // Direct detail query should return null for soft-deleted book
    const deletedDetail = await getBookWithEverything(user.id, book2.id)
    expect(deletedDetail).toBeNull()

    // The database row still exists with deletedAt set
    const rawRow = await db.book.findUnique({ where: { id: book2.id } })
    expect(rawRow).not.toBeNull()
    expect(rawRow?.deletedAt).toBeInstanceOf(Date)
  })
})
