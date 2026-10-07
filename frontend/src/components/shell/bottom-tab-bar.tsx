"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { MoreSheet } from "./more-sheet";
import { activeTab, visibleNav } from "./shell-nav";

const TAB =
  "flex min-h-14 min-w-14 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl text-muted transition-colors active:scale-95 motion-reduce:transform-none";

/**
 * Barra de pestañas inferior (celular y tablet, < 1024 px), como cualquier
 * app: el pulgar llega a todo sin estirarse. Ícono relleno = pestaña activa
 * (convención de Instagram/iOS); objetivos táctiles de 56 px (WCAG 2.5.8
 * pide ≥ 24; Apple/Google recomiendan ≥ 44/48). Su alto vive en la
 * variable CSS --bottom-bar-h (globals.css), que usan el anuncio fijo, el
 * aviso de cookies y el `main` para no quedar debajo.
 */
export function BottomTabBar({ showAgenda }: { showAgenda: boolean }) {
  const current = activeTab(usePathname());

  return (
    <nav
      aria-label="Principal"
      // Sombra de 1 px en vez de borde: el borde sumaba 1 px al alto reservado en --bottom-bar-h.
      className="fixed inset-x-0 bottom-0 z-40 bg-surface/95 shadow-[0_-1px_0_var(--border)] pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
    >
      <div className="mx-auto flex h-16 max-w-xl items-center justify-around px-2">
        {visibleNav(showAgenda).map(({ tab, href, label, icon: Icon }) => {
          const active = tab === current;
          return (
            <Link
              key={tab}
              href={href}
              aria-current={active ? "page" : undefined}
              aria-label={label}
              className={cn(TAB, active ? "text-foreground" : "hover:text-foreground")}
            >
              <Icon className="h-6 w-6" weight={active ? "fill" : "regular"} aria-hidden="true" />
              <span className={cn("text-[11px]", active ? "font-bold" : "font-medium")}>{label}</span>
            </Link>
          );
        })}
        <MoreSheet triggerClassName={cn(TAB, "cursor-pointer hover:text-foreground")} />
      </div>
    </nav>
  );
}
