import { notFound } from "next/navigation";
import { MemorizationSession } from "@/views/MemorizationSession";
import { store } from "@/domain/store";

export default async function SessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const session = store.sessions.find((s) => s.id === sessionId);
  if (!session) notFound();

  const book = store.books.find((b) => b.id === session.bookId);
  if (!book) notFound();

  const chapter = session.chapterId
    ? book.chapters.find((c) => c.id === session.chapterId)
    : undefined;

  return (
    <MemorizationSession
      sessionId={session.id}
      book={book}
      chapter={chapter}
      initialMode={session.mode}
    />
  );
}
