"use client";

import { useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { CaretRight } from "@phosphor-icons/react";
import { AdminNavLink } from "./admin-nav-link";
import type { AdminNavGroup } from "@/lib/admin/nav";

export interface NavItemData {
  href: string;
  label: string;
  icon: ReactNode;
  activeIcon: ReactNode;
}

export interface NavGroupData {
  group: AdminNavGroup;
  label: string | null;
  items: NavItemData[];
}

/**
 * Acordeón, no lista fija: con 16 ítems en 4 grupos, mostrarlos todos
 * desplegados a la vez obligaba a scrollear el sidebar entero (queja: "no
 * veo todos los módulos"). Mercado Libre, Alibaba y Strapi resuelven la
 * misma densidad así — solo el grupo activo empieza expandido, el resto
 * colapsa a su título. El grupo "principal" (sin encabezado) siempre es
 * visible, sin acordeón — son solo 2 ítems.
 */
export function AdminNav({
  groups,
  onNavigate,
  allOpen = false,
}: {
  groups: NavGroupData[];
  onNavigate?: () => void;
  /** Todos los grupos abiertos (el cajón del celular tiene espacio y su propio scroll: plegados dejaban un vacío). */
  allOpen?: boolean;
}) {
  const pathname = usePathname();
  const activeGroup = groups.find((g) =>
    g.items.some((item) => (item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href))),
  )?.group;

  const [openGroups, setOpenGroups] = useState<Set<AdminNavGroup>>(
    () => new Set(allOpen ? groups.map((g) => g.group) : activeGroup ? [activeGroup] : []),
  );

  function toggle(group: AdminNavGroup) {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(group)) next.delete(group);
      else next.add(group);
      return next;
    });
  }

  return (
    <>
      {groups.map(({ group, label, items }) => {
        if (!label) {
          return (
            <ul key={group} className="space-y-0.5">
              {items.map((item) => (
                <li key={item.href}>
                  <AdminNavLink href={item.href} label={item.label} icon={item.icon} activeIcon={item.activeIcon} onNavigate={onNavigate} />
                </li>
              ))}
            </ul>
          );
        }

        const isOpen = openGroups.has(group);
        return (
          <div key={group}>
            <button
              type="button"
              onClick={() => toggle(group)}
              aria-expanded={isOpen}
              className="flex w-full cursor-pointer items-center justify-between rounded-control px-3 py-1.5 text-xs font-semibold text-muted transition-colors hover:text-foreground"
            >
              {label}
              <CaretRight className={`h-3.5 w-3.5 transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`} aria-hidden="true" />
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.18, ease: [0.25, 0.1, 0.25, 1] }}
                  className="overflow-hidden"
                >
                  <ul className="space-y-0.5 pt-0.5">
                    {items.map((item) => (
                      <li key={item.href}>
                        <AdminNavLink href={item.href} label={item.label} icon={item.icon} activeIcon={item.activeIcon} onNavigate={onNavigate} />
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </>
  );
}
