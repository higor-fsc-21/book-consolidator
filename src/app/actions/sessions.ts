"use server";

import { redirect } from "next/navigation";
import { revalidatePath, revalidateTag } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { booksTag, bookTag, sessionTag } from "@/lib/cache-tags";
import type { SessionMode } from "@/domain/types";
import * as sessionsService from "@/domain/services/sessions";
import {
  CompleteSessionInputSchema,
  StartSessionInputSchema,
  UuidSchema,
  type ActionResult,
} from "@/lib/validators";

export async function startSessionAction(
  bookId: string,
  options?: { mode?: SessionMode; chapterId?: string },
) {
  const user = await getCurrentUser();
  const parsed = StartSessionInputSchema.safeParse({
    bookId,
    chapterId: options?.chapterId,
    mode: options?.mode,
  });

  if (!parsed.success) {
    throw new Error("Dados de inicialização de sessão inválidos");
  }

  const session = await sessionsService.startSession(user.id, parsed.data);
  redirect(`/sessoes/${session.id}`);
}

export async function completeSessionAction(
  sessionId: string,
  mode: SessionMode,
  entries: unknown,
): Promise<ActionResult<{ score: number; bookId: string }>> {
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

  const { bookId, score } = await sessionsService.completeSession(
    user.id,
    sessionIdParsed.data,
    parsed.data.mode,
    parsed.data.entries,
  );

  revalidateTag(booksTag(user.id));
  revalidateTag(bookTag(bookId));
  revalidateTag(sessionTag(sessionIdParsed.data));
  revalidatePath(`/livros/${bookId}`);
  revalidatePath(`/sessoes/${sessionIdParsed.data}`);
  revalidatePath("/");

  return { success: true, data: { bookId, score } };
}
