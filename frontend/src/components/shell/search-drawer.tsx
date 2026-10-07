"use client";

import { useState, type ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "@phosphor-icons/react";
import { SearchBox } from "@/components/layout/search-box";

/**
 * Panel lateral de búsqueda del riel (escritorio), como "Buscar" en
 * Instagram: se desliza desde la izquierda con el campo ya enfocado y las
 * sugerencias en línea. Radix Dialog aporta foco atrapado, Esc y
 * aria-modal; al elegir un resultado se cierra solo. En celular la pestaña
 * Buscar sigue llevando a /buscar.
 */
export function SearchDrawer({
  categoryNames,
  trigger,
}: {
  categoryNames: Record<string, string>;
  /** Botón del riel que lo abre (lleva su propio estilo). */
  trigger: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[60] bg-black/20 motion-safe:animate-in motion-safe:fade-in" />
        <Dialog.Content
          aria-describedby={undefined}
          onOpenAutoFocus={(e) => {
            // El campo, no el botón de cerrar: se abre para escribir.
            e.preventDefault();
            (e.currentTarget as HTMLElement).querySelector<HTMLInputElement>("input")?.focus();
          }}
          className="fixed inset-y-0 left-0 z-[60] flex w-[min(24rem,100vw)] flex-col rounded-r-3xl bg-surface px-5 py-6 shadow-2xl motion-safe:animate-in motion-safe:slide-in-from-left"
        >
          <div className="mb-5 flex items-center justify-between">
            <Dialog.Title className="text-2xl font-bold tracking-tight text-foreground">Buscar</Dialog.Title>
            <Dialog.Close
              aria-label="Cerrar"
              className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full text-muted transition-colors hover:bg-canvas hover:text-foreground active:scale-95 motion-reduce:transform-none"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </Dialog.Close>
          </div>
          <div className="-mx-1 min-h-0 flex-1 overflow-y-auto px-1 no-scrollbar">
            <SearchBox variant="panel" categoryNames={categoryNames} onNavigate={() => setOpen(false)} />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
