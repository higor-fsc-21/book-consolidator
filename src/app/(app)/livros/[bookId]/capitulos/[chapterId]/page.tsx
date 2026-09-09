import { notFound } from "next/navigation";
import { ChapterDetail } from "@/views/ChapterDetail";
import { store } from "@/domain/store";

export default async function ChapterDetailPage({
  params,
}: {
  params: Promise<{ bookId: string; chapterId: string }>;
}) {
  const { bookId, chapterId } = await params;
  const book = store.books.find((b) => b.id === bookId);
  if (!book) notFound();
  const chapter = book.chapters.find((c) => c.id === chapterId);
  if (!chapter) notFound();

  return <ChapterDetail book={book} chapter={chapter} />;
}
