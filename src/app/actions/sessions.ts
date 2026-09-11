"use server";

import { redirect } from "next/navigation";
import { revalidatePath, revalidateTag } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { booksTag, bookTag, sessionTag } from "@/lib/cache-tags";
import type { Performance, SessionMode } from "@/domain/types";
import * as sessionsService from "@/domain/services/sessions";

export async function startSessionAction(
  bookId: string,
  options?: { mode?: SessionMode; chapterId?: string },
) {
  const user = await getCurrentUser();
  const session = await sessionsService.startSession(user.id, {
    bookId,
    chapterId: options?.chapterId,
    mode: options?.mode,
  });
  redirect(`/sessoes/${session.id}`);
}

export async function completeSessionAction(
  sessionId: string,
  mode: SessionMode,
  entries: { questionId: string | null; performance: Performance }[],
) {
  const user = await getCurrentUser();
  const { bookId } = await sessionsService.completeSession(
    user.id,
    sessionId,
    mode,
    entries,
  );
  revalidateTag(booksTag(user.id));
  revalidateTag(bookTag(bookId));
  revalidateTag(sessionTag(sessionId));
  revalidatePath(`/livros/${bookId}`);
  revalidatePath(`/sessoes/${sessionId}`);
  revalidatePath("/");
}
