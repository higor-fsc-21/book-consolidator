"use server"

import { revalidatePath, revalidateTag } from "next/cache"
import { getCurrentUser } from "@/lib/auth"
import { booksTag, bookTag } from "@/lib/cache-tags"
import * as questionsService from "@/domain/services/questions"
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
    return { success: false, error: "Identificadores inválidos" }
  }

  const parsed = CreateQuestionInputSchema.safeParse(question)
  if (!parsed.success) {
    return {
      success: false,
      error: "Dados da pergunta inválidos",
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  const created = await questionsService.addQuestion(
    user.id,
    bookIdParsed.data,
    chapterIdParsed.data,
    parsed.data,
  )
  revalidateTag(booksTag(user.id))
  revalidateTag(bookTag(bookIdParsed.data))
  revalidatePath(`/livros/${bookIdParsed.data}`)
  revalidatePath(
    `/livros/${bookIdParsed.data}/capitulos/${chapterIdParsed.data}`,
  )
  return { success: true, data: { id: created.id } }
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
    return { success: false, error: "Identificadores inválidos" }
  }

  const parsed = UpdateQuestionInputSchema.safeParse(updates)
  if (!parsed.success) {
    return {
      success: false,
      error: "Dados de atualização inválidos",
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  await questionsService.updateQuestion(
    user.id,
    bookIdParsed.data,
    questionIdParsed.data,
    parsed.data,
  )
  revalidateTag(booksTag(user.id))
  revalidateTag(bookTag(bookIdParsed.data))
  revalidatePath(`/livros/${bookIdParsed.data}`)
  return { success: true }
}

export async function deleteQuestion(
  bookId: string,
  questionId: string,
): Promise<ActionResult> {
  const user = await getCurrentUser()
  const bookIdParsed = UuidSchema.safeParse(bookId)
  const questionIdParsed = UuidSchema.safeParse(questionId)
  if (!bookIdParsed.success || !questionIdParsed.success) {
    return { success: false, error: "Identificadores inválidos" }
  }

  await questionsService.deleteQuestion(
    user.id,
    bookIdParsed.data,
    questionIdParsed.data,
  )
  revalidateTag(booksTag(user.id))
  revalidateTag(bookTag(bookIdParsed.data))
  revalidatePath(`/livros/${bookIdParsed.data}`)
  return { success: true }
}
