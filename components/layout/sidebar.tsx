"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Film, Plus, Upload, BarChart2, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/peliculas",       icon: Film,     label: "Películas"      },
  { href: "/peliculas/nueva", icon: Plus,     label: "Nueva película" },
  { href: "/admin/import",           icon: Upload,   label: "Importar IMDb"     },
  { href: "/admin/import-justwatch", icon: Upload,   label: "Importar JustWatch" },
  { href: "/stats",           icon: BarChart2, label: "Estadísticas"  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex flex-col w-[220px] flex-shrink-0 h-dvh border-r border-[var(--border)] bg-[var(--surface)]">
      {/* Wordmark */}
      <div className="px-5 pt-7 pb-6">
        <Link href="/peliculas">
          <span className="font-display font-semibold text-[22px] italic text-text leading-none select-none">
            Director&rsquo;s Cut
          </span>
        </Link>
      </div>

      <div className="w-full h-px bg-[var(--border)] mb-2" />

      {/* Nav */}
      <nav className="flex-1 px-2 py-2 space-y-0.5">
        {NAV.map(({ href, icon: Icon, label }) => {
          const active = href === "/peliculas"
            ? pathname === href
            : pathname === href || pathname.startsWith(href + "/");

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-[6px] text-sm transition-colors duration-150",
                active
                  ? "bg-[var(--accent-dim)] text-[var(--accent)]"
                  : "text-text-mid hover:text-text hover:bg-[var(--surface-hi)]"
              )}
            >
              <Icon size={15} className="flex-shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="w-full h-px bg-[var(--border)] mt-2" />

      {/* Sign out */}
      <div className="px-2 py-3">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-2.5 px-3 py-2 rounded-[6px] text-sm text-text-faint hover:text-text hover:bg-[var(--surface-hi)] transition-colors duration-150 w-full"
        >
          <LogOut size={15} className="flex-shrink-0" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
