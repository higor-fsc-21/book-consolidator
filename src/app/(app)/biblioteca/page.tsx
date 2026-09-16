import { Library } from "@/views/Library";
import { getCurrentUser } from "@/lib/auth";
import { getBookSummariesForUser } from "@/domain/queries/books";

export default async function LibraryPage() {
  const user = await getCurrentUser();
  const books = await getBookSummariesForUser(user.id);

  return <Library books={books} />;
}
