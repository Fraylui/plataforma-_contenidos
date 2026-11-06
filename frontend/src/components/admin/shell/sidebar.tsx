"use client";

import { useState } from "react";
import Link from "next/link";
import { SidebarSimple } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { AdminNav, type NavGroupData } from "../admin-nav";
import { AdminNavLink } from "../admin-nav-link";
import { SIDEBAR_COOKIE } from "./constants";


/**
 * Menú lateral de escritorio: marca, secciones agrupadas y botón para
 * plegarlo a solo íconos (más espacio para escribir), recordado por cookie.
 */
export function Sidebar({
  siteName,
  groups,
  initialCollapsed,
  className,
}: {
  siteName: string;
  groups: NavGroupData[];
  initialCollapsed: boolean;
  className?: string;
}) {
  const [collapsed, setCollapsed] = useState(initialCollapsed);

  function toggle() {
    const next = !collapsed;
    setCollapsed(next);
    document.cookie = `${SIDEBAR_COOKIE}=${next ? "collapsed" : "expanded"}; path=/admin; max-age=31536000; samesite=lax`;
  }

  return (
    <aside
      className={cn(
        "flex h-full shrink-0 flex-col bg-surface shadow-card transition-[width] duration-200 ease-out",
        collapsed ? "w-[72px]" : "w-64",
        className,
      )}
    >
      <Link
        href="/admin"
        className={cn("flex h-16 shrink-0 items-center gap-2.5 outline-none focus-visible:ring-[3px] focus-visible:ring-ring", collapsed ? "justify-center" : "px-5")}
      >
        <span aria-hidden="true" className="flex size-9 shrink-0 items-center justify-center rounded-control bg-accent-fill text-base font-extrabold text-accent-foreground">
          {siteName.charAt(0).toUpperCase()}
        </span>
        <span className={collapsed ? "sr-only" : "truncate text-[15px] font-bold tracking-tight text-foreground"}>{siteName}</span>
      </Link>

      <nav aria-label="Menú del panel" className={cn("no-scrollbar min-h-0 flex-1 overflow-y-auto pb-4", collapsed ? "px-3" : "px-3 space-y-2")}>
        {collapsed ? (
          <ul className="space-y-1">
            {groups.flatMap((group) => group.items).map((item) => (
              <li key={item.href}>
                <AdminNavLink href={item.href} label={item.label} icon={item.icon} activeIcon={item.activeIcon} compact />
              </li>
            ))}
          </ul>
        ) : (
          <AdminNav groups={groups} />
        )}
      </nav>

      <div className={cn("shrink-0 border-t border-field-border p-3", collapsed && "flex justify-center")}>
        <button
          type="button"
          onClick={toggle}
          aria-expanded={!collapsed}
          aria-label={collapsed ? "Desplegar menú" : "Plegar menú"}
          title={collapsed ? "Desplegar menú" : "Plegar menú"}
          className={cn(
            "flex h-10 cursor-pointer items-center gap-3 rounded-control text-sm font-medium text-muted outline-none transition-colors hover:bg-field hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring",
            collapsed ? "w-10 justify-center" : "w-full px-3",
          )}
        >
          <SidebarSimple aria-hidden="true" className={cn("size-5 transition-transform", collapsed && "rotate-180")} />
          {!collapsed && <span>Plegar menú</span>}
        </button>
      </div>
    </aside>
  );
}
