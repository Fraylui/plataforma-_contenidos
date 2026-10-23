import type { ReactNode } from "react";
import type { CreateItem } from "@/lib/admin/nav";
import type { NavGroupData } from "../admin-nav";
import { AccountMenu } from "./account-menu";
import { CommandPaletteProvider, CommandPaletteTrigger } from "./command-palette";
import { CreateMenu } from "./create-menu";
import { MobileTabBar } from "./mobile-tab-bar";
import { Sidebar } from "./sidebar";

/**
 * Estructura del panel (Fase 2): menú lateral plegable, barra superior con
 * Buscar (Ctrl K), Crear y la cuenta; en celular, barra inferior y cajón.
 * Escritorio: cáscara fija al viewport (solo <main> desplaza). Celular: flujo normal.
 */
export function AdminShell({
  siteName,
  groups,
  navItems,
  createItems,
  sidebarCollapsed,
  account,
  children,
}: {
  siteName: string;
  groups: NavGroupData[];
  navItems: Array<{ href: string; label: string }>;
  createItems: CreateItem[];
  sidebarCollapsed: boolean;
  account: { firstName: string; lastName: string; email: string; roleLabel: string };
  children: ReactNode;
}) {
  return (
    <CommandPaletteProvider navItems={navItems} createItems={createItems}>
      <div className="flex min-h-dvh bg-background lg:fixed lg:inset-0 lg:min-h-0 lg:overflow-hidden">
        <Sidebar className="hidden lg:flex" siteName={siteName} groups={groups} initialCollapsed={sidebarCollapsed} />

        <div className="flex min-w-0 flex-1 flex-col lg:min-h-0">
          <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 bg-background/90 px-4 backdrop-blur sm:px-6">
            <span className="flex min-w-0 flex-1 items-center gap-2.5 lg:hidden">
              <span aria-hidden="true" className="flex size-9 shrink-0 items-center justify-center rounded-control bg-accent-fill text-base font-extrabold text-accent-foreground">
                {siteName.charAt(0).toUpperCase()}
              </span>
              <span className="truncate text-[15px] font-bold tracking-tight text-foreground">{siteName}</span>
            </span>
            <CommandPaletteTrigger className="hidden lg:flex" />
            <div className="ml-auto flex items-center gap-3">
              <CreateMenu items={createItems} className="hidden lg:inline-flex" />
              <AccountMenu {...account} />
            </div>
          </header>

          <main className="flex-1 px-4 pt-2 pb-[calc(5.5rem+env(safe-area-inset-bottom))] sm:px-6 lg:min-h-0 lg:overflow-y-auto lg:pb-8">
            {children}
          </main>
        </div>

        <MobileTabBar className="lg:hidden" groups={groups} createItems={createItems} />
      </div>
    </CommandPaletteProvider>
  );
}
