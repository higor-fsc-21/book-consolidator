"use server"

import { redirect } from "next/navigation"
import { revalidatePath, revalidateTag } from "next/cache"
import { getCurrentUser } from "@/lib/auth"
import { booksTag, bookTag, sessionTag } from "@/lib/cache-tags"
import type { SessionMode } from "@/domain/types"
import * as sessionsService from "@/domain/services/sessions"
import { logger } from "@/lib/logger"
import {
  CancelSessionInputSchema,
  CompleteSessionInputSchema,
  StartSessionInputSchema,
  UuidSchema,
  type ActionResult,
} from "@/lib/validators"

function revalidateSessionSurfaces(
  userId: string,
  bookId: string,
  sessionId: string,
) {
  revalidateTag(booksTag(userId))
  revalidateTag(bookTag(bookId))
  revalidateTag(sessionTag(sessionId))
  revalidatePath(`/livros/${bookId}`)
  revalidatePath(`/sessoes/${sessionId}`)
  revalidatePath("/")
}

export async function startSessionAction(
  bookId: string,
  options?: {
    mode?: SessionMode
    chapterId?: string
  },
): Promise<ActionResult<{ sessionId: string }> | void> {
  const user = await getCurrentUser()
  logger.info("session.start.requested", { userId: user.id, bookId: bookId })
  const parsed = StartSessionInputSchema.safeParse({
    bookId,
    chapterId: options?.chapterId,
    mode: options?.mode,
  })

  if (!parsed.success) {
    logger.info("session.start.validation_failed", {
      userId: user.id,
      issues: parsed.error.issues.map((issue) => issue.path.join(".")),
    })
    return {
      success: false,
      error: "Dados de inicialização de sessão inválidos",
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  let sessionId: string
  try {
    const session = await sessionsService.startSession(user.id, parsed.data)
    sessionId = session.id
    logger.info("session.start.success", {
      userId: user.id,
      sessionId: session.id,
      bookId: parsed.data.bookId,
    })
    revalidateTag(booksTag(user.id))
    revalidateTag(bookTag(parsed.data.bookId))
    revalidatePath("/")
    revalidatePath(`/livros/${parsed.data.bookId}`)
  } catch (error) {
    logger.error("session.start.failed", error, {
      userId: user.id,
      bookId: parsed.data.bookId,
    })
    return { success: false, error: "Erro ao iniciar sessão" }
  }

  // `redirect()` throws a NEXT_REDIRECT control-flow error, so it must stay
  // outside the try block or the catch above would swallow the navigation.
  redirect(`/sessoes/${sessionId}`)
}

export async function completeSessionAction(
  sessionId: string,
  mode: SessionMode,
  entries: unknown,
): Promise<ActionResult<{
  score: number
  bookId: string
  nextRevision: Date
}>> {
  const user = await getCurrentUser()
  const sessionIdParsed = UuidSchema.safeParse(sessionId)
  if (!sessionIdParsed.success) {
    logger.info("session.complete.validation_failed", {
      userId: user.id,
      reason: "invalid_session_id",
    })
    return { success: false, error: "ID de sessão inválido" }
  }

  const parsed = CompleteSessionInputSchema.safeParse({ mode, entries })
  if (!parsed.success) {
    logger.info("session.complete.validation_failed", {
      userId: user.id,
      sessionId: sessionIdParsed.data,
      issues: parsed.error.issues.map((issue) => issue.path.join(".")),
    })
    return {
      success: false,
      error: "Dados de conclusão de sessão inválidos",
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  try {
    const { bookId, score, nextRevision } =
      await sessionsService.completeSession(
        user.id,
        sessionIdParsed.data,
        parsed.data.mode,
        parsed.data.entries,
      )

    logger.info("session.complete.success", {
      userId: user.id,
      sessionId: sessionIdParsed.data,
      bookId,
      score,
    })
    revalidateSessionSurfaces(user.id, bookId, sessionIdParsed.data)
    return { success: true, data: { bookId, score, nextRevision } }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao concluir sessão"
    logger.error("session.complete.failed", error, {
      userId: user.id,
      sessionId: sessionIdParsed.data,
    })
    return { success: false, error: message }
  }
}

export async function cancelSessionAction(
  sessionId: string,
): Promise<ActionResult<{ bookId: string }>> {
  const user = await getCurrentUser()
  const parsed = CancelSessionInputSchema.safeParse({ sessionId })
  if (!parsed.success) {
    logger.info("session.cancel.validation_failed", {
      userId: user.id,
      reason: "invalid_session_id",
    })
    return { success: false, error: "ID de sessão inválido" }
  }

  try {
    const { bookId } = await sessionsService.cancelSession(
      user.id,
      parsed.data.sessionId,
    )
    logger.info("session.cancel.success", {
      userId: user.id,
      sessionId: parsed.data.sessionId,
      bookId,
    })
    revalidateSessionSurfaces(user.id, bookId, parsed.data.sessionId)
    return { success: true, data: { bookId } }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao cancelar sessão"
    logger.error("session.cancel.failed", error, {
      userId: user.id,
      sessionId: parsed.data.sessionId,
    })
    return { success: false, error: message }
  }
}
