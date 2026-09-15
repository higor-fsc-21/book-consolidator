"use server"

import { revalidatePath, revalidateTag } from "next/cache"
import { getCurrentUser } from "@/lib/auth"
import { booksTag, bookTag } from "@/lib/cache-tags"
import * as questionsService from "@/domain/services/questions"
import { logger } from "@/lib/logger"
import {
  CreateQuestionInputSchema,
  UpdateQuestionInputSchema,
  UuidSchema,
  type ActionResult,
} from "@/lib/validators"

export async function createQuestion(
  bookId: string,
  chapterId: string,
  question: unknown,
): Promise<ActionResult<{ id: string }>> {
  const user = await getCurrentUser()
  const bookIdParsed = UuidSchema.safeParse(bookId)
  const chapterIdParsed = UuidSchema.safeParse(chapterId)
  if (!bookIdParsed.success || !chapterIdParsed.success) {
    logger.info("question.create.validation_failed", {
      userId: user.id,
      reason: "invalid_identifiers",
    })
    return { success: false, error: "Identificadores inválidos" }
  }

  const parsed = CreateQuestionInputSchema.safeParse(question)
  if (!parsed.success) {
    logger.info("question.create.validation_failed", {
      userId: user.id,
      bookId: bookIdParsed.data,
      chapterId: chapterIdParsed.data,
      issues: parsed.error.issues.map((issue) => issue.path.join(".")),
    })
    return {
      success: false,
      error: "Dados da pergunta inválidos",
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  try {
    const created = await questionsService.addQuestion(
      user.id,
      bookIdParsed.data,
      chapterIdParsed.data,
      parsed.data,
    )
    logger.info("question.create.success", {
      userId: user.id,
      bookId: bookIdParsed.data,
      chapterId: chapterIdParsed.data,
      questionId: created.id,
    })
    revalidateTag(booksTag(user.id))
    revalidateTag(bookTag(bookIdParsed.data))
    revalidatePath(`/livros/${bookIdParsed.data}`)
    revalidatePath(
      `/livros/${bookIdParsed.data}/capitulos/${chapterIdParsed.data}`,
    )
    return { success: true, data: { id: created.id } }
  } catch (error) {
    logger.error("question.create.failed", error, {
      userId: user.id,
      bookId: bookIdParsed.data,
      chapterId: chapterIdParsed.data,
    })
    return { success: false, error: "Erro ao criar pergunta" }
  }
}

export async function updateQuestion(
  bookId: string,
  questionId: string,
  updates: unknown,
): Promise<ActionResult> {
  const user = await getCurrentUser()
  const bookIdParsed = UuidSchema.safeParse(bookId)
  const questionIdParsed = UuidSchema.safeParse(questionId)
  if (!bookIdParsed.success || !questionIdParsed.success) {
    logger.info("question.update.validation_failed", {
      userId: user.id,
      reason: "invalid_identifiers",
    })
    return { success: false, error: "Identificadores inválidos" }
  }

  const parsed = UpdateQuestionInputSchema.safeParse(updates)
  if (!parsed.success) {
    logger.info("question.update.validation_failed", {
      userId: user.id,
      bookId: bookIdParsed.data,
      questionId: questionIdParsed.data,
      issues: parsed.error.issues.map((issue) => issue.path.join(".")),
    })
    return {
      success: false,
      error: "Dados de atualização inválidos",
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  try {
    await questionsService.updateQuestion(
      user.id,
      bookIdParsed.data,
      questionIdParsed.data,
      parsed.data,
    )
    logger.info("question.update.success", {
      userId: user.id,
      bookId: bookIdParsed.data,
      questionId: questionIdParsed.data,
    })
    revalidateTag(booksTag(user.id))
    revalidateTag(bookTag(bookIdParsed.data))
    revalidatePath(`/livros/${bookIdParsed.data}`)
    return { success: true }
  } catch (error) {
    logger.error("question.update.failed", error, {
      userId: user.id,
      bookId: bookIdParsed.data,
      questionId: questionIdParsed.data,
    })
    return { success: false, error: "Erro ao atualizar pergunta" }
  }
}

export async function deleteQuestion(
  bookId: string,
  questionId: string,
): Promise<ActionResult> {
  const user = await getCurrentUser()
  const bookIdParsed = UuidSchema.safeParse(bookId)
  const questionIdParsed = UuidSchema.safeParse(questionId)
  if (!bookIdParsed.success || !questionIdParsed.success) {
    logger.info("question.delete.validation_failed", {
      userId: user.id,
      reason: "invalid_identifiers",
    })
    return { success: false, error: "Identificadores inválidos" }
  }

  try {
    await questionsService.deleteQuestion(
      user.id,
      bookIdParsed.data,
      questionIdParsed.data,
    )
    logger.info("question.delete.success", {
      userId: user.id,
      bookId: bookIdParsed.data,
      questionId: questionIdParsed.data,
    })
    revalidateTag(booksTag(user.id))
    revalidateTag(bookTag(bookIdParsed.data))
    revalidatePath(`/livros/${bookIdParsed.data}`)
    return { success: true }
  } catch (error) {
    logger.error("question.delete.failed", error, {
      userId: user.id,
      bookId: bookIdParsed.data,
      questionId: questionIdParsed.data,
    })
    return { success: false, error: "Erro ao excluir pergunta" }
  }
}
