"use client"; /* Brand */ /* Navigation */ /* User */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/(auth)/login/actions";
import { BrandMark } from "@/components/BrandMark";

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
  {
    href: "/configuracoes",
    label: "Configurações",
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
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-1.7 1.7-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56V22h-2.4v-.2a1.7 1.7 0 0 0-1.03-1.56 1.7 1.7 0 0 0-1.88.34l-.06.06-1.7-1.7.06-.06A1.7 1.7 0 0 0 8.46 15a1.7 1.7 0 0 0-1.56-1.03H6v-2.4h.9a1.7 1.7 0 0 0 1.56-1.03 1.7 1.7 0 0 0-.34-1.88l-.06-.06 1.7-1.7.06.06a1.7 1.7 0 0 0 1.88.34A1.7 1.7 0 0 0 12.73 5.7V5h2.4v.7a1.7 1.7 0 0 0 1.03 1.56 1.7 1.7 0 0 0 1.88-.34l.06-.06 1.7 1.7-.06.06A1.7 1.7 0 0 0 19.4 10c.22.5.7.83 1.25.83H21v2.4h-.35c-.55 0-1.03.33-1.25.83Z" />
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
    <aside className="fixed inset-x-0 bottom-0 z-40 flex min-h-[68px] shrink-0 border-t border-[#e4e2e2] bg-[#f5f3f3] pb-[env(safe-area-inset-bottom)] md:static md:h-full md:w-[220px] md:flex-col md:border-r md:border-t-0 md:pb-0">
      <div className="hidden px-5 py-6 md:block md:border-b md:border-[#e4e2e2]">
        <div className="flex items-center gap-2.5">
          <BrandMark size={28} className="rounded-[6px]" />
          <span className="font-display text-[15px] font-[400] text-[#1b1c1c] tracking-[-0.01em]">
            Book Consolidator
          </span>
        </div>
      </div>

      <nav className="flex flex-1 items-stretch gap-1 px-2 py-2 md:block md:space-y-0.5 md:p-3">
        {navItems.map(({ href, label, icon }) => {
          const active =
            href === "/painel"
              ? pathname === "/painel"
              : href === "/biblioteca"
                ? inLibrary
                : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`flex flex-1 flex-col items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-[10px] font-[500] whitespace-nowrap transition-all duration-150 md:w-full md:flex-row md:justify-start md:gap-3 md:px-3 md:py-2.5 md:text-sm ${
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

      <div className="hidden border-t border-[#e4e2e2] p-4 md:block">
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
