"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { RevisionRecord, SessionMode } from "@/domain/types";
import { store } from "@/domain/store";
import * as sessionsService from "@/domain/services/sessions";

export async function startSessionAction(
  bookId: string,
  options?: { mode?: SessionMode; chapterId?: string },
) {
  const { sessions, session } = sessionsService.startSession(store.sessions, {
    bookId,
    chapterId: options?.chapterId,
    mode: options?.mode,
  });
  store.sessions = sessions;
  redirect(`/sessoes/${session.id}`);
}

export async function completeSessionAction(
  sessionId: string,
  revision: Omit<RevisionRecord, "id">,
) {
  const session = store.sessions.find((s) => s.id === sessionId);
  const { books, sessions } = sessionsService.completeSession(
    store.books,
    store.sessions,
    sessionId,
    revision,
  );
  store.books = books;
  store.sessions = sessions;
  if (session) {
    revalidatePath(`/livros/${session.bookId}`);
  }
  revalidatePath(`/sessoes/${sessionId}`);
}
