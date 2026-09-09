import { Dashboard } from "@/views/Dashboard";
import { store } from "@/domain/store";

export default function DashboardPage() {
  const dateStr = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const capitalDate = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);

  return <Dashboard books={store.books} dateStr={capitalDate} />;
}
