"use server"

import { revalidatePath, revalidateTag } from "next/cache"
import { getCurrentUser } from "@/lib/auth"
import { booksTag, bookTag } from "@/lib/cache-tags"
import * as booksService from "@/domain/services/books"
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
  const parsed = CreateBookInputSchema.safeParse(data)
  if (!parsed.success) {
    return {
      success: false,
      error: "Dados do livro inválidos",
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  const book = await booksService.addBook(user.id, parsed.data)
  revalidateTag(booksTag(user.id))
  revalidatePath("/")
  revalidatePath("/biblioteca")
  return { success: true, data: { id: book.id } }
}

export async function updateBook(
  id: string,
  updates: unknown,
): Promise<ActionResult> {
  const user = await getCurrentUser()
  const idParsed = UuidSchema.safeParse(id)
  if (!idParsed.success) {
    return { success: false, error: "ID de livro inválido" }
  }

  const parsed = UpdateBookInputSchema.safeParse(updates)
  if (!parsed.success) {
    return {
      success: false,
      error: "Dados de atualização inválidos",
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  await booksService.updateBook(user.id, idParsed.data, parsed.data)
  revalidateTag(booksTag(user.id))
  revalidateTag(bookTag(idParsed.data))
  revalidatePath("/")
  revalidatePath("/biblioteca")
  revalidatePath(`/livros/${idParsed.data}`)
  return { success: true }
}

export async function deleteBook(id: string): Promise<ActionResult> {
  const user = await getCurrentUser()
  const idParsed = UuidSchema.safeParse(id)
  if (!idParsed.success) {
    return { success: false, error: "ID de livro inválido" }
  }

  await booksService.softDeleteBook(user.id, idParsed.data)
  revalidateTag(booksTag(user.id))
  revalidateTag(bookTag(idParsed.data))
  revalidatePath("/")
  revalidatePath("/biblioteca")
  return { success: true }
}

export async function startReading(bookId: string): Promise<ActionResult> {
  const user = await getCurrentUser()
  const idParsed = UuidSchema.safeParse(bookId)
  if (!idParsed.success) {
    return { success: false, error: "ID de livro inválido" }
  }

  await booksService.startReading(user.id, idParsed.data)
  revalidateTag(booksTag(user.id))
  revalidateTag(bookTag(idParsed.data))
  revalidatePath("/")
  revalidatePath("/biblioteca")
  revalidatePath(`/livros/${idParsed.data}`)
  return { success: true }
}
