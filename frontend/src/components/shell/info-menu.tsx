"use client";

import Link from "next/link";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Info } from "@phosphor-icons/react";
import { MORE_LINKS } from "./shell-nav";

/**
 * "Información" del riel en el modo de solo íconos (1024–1279 px), donde
 * los enlaces legales no caben a la vista (desde 1280 px se ven al pie).
 * Ícono de información con su nombre — no las tres rayitas de "Más", que
 * no decían qué hacían. Radix DropdownMenu aporta roles de menú, flechas,
 * Esc y foco de vuelta al botón.
 */
export function InfoMenu({ brandName, triggerClassName, children }: { brandName: string; triggerClassName: string; children?: React.ReactNode }) {
  const year = new Date().getFullYear();

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger aria-label="Información" className={triggerClassName}>
        <Info className="h-6 w-6 shrink-0" aria-hidden="true" />
        {children}
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          side="right"
          align="end"
          sideOffset={8}
          className="z-[60] w-56 rounded-2xl bg-surface p-2 shadow-2xl ring-1 ring-border/60 motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95"
        >
          {MORE_LINKS.map((link) => (
            <DropdownMenu.Item
              key={link.href}
              asChild
              className="flex min-h-11 cursor-pointer items-center rounded-xl px-3 text-[15px] font-medium text-foreground outline-none transition-colors data-[highlighted]:bg-canvas"
            >
              <Link href={link.href}>{link.label}</Link>
            </DropdownMenu.Item>
          ))}
          <p className="px-3 pt-2 pb-1 text-xs text-muted">
            © {year} {brandName}
          </p>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
