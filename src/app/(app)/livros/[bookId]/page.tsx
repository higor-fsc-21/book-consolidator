import { notFound } from "next/navigation";
import { BookDetail } from "@/views/BookDetail";
import { store } from "@/domain/store";

export default async function BookDetailPage({
  params,
}: {
  params: Promise<{ bookId: string }>;
}) {
  const { bookId } = await params;
  const book = store.books.find((b) => b.id === bookId);
  if (!book) notFound();

  return <BookDetail book={book} />;
}
