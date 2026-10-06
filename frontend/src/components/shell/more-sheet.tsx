"use client";

import Link from "next/link";
import * as Dialog from "@radix-ui/react-dialog";
import { DotsThreeCircle, X } from "@phosphor-icons/react";
import { MORE_LINKS } from "./shell-nav";

/**
 * Hoja inferior "Más" (celular): lo que antes vivía en el pie de página y en
 * el menú ☰. Radix Dialog aporta foco atrapado, Escape y aria-modal.
 */
export function MoreSheet({ triggerClassName }: { triggerClassName: string }) {
  return (
    <Dialog.Root>
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
          <nav aria-label="Más enlaces" className="mt-2">
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
