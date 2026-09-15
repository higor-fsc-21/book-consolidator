"use server"

import { revalidatePath, revalidateTag } from "next/cache"
import { getCurrentUser } from "@/lib/auth"
import { booksTag, bookTag } from "@/lib/cache-tags"
import * as chaptersService from "@/domain/services/chapters"
import { logger } from "@/lib/logger"
import {
  CreateChapterInputSchema,
  UpdateChapterInputSchema,
  UuidSchema,
  type ActionResult,
} from "@/lib/validators"

export async function createChapter(
  bookId: string,
  data: unknown,
): Promise<ActionResult<{ id: string }>> {
  const user = await getCurrentUser()
  const bookIdParsed = UuidSchema.safeParse(bookId)
  if (!bookIdParsed.success) {
    logger.info("chapter.create.validation_failed", {
      userId: user.id,
      reason: "invalid_book_id",
    })
    return { success: false, error: "ID de livro inválido" }
  }

  const parsed = CreateChapterInputSchema.safeParse(data)
  if (!parsed.success) {
    logger.info("chapter.create.validation_failed", {
      userId: user.id,
      bookId: bookIdParsed.data,
      issues: parsed.error.issues.map((issue) => issue.path.join(".")),
    })
    return {
      success: false,
      error: "Dados do capítulo inválidos",
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  try {
    const chapter = await chaptersService.addChapter(
      user.id,
      bookIdParsed.data,
      parsed.data,
    )
    logger.info("chapter.create.success", {
      userId: user.id,
      bookId: bookIdParsed.data,
      chapterId: chapter.id,
    })
    revalidateTag(booksTag(user.id))
    revalidateTag(bookTag(bookIdParsed.data))
    revalidatePath(`/livros/${bookIdParsed.data}`)
    return { success: true, data: { id: chapter.id } }
  } catch (error) {
    logger.error("chapter.create.failed", error, {
      userId: user.id,
      bookId: bookIdParsed.data,
    })
    return { success: false, error: "Erro ao criar capítulo" }
  }
}

export async function updateChapter(
  bookId: string,
  chapterId: string,
  data: unknown,
): Promise<ActionResult> {
  const user = await getCurrentUser()
  const bookIdParsed = UuidSchema.safeParse(bookId)
  const chapterIdParsed = UuidSchema.safeParse(chapterId)
  if (!bookIdParsed.success || !chapterIdParsed.success) {
    logger.info("chapter.update.validation_failed", {
      userId: user.id,
      reason: "invalid_identifiers",
    })
    return { success: false, error: "Identificadores inválidos" }
  }

  const parsed = UpdateChapterInputSchema.safeParse(data)
  if (!parsed.success) {
    logger.info("chapter.update.validation_failed", {
      userId: user.id,
      bookId: bookIdParsed.data,
      chapterId: chapterIdParsed.data,
      issues: parsed.error.issues.map((issue) => issue.path.join(".")),
    })
    return {
      success: false,
      error: "Dados de atualização inválidos",
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  try {
    await chaptersService.updateChapter(
      user.id,
      bookIdParsed.data,
      chapterIdParsed.data,
      parsed.data,
    )
    logger.info("chapter.update.success", {
      userId: user.id,
      bookId: bookIdParsed.data,
      chapterId: chapterIdParsed.data,
    })
    revalidateTag(booksTag(user.id))
    revalidateTag(bookTag(bookIdParsed.data))
    revalidatePath(`/livros/${bookIdParsed.data}`)
    revalidatePath(
      `/livros/${bookIdParsed.data}/capitulos/${chapterIdParsed.data}`,
    )
    return { success: true }
  } catch (error) {
    logger.error("chapter.update.failed", error, {
      userId: user.id,
      bookId: bookIdParsed.data,
      chapterId: chapterIdParsed.data,
    })
    return { success: false, error: "Erro ao atualizar capítulo" }
  }
}

export async function deleteChapter(
  bookId: string,
  chapterId: string,
): Promise<ActionResult> {
  const user = await getCurrentUser()
  const bookIdParsed = UuidSchema.safeParse(bookId)
  const chapterIdParsed = UuidSchema.safeParse(chapterId)
  if (!bookIdParsed.success || !chapterIdParsed.success) {
    logger.info("chapter.delete.validation_failed", {
      userId: user.id,
      reason: "invalid_identifiers",
    })
    return { success: false, error: "Identificadores inválidos" }
  }

  try {
    await chaptersService.deleteChapter(
      user.id,
      bookIdParsed.data,
      chapterIdParsed.data,
    )
    logger.info("chapter.delete.success", {
      userId: user.id,
      bookId: bookIdParsed.data,
      chapterId: chapterIdParsed.data,
    })
    revalidateTag(booksTag(user.id))
    revalidateTag(bookTag(bookIdParsed.data))
    revalidatePath(`/livros/${bookIdParsed.data}`)
    return { success: true }
  } catch (error) {
    logger.error("chapter.delete.failed", error, {
      userId: user.id,
      bookId: bookIdParsed.data,
      chapterId: chapterIdParsed.data,
    })
    return { success: false, error: "Erro ao excluir capítulo" }
  }
}

export async function toggleChapterRead(
  bookId: string,
  chapterId: string,
): Promise<ActionResult> {
  const user = await getCurrentUser()
  const bookIdParsed = UuidSchema.safeParse(bookId)
  const chapterIdParsed = UuidSchema.safeParse(chapterId)
  if (!bookIdParsed.success || !chapterIdParsed.success) {
    logger.info("chapter.toggle.validation_failed", {
      userId: user.id,
      reason: "invalid_identifiers",
    })
    return { success: false, error: "Identificadores inválidos" }
  }

  try {
    await chaptersService.toggleChapterRead(
      user.id,
      bookIdParsed.data,
      chapterIdParsed.data,
    )
    logger.info("chapter.toggle.success", {
      userId: user.id,
      bookId: bookIdParsed.data,
      chapterId: chapterIdParsed.data,
    })
    revalidateTag(booksTag(user.id))
    revalidateTag(bookTag(bookIdParsed.data))
    revalidatePath(`/livros/${bookIdParsed.data}`)
    revalidatePath(
      `/livros/${bookIdParsed.data}/capitulos/${chapterIdParsed.data}`,
    )
    return { success: true }
  } catch (error) {
    logger.error("chapter.toggle.failed", error, {
      userId: user.id,
      bookId: bookIdParsed.data,
      chapterId: chapterIdParsed.data,
    })
    return { success: false, error: "Erro ao alternar capítulo" }
  }
}
