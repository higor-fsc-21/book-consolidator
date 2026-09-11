import { Library } from "@/views/Library";
import { getCurrentUser } from "@/lib/auth";
import { getBooksForUser } from "@/domain/queries/books";

export default async function LibraryPage() {
  const user = await getCurrentUser();
  const books = await getBooksForUser(user.id);

  return <Library books={books} />;
}
