"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { MORE_LINKS, activeTab, visibleNav } from "./shell-nav";

export interface ShellBrand {
  name: string;
  logoUrl: string | null;
}

/**
 * Riel de navegación izquierdo (escritorio, ≥ 1024 px), como Instagram o
 * YouTube en computadora: solo íconos de 1024 a 1279 px y con etiqueta desde
 * 1280 px. Al pie, los enlaces legales (reemplaza al pie de página).
 */
export function LeftRail({ brand, showAgenda }: { brand: ShellBrand; showAgenda: boolean }) {
  const current = activeTab(usePathname());
  const year = new Date().getFullYear();

  return (
    <aside className="sticky top-0 hidden h-dvh w-[72px] shrink-0 flex-col border-r border-border bg-surface px-3 py-5 lg:flex xl:w-60">
      <Link href="/" className="mb-8 flex items-center gap-3 rounded-xl px-2 py-1.5 hover:bg-canvas" aria-label={brand.name}>
        {brand.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- logo definido en Configuración, host arbitrario
          <img src={brand.logoUrl} alt="" className="h-8 w-8 shrink-0 rounded-lg object-cover" />
        ) : (
          <span aria-hidden="true" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-fill text-sm font-black text-accent-foreground">
            {brand.name.charAt(0)}
          </span>
        )}
        <span className="hidden truncate text-[15px] font-bold tracking-tight text-foreground xl:block">{brand.name}</span>
      </Link>

      <nav aria-label="Principal" className="flex flex-col gap-1">
        {visibleNav(showAgenda).map(({ tab, href, label, icon: Icon }) => {
          const active = tab === current;
          return (
            <Link
              key={tab}
              href={href}
              aria-current={active ? "page" : undefined}
              aria-label={label}
              title={label}
              className={cn(
                "flex min-h-12 items-center gap-4 rounded-xl px-3 text-[15px] transition-colors hover:bg-canvas",
                active ? "font-bold text-foreground" : "font-medium text-muted hover:text-foreground",
              )}
            >
              <Icon className="h-6 w-6 shrink-0" weight={active ? "fill" : "regular"} aria-hidden="true" />
              <span className="hidden xl:inline">{label}</span>
            </Link>
          );
        })}
      </nav>

      <footer className="mt-auto hidden px-3 text-xs leading-relaxed text-muted xl:block">
        <nav aria-label="Legal" className="flex flex-wrap gap-x-3 gap-y-1">
          {MORE_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-foreground hover:underline">
              {link.label}
            </Link>
          ))}
        </nav>
        <p className="mt-2">
          © {year} {brand.name}
        </p>
      </footer>
    </aside>
  );
}
