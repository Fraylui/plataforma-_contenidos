"use client";

import { useState } from "react";
import Link from "next/link";
import * as Dialog from "@radix-ui/react-dialog";
import { DotsThreeCircle, X } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { THEME_OPTIONS } from "./more-menu";
import { MORE_LINKS } from "./shell-nav";
import { applyThemePref, currentThemePref, type ThemePref } from "./theme-pref";

/**
 * Hoja inferior "Más" (celular): lo que antes vivía en el pie de página y en
 * el menú ☰, más la apariencia por visitante (igual que el menú "Más" del
 * riel). Radix Dialog aporta foco atrapado, Escape y aria-modal.
 */
export function MoreSheet({ triggerClassName }: { triggerClassName: string }) {
  const [theme, setTheme] = useState<ThemePref>("system");

  return (
    <Dialog.Root onOpenChange={(open) => open && setTheme(currentThemePref())}>
      <Dialog.Trigger className={triggerClassName}>
        <DotsThreeCircle className="h-6 w-6" aria-hidden="true" />
        <span className="text-[11px] font-medium">Más</span>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[60] bg-black/50" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed inset-x-0 bottom-0 z-[60] rounded-t-3xl border-t border-border bg-surface px-4 pt-3 pb-[calc(1.5rem+env(safe-area-inset-bottom))] shadow-2xl"
        >
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-border" aria-hidden="true" />
          <div className="flex items-center justify-between">
            <Dialog.Title className="text-base font-bold text-foreground">Más</Dialog.Title>
            <Dialog.Close
              aria-label="Cerrar"
              className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full text-muted hover:bg-canvas hover:text-foreground"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </Dialog.Close>
          </div>
          <fieldset className="mt-2">
            <legend className="mb-2 text-xs font-semibold text-muted">Apariencia</legend>
            {/* Control segmentado (como iOS): tres opciones a la vista, sin desplegable. */}
            <div className="grid grid-cols-3 gap-1 rounded-2xl bg-canvas p-1">
              {THEME_OPTIONS.map(({ value, label, icon: OptionIcon }) => (
                <label
                  key={value}
                  className={cn(
                    "flex min-h-11 cursor-pointer items-center justify-center gap-1.5 rounded-xl text-sm font-medium transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent",
                    theme === value ? "bg-surface font-bold text-foreground shadow-sm" : "text-muted",
                  )}
                >
                  <input
                    type="radio"
                    name="theme-pref"
                    value={value}
                    checked={theme === value}
                    onChange={() => {
                      applyThemePref(value);
                      setTheme(value);
                    }}
                    className="sr-only"
                  />
                  <OptionIcon className="h-4 w-4" aria-hidden="true" />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>
          <nav aria-label="Más enlaces" className="mt-3">
            <ul className="divide-y divide-border/60">
              {MORE_LINKS.map((link) => (
                <li key={link.href}>
                  <Dialog.Close asChild>
                    <Link
                      href={link.href}
                      className="flex min-h-12 items-center text-[15px] font-medium text-foreground hover:text-accent"
                    >
                      {link.label}
                    </Link>
                  </Dialog.Close>
                </li>
              ))}
            </ul>
          </nav>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
