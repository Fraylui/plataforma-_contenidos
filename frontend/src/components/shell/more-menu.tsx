"use client";

import { useState } from "react";
import Link from "next/link";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Check, Desktop, List, Moon, Sun, type Icon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { MORE_LINKS } from "./shell-nav";
import { applyThemePref, currentThemePref, type ThemePref } from "./theme-pref";

export const THEME_OPTIONS: { value: ThemePref; label: string; icon: Icon }[] = [
  { value: "system", label: "Sistema", icon: Desktop },
  { value: "light", label: "Claro", icon: Sun },
  { value: "dark", label: "Oscuro", icon: Moon },
];

const ROW =
  "flex min-h-11 cursor-pointer items-center gap-3 rounded-xl px-3 text-[15px] text-foreground outline-none transition-colors data-[highlighted]:bg-canvas";

/**
 * Menú "Más" del pie del riel (escritorio), como el de Instagram o X:
 * Apariencia por visitante (Sistema / Claro / Oscuro) y los enlaces
 * legales que antes eran texto suelto al pie. Radix DropdownMenu aporta
 * roles de menú, flechas, Esc y foco de vuelta al botón.
 */
export function MoreMenu({ brandName, triggerClassName }: { brandName: string; triggerClassName: string }) {
  const [theme, setTheme] = useState<ThemePref>("system");
  const year = new Date().getFullYear();

  return (
    <DropdownMenu.Root onOpenChange={(open) => open && setTheme(currentThemePref())}>
      <DropdownMenu.Trigger aria-label="Más" title="Más" className={triggerClassName}>
        <List className="h-6 w-6 shrink-0" aria-hidden="true" />
        <span className="hidden xl:inline">Más</span>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          side="top"
          align="start"
          sideOffset={8}
          className="z-[60] w-64 rounded-2xl bg-surface p-2 shadow-2xl ring-1 ring-border/60 motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95"
        >
          <DropdownMenu.Label className="px-3 pt-1 pb-1 text-xs font-semibold text-muted">Apariencia</DropdownMenu.Label>
          <DropdownMenu.RadioGroup
            value={theme}
            onValueChange={(value) => {
              const pref = value as ThemePref;
              applyThemePref(pref);
              setTheme(pref);
            }}
          >
            {THEME_OPTIONS.map(({ value, label, icon: OptionIcon }) => (
              <DropdownMenu.RadioItem
                key={value}
                value={value}
                // Elegir apariencia no cierra el menú: se ve el cambio al instante y se puede probar otra.
                onSelect={(e) => e.preventDefault()}
                className={ROW}
              >
                <OptionIcon className="h-5 w-5 shrink-0 text-muted" aria-hidden="true" />
                <span className="flex-1">{label}</span>
                <DropdownMenu.ItemIndicator>
                  <Check className="h-4 w-4 text-accent" weight="bold" aria-hidden="true" />
                </DropdownMenu.ItemIndicator>
              </DropdownMenu.RadioItem>
            ))}
          </DropdownMenu.RadioGroup>
          <DropdownMenu.Separator className="mx-3 my-2 h-px bg-border/60" />
          {MORE_LINKS.map((link) => (
            <DropdownMenu.Item key={link.href} asChild className={cn(ROW, "font-medium")}>
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
