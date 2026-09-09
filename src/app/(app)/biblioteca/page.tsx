import { Library } from "@/views/Library";
import { store } from "@/domain/store";

export default function LibraryPage() {
  return <Library books={store.books} />;
}
