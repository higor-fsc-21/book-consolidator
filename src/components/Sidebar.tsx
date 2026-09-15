"use client"; /* Brand */ /* Navigation */ /* User */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/(auth)/login/actions";

const navItems = [
  {
    href: "/painel",
    label: "Início",
    icon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    href: "/biblioteca",
    label: "Biblioteca",
    icon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
    ),
  },
];

interface SidebarProps {
  user?: {
    name: string;
    email: string;
  };
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const inLibrary =
    pathname === "/biblioteca" || pathname.startsWith("/livros");

  const displayName =
    user?.name || (user?.email ? user.email.split("@")[0] : "Usuário");

  return (
    <aside className="w-[220px] shrink-0 flex flex-col h-full border-r border-[#e4e2e2] bg-[#f5f3f3]">
      {}
      <div className="px-5 py-6 border-b border-[#e4e2e2]">
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-[6px] flex items-center justify-center shrink-0"
            style={{ background: "linear-gradient(135deg, #1a2e44, #2d4460)" }}
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
            </svg>
          </div>
          <span className="font-display text-[15px] font-[400] text-[#1b1c1c] tracking-[-0.01em]">
            Book Consolidator
          </span>
        </div>
      </div>

      {}
      <nav className="flex-1 p-3 space-y-0.5">
        {navItems.map(({ href, label, icon }) => {
          const active =
            href === "/painel" ? pathname === "/painel" : inLibrary;
          return (
            <Link
              key={href}
              href={href}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 ${
                active
                  ? "bg-[#1a2e44]/[0.09] text-[#1a2e44] font-[600]"
                  : "text-[#43474d] hover:text-[#1b1c1c] hover:bg-[#1b1c1c]/[0.04]"
              }`}
            >
              {icon}
              {label}
            </Link>
          );
        })}
      </nav>

      {}
      <div className="p-4 border-t border-[#e4e2e2]">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[13px] font-[600] shrink-0"
            style={{ background: "linear-gradient(135deg, #1a2e44, #2d4460)" }}
          >
            {displayName.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-[600] text-[#1b1c1c] truncate">
              {displayName}
            </div>
            {user?.email && (
              <div
                className="text-[11px] text-[#74777d] mt-0.5 truncate"
                title={user.email}
              >
                {user.email}
              </div>
            )}
          </div>
          <form action={logout}>
            <button
              type="submit"
              title="Sair"
              className="text-[#74777d] hover:text-[#ba1a1a] transition-colors"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
