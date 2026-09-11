import { Dashboard } from "@/views/Dashboard";
import { getCurrentUser } from "@/lib/auth";
import { getBooksForUser } from "@/domain/queries/books";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const books = await getBooksForUser(user.id);

  const dateStr = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const capitalDate = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);

  return <Dashboard books={books} dateStr={capitalDate} />;
}
