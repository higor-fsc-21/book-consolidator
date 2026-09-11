import { notFound } from "next/navigation";
import { ChapterDetail } from "@/views/ChapterDetail";
import { getCurrentUser } from "@/lib/auth";
import { getChapterWithQuestions } from "@/domain/queries/books";

export default async function ChapterDetailPage({
  params,
}: {
  params: Promise<{ bookId: string; chapterId: string }>;
}) {
  const { bookId, chapterId } = await params;
  const user = await getCurrentUser();
  const { book, chapter } = await getChapterWithQuestions(
    user.id,
    bookId,
    chapterId,
  );
  if (!book || !chapter) notFound();

  return <ChapterDetail book={book} chapter={chapter} />;
}
