import { Sidebar } from "@/components/Sidebar";
import { getCurrentUser } from "@/lib/auth";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let user: { name: string; email: string } | undefined;
  try {
    const currentUser = await getCurrentUser();
    user = {
      name: currentUser.name,
      email: currentUser.email,
    };
  } catch {
    // Falls back gracefully if session is unauthenticated
  }

  return (
    <div className="flex h-full bg-[#fbf9f8] overflow-hidden">
      <Sidebar user={user} />
      <main className="flex-1 min-w-0 overflow-auto bg-[#fbf9f8] pb-[calc(72px+env(safe-area-inset-bottom))] md:pb-0">
        {children}
      </main>
    </div>
  );
}
