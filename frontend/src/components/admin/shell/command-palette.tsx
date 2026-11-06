"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import * as RadixDialog from "@radix-ui/react-dialog";
import { Command } from "cmdk";
import { ArrowRight, MagnifyingGlass, Plus } from "@phosphor-icons/react";
import { isSearchShortcut } from "@/lib/search-shortcut";
import { cn } from "@/lib/utils";

interface PaletteItem {
  href: string;
  label: string;
}

const PaletteContext = createContext<{ open: () => void } | null>(null);

/** Abre la paleta desde cualquier botón del panel (barra superior, barra del celular). */
export function useCommandPalette() {
  const context = useContext(PaletteContext);
  if (!context) throw new Error("useCommandPalette fuera de CommandPaletteProvider");
  return context;
}

const ITEM =
  "flex cursor-pointer items-center gap-3 rounded-[8px] px-3 py-2.5 text-sm text-foreground outline-none " +
  "data-[selected=true]:bg-field [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-muted";

/**
 * Paleta de comandos (Ctrl/⌘+K, como Linear o Vercel): ir a cualquier
 * sección a la que la persona tiene acceso o crear contenido, con el teclado.
 * Recibe ya filtrado por permisos lo que el servidor permite ver.
 */
export function CommandPaletteProvider({
  navItems,
  createItems,
  children,
}: {
  navItems: PaletteItem[];
  createItems: PaletteItem[];
  children: ReactNode;
}) {
  const router = useRouter();
  const [isOpen, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const open = useCallback(() => setOpen(true), []);
  const context = useMemo(() => ({ open }), [open]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const { key, ctrlKey, metaKey, altKey, shiftKey, isComposing } = event;
      const target = event.target as HTMLElement | null;
      if (event.defaultPrevented || !isSearchShortcut({ key, ctrlKey, metaKey, altKey, shiftKey, isComposing, target })) return;
      event.preventDefault();
      setOpen(true);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function go(href: string) {
    setOpen(false);
    setQuery("");
    router.push(href);
  }

  return (
    <PaletteContext.Provider value={context}>
      {children}
      <RadixDialog.Root open={isOpen} onOpenChange={(next) => (setOpen(next), next || setQuery(""))}>
        <RadixDialog.Portal>
          <RadixDialog.Overlay className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=open]:fade-in-0" />
          <RadixDialog.Content
            aria-describedby={undefined}
            className="fixed top-[12vh] left-1/2 z-50 w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 overflow-hidden rounded-modal bg-surface shadow-overlay data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
          >
            <RadixDialog.Title className="sr-only">Buscar o ir a</RadixDialog.Title>
            <Command label="Buscar o ir a" loop>
              <div className="flex items-center gap-3 border-b border-field-border px-4">
                <MagnifyingGlass aria-hidden="true" className="size-5 shrink-0 text-muted" />
                <Command.Input
                  value={query}
                  onValueChange={setQuery}
                  placeholder="Busca una sección o algo para crear…"
                  className="h-14 w-full bg-transparent text-base text-foreground outline-none placeholder:text-muted"
                />
              </div>
              <Command.List className="max-h-[min(60vh,420px)] overflow-y-auto p-2">
                <Command.Empty className="px-3 py-8 text-center text-sm text-muted">Nada coincide con «{query}».</Command.Empty>
                {createItems.length > 0 && (
                  <Command.Group heading="Crear" className={GROUP}>
                    {createItems.map((item) => (
                      <Command.Item key={item.href} value={`Crear ${item.label}`} onSelect={() => go(item.href)} className={ITEM}>
                        <Plus weight="bold" aria-hidden="true" />
                        Crear {item.label.toLowerCase()}
                      </Command.Item>
                    ))}
                  </Command.Group>
                )}
                <Command.Group heading="Ir a" className={GROUP}>
                  {navItems.map((item) => (
                    <Command.Item key={item.href} value={item.label} onSelect={() => go(item.href)} className={ITEM}>
                      <ArrowRight aria-hidden="true" />
                      {item.label}
                    </Command.Item>
                  ))}
                </Command.Group>
              </Command.List>
              <p className="flex items-center gap-4 border-t border-field-border px-4 py-2.5 text-xs text-muted">
                <span>
                  <Kbd>↑</Kbd> <Kbd>↓</Kbd> moverse
                </span>
                <span>
                  <Kbd>Enter</Kbd> abrir
                </span>
                <span>
                  <Kbd>Esc</Kbd> cerrar
                </span>
              </p>
            </Command>
          </RadixDialog.Content>
        </RadixDialog.Portal>
      </RadixDialog.Root>
    </PaletteContext.Provider>
  );
}

const GROUP = "[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-muted";

function Kbd({ children }: { children: ReactNode }) {
  return <kbd className="rounded-[5px] bg-field px-1.5 py-0.5 font-sans text-[11px] font-medium text-foreground">{children}</kbd>;
}

/** Botón «Buscar o ir a… Ctrl K» de la barra superior. */
export function CommandPaletteTrigger({ className }: { className?: string }) {
  const { open } = useCommandPalette();
  return (
    <button
      type="button"
      onClick={open}
      className={cn(
        "flex h-10 w-full max-w-md cursor-pointer items-center gap-3 rounded-control border border-field-border bg-field px-3 text-sm text-muted outline-none transition-colors hover:bg-field-hover focus-visible:ring-[3px] focus-visible:ring-ring",
        className,
      )}
    >
      <MagnifyingGlass aria-hidden="true" className="size-4 shrink-0" />
      <span className="flex-1 truncate text-left">Buscar o ir a…</span>
      <Kbd>Ctrl K</Kbd>
    </button>
  );
}
