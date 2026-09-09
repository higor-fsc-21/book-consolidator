import { Sidebar } from "@/components/Sidebar";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex h-full bg-[#fbf9f8] overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-auto min-w-0 bg-[#fbf9f8]">
        {children}
      </main>
    </div>
  );
}
