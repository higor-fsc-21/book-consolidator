import type {
  Book,
  RevisionRecord,
  RevisionSession,
  SessionMode,
} from "../types";
import { newId } from "../ids";

export const addRevision = (
  books: Book[],
  bookId: string,
  revision: Omit<RevisionRecord, "id">,
): Book[] =>
  books.map((b) =>
    b.id === bookId
      ? {
          ...b,
          revisions: [...b.revisions, { ...revision, id: newId() }],
          lastRevision: revision.date,
        }
      : b,
  );

export const startSession = (
  sessions: RevisionSession[],
  data: { bookId: string; chapterId?: string; mode?: SessionMode },
): { sessions: RevisionSession[]; session: RevisionSession } => {
  const session: RevisionSession = {
    id: newId(),
    bookId: data.bookId,
    chapterId: data.chapterId,
    mode: data.mode,
    createdAt: new Date().toISOString(),
  };
  return { sessions: [...sessions, session], session };
};

export const completeSession = (
  books: Book[],
  sessions: RevisionSession[],
  sessionId: string,
  revision: Omit<RevisionRecord, "id">,
): { books: Book[]; sessions: RevisionSession[] } => {
  const session = sessions.find((s) => s.id === sessionId);
  if (!session) return { books, sessions };
  return {
    books: addRevision(books, session.bookId, revision),
    sessions: sessions.filter((s) => s.id !== sessionId),
  };
};
