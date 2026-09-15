"use server";

import { redirect } from "next/navigation";
import { revalidatePath, revalidateTag } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { booksTag, bookTag, sessionTag } from "@/lib/cache-tags";
import type { SessionMode } from "@/domain/types";
import * as sessionsService from "@/domain/services/sessions";
import {
  CancelSessionInputSchema,
  CompleteSessionInputSchema,
  StartSessionInputSchema,
  UuidSchema,
  type ActionResult,
} from "@/lib/validators";

function revalidateSessionSurfaces(
  userId: string,
  bookId: string,
  sessionId: string,
) {
  revalidateTag(booksTag(userId));
  revalidateTag(bookTag(bookId));
  revalidateTag(sessionTag(sessionId));
  revalidatePath(`/livros/${bookId}`);
  revalidatePath(`/sessoes/${sessionId}`);
  revalidatePath("/");
}

export async function startSessionAction(
  bookId: string,
  options?: {
    mode?: SessionMode;
    chapterId?: string;
  },
): Promise<ActionResult<{ sessionId: string }> | void> {
  const user = await getCurrentUser();
  const parsed = StartSessionInputSchema.safeParse({
    bookId,
    chapterId: options?.chapterId,
    mode: options?.mode,
  });

  if (!parsed.success) {
    return {
      success: false,
      error: "Dados de inicialização de sessão inválidos",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const session = await sessionsService.startSession(user.id, parsed.data);
  revalidateTag(booksTag(user.id));
  revalidateTag(bookTag(parsed.data.bookId));
  revalidatePath("/");
  revalidatePath(`/livros/${parsed.data.bookId}`);
  redirect(`/sessoes/${session.id}`);
}

export async function completeSessionAction(
  sessionId: string,
  mode: SessionMode,
  entries: unknown,
): Promise<
  ActionResult<{
    score: number;
    bookId: string;
    nextRevision: Date;
  }>
> {
  const user = await getCurrentUser();
  const sessionIdParsed = UuidSchema.safeParse(sessionId);
  if (!sessionIdParsed.success) {
    return { success: false, error: "ID de sessão inválido" };
  }

  const parsed = CompleteSessionInputSchema.safeParse({ mode, entries });
  if (!parsed.success) {
    return {
      success: false,
      error: "Dados de conclusão de sessão inválidos",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const { bookId, score, nextRevision } =
      await sessionsService.completeSession(
        user.id,
        sessionIdParsed.data,
        parsed.data.mode,
        parsed.data.entries,
      );

    revalidateSessionSurfaces(user.id, bookId, sessionIdParsed.data);
    return { success: true, data: { bookId, score, nextRevision } };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao concluir sessão";
    return { success: false, error: message };
  }
}

export async function cancelSessionAction(
  sessionId: string,
): Promise<ActionResult<{ bookId: string }>> {
  const user = await getCurrentUser();
  const parsed = CancelSessionInputSchema.safeParse({ sessionId });
  if (!parsed.success) {
    return { success: false, error: "ID de sessão inválido" };
  }

  try {
    const { bookId } = await sessionsService.cancelSession(
      user.id,
      parsed.data.sessionId,
    );
    revalidateSessionSurfaces(user.id, bookId, parsed.data.sessionId);
    return { success: true, data: { bookId } };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao cancelar sessão";
    return { success: false, error: message };
  }
}
