"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as RadixDialog from "@radix-ui/react-dialog";
import { House, List, MagnifyingGlass, PlusCircle, X } from "@phosphor-icons/react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/admin/ui";
import type { CreateItem } from "@/lib/admin/nav";
import { cn } from "@/lib/utils";
import { AdminNav, type NavGroupData } from "../admin-nav";
import { useCommandPalette } from "./command-palette";

const TAB =
  "flex min-w-0 flex-1 cursor-pointer flex-col items-center justify-center gap-0.5 py-1.5 text-[11px] font-medium outline-none " +
  "transition-colors focus-visible:ring-[3px] focus-visible:ring-ring [&_svg]:size-6";

function isActive(pathname: string, href: string) {
  return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
}

/**
 * Barra inferior del panel en celular (como Instagram): Inicio, la primera
 * sección de contenido, Crear, Buscar y Menú — siempre con nombre, nunca un
 * ícono suelto. «Menú» abre el cajón con todas las secciones.
 */
export function MobileTabBar({
  groups,
  createItems,
  className,
}: {
  groups: NavGroupData[];
  createItems: CreateItem[];
  className?: string;
}) {
  const pathname = usePathname();
  const { open: openPalette } = useCommandPalette();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const home = groups.flatMap((group) => group.items).find((item) => item.href === "/admin");
  const content = groups.find((group) => group.group === "contenido")?.items[0];

  function tabLink(href: string, label: string, icon: ReactNode, activeIcon: ReactNode) {
    const active = isActive(pathname, href);
    return (
      <Link href={href} aria-current={active ? "page" : undefined} className={cn(TAB, active ? "text-accent" : "text-muted")}>
        {active ? activeIcon : icon}
        <span className="max-w-full truncate">{label}</span>
      </Link>
    );
  }

  return (
    <>
      <nav
        aria-label="Accesos rápidos"
        className={cn(
          "fixed inset-x-0 bottom-0 z-40 flex bg-surface/95 px-1 pb-[env(safe-area-inset-bottom)] shadow-[0_-1px_0_var(--field-border)] backdrop-blur",
          className,
        )}
      >
        {home && tabLink(home.href, "Inicio", <House aria-hidden="true" />, <House weight="fill" aria-hidden="true" />)}
        {content && tabLink(content.href, content.label, content.icon, content.activeIcon)}
        {createItems.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button type="button" className={cn(TAB, "text-accent")}>
                <PlusCircle weight="fill" aria-hidden="true" />
                <span>Crear</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="center">
              {createItems.map((item) => (
                <DropdownMenuItem key={item.href} asChild>
                  <Link href={item.href}>{item.label}</Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        <button type="button" onClick={openPalette} className={cn(TAB, "text-muted")}>
          <MagnifyingGlass aria-hidden="true" />
          <span>Buscar</span>
        </button>
        <button type="button" onClick={() => setDrawerOpen(true)} className={cn(TAB, "text-muted")}>
          <List aria-hidden="true" />
          <span>Menú</span>
        </button>
      </nav>

      <RadixDialog.Root open={drawerOpen} onOpenChange={setDrawerOpen}>
        <RadixDialog.Portal>
          <RadixDialog.Overlay className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=open]:fade-in-0" />
          <RadixDialog.Content
            aria-describedby={undefined}
            className="fixed inset-y-0 left-0 z-50 flex w-[min(20rem,85vw)] flex-col bg-surface shadow-overlay data-[state=open]:animate-in data-[state=open]:slide-in-from-left"
          >
            <div className="flex h-16 shrink-0 items-center justify-between px-4">
              <RadixDialog.Title className="text-base font-bold text-foreground">Menú del panel</RadixDialog.Title>
              <RadixDialog.Close
                aria-label="Cerrar menú"
                className="flex size-10 items-center justify-center rounded-full text-muted outline-none hover:bg-field hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring"
              >
                <X aria-hidden="true" className="size-5" />
              </RadixDialog.Close>
            </div>
            <nav aria-label="Secciones" className="no-scrollbar min-h-0 flex-1 space-y-2 overflow-y-auto px-3 pb-6">
              <AdminNav groups={groups} allOpen onNavigate={() => setDrawerOpen(false)} />
            </nav>
          </RadixDialog.Content>
        </RadixDialog.Portal>
      </RadixDialog.Root>
    </>
  );
}
