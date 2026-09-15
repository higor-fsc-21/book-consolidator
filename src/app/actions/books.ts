"use server"

import { revalidatePath, revalidateTag } from "next/cache"
import { getCurrentUser } from "@/lib/auth"
import { booksTag, bookTag } from "@/lib/cache-tags"
import * as booksService from "@/domain/services/books"
import { logger } from "@/lib/logger"
import {
  CreateBookInputSchema,
  UpdateBookInputSchema,
  UuidSchema,
  type ActionResult,
} from "@/lib/validators"

export async function createBook(
  data: unknown,
): Promise<ActionResult<{ id: string }>> {
  const user = await getCurrentUser()
  logger.info("book.create.requested", { userId: user.id })

  const parsed = CreateBookInputSchema.safeParse(data)
  if (!parsed.success) {
    logger.info("book.create.validation_failed", {
      userId: user.id,
      issues: parsed.error.issues.map((issue) => issue.path.join(".")),
    })
    return {
      success: false,
      error: "Dados do livro inválidos",
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  try {
    const book = await booksService.addBook(user.id, parsed.data)
    logger.info("book.create.success", { userId: user.id, bookId: book.id })
    revalidateTag(booksTag(user.id))
    revalidatePath("/")
    revalidatePath("/biblioteca")
    return { success: true, data: { id: book.id } }
  } catch (error) {
    logger.error("book.create.failed", error, { userId: user.id })
    return { success: false, error: "Erro ao criar livro" }
  }
}

export async function updateBook(
  id: string,
  updates: unknown,
): Promise<ActionResult> {
  const user = await getCurrentUser()
  const idParsed = UuidSchema.safeParse(id)
  if (!idParsed.success) {
    logger.info("book.update.validation_failed", {
      userId: user.id,
      reason: "invalid_id",
    })
    return { success: false, error: "ID de livro inválido" }
  }

  const parsed = UpdateBookInputSchema.safeParse(updates)
  if (!parsed.success) {
    logger.info("book.update.validation_failed", {
      userId: user.id,
      bookId: idParsed.data,
      issues: parsed.error.issues.map((issue) => issue.path.join(".")),
    })
    return {
      success: false,
      error: "Dados de atualização inválidos",
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  try {
    await booksService.updateBook(user.id, idParsed.data, parsed.data)
    logger.info("book.update.success", {
      userId: user.id,
      bookId: idParsed.data,
    })
    revalidateTag(booksTag(user.id))
    revalidateTag(bookTag(idParsed.data))
    revalidatePath("/")
    revalidatePath("/biblioteca")
    revalidatePath(`/livros/${idParsed.data}`)
    return { success: true }
  } catch (error) {
    logger.error("book.update.failed", error, {
      userId: user.id,
      bookId: idParsed.data,
    })
    return { success: false, error: "Erro ao atualizar livro" }
  }
}

export async function deleteBook(id: string): Promise<ActionResult> {
  const user = await getCurrentUser()
  const idParsed = UuidSchema.safeParse(id)
  if (!idParsed.success) {
    logger.info("book.delete.validation_failed", {
      userId: user.id,
      reason: "invalid_id",
    })
    return { success: false, error: "ID de livro inválido" }
  }

  try {
    await booksService.softDeleteBook(user.id, idParsed.data)
    logger.info("book.delete.success", {
      userId: user.id,
      bookId: idParsed.data,
    })
    revalidateTag(booksTag(user.id))
    revalidateTag(bookTag(idParsed.data))
    revalidatePath("/")
    revalidatePath("/biblioteca")
    return { success: true }
  } catch (error) {
    logger.error("book.delete.failed", error, {
      userId: user.id,
      bookId: idParsed.data,
    })
    return { success: false, error: "Erro ao excluir livro" }
  }
}

export async function startReading(bookId: string): Promise<ActionResult> {
  const user = await getCurrentUser()
  const idParsed = UuidSchema.safeParse(bookId)
  if (!idParsed.success) {
    logger.info("book.reading.validation_failed", {
      userId: user.id,
      reason: "invalid_id",
    })
    return { success: false, error: "ID de livro inválido" }
  }

  try {
    await booksService.startReading(user.id, idParsed.data)
    logger.info("book.reading.started", {
      userId: user.id,
      bookId: idParsed.data,
    })
    revalidateTag(booksTag(user.id))
    revalidateTag(bookTag(idParsed.data))
    revalidatePath("/")
    revalidatePath("/biblioteca")
    revalidatePath(`/livros/${idParsed.data}`)
    return { success: true }
  } catch (error) {
    logger.error("book.reading.failed", error, {
      userId: user.id,
      bookId: idParsed.data,
    })
    return { success: false, error: "Erro ao iniciar leitura" }
  }
}
