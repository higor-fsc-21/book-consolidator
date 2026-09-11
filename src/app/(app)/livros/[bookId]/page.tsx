import { notFound } from "next/navigation";
import { BookDetail } from "@/views/BookDetail";
import { getCurrentUser } from "@/lib/auth";
import { getBookWithEverything } from "@/domain/queries/books";

export default async function BookDetailPage({
  params,
}: {
  params: Promise<{ bookId: string }>;
}) {
  const { bookId } = await params;
  const user = await getCurrentUser();
  const book = await getBookWithEverything(user.id, bookId);
  if (!book) notFound();

  return <BookDetail book={book} />;
}
