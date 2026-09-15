"use client";

import { useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import { Command } from "cmdk";
import { Check, ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ComboboxOption {
  id: string;
  label: string;
}

/**
 * Select con búsqueda en vivo (cmdk) — reemplaza un `<select>` nativo
 * cuando la lista puede crecer lo suficiente como para que escribir sea más
 * rápido que desplazarse.
 */
export function Combobox({
  options,
  value,
  onSelect,
  placeholder = "Seleccionar…",
  searchPlaceholder = "Buscar…",
  emptyMessage = "Sin resultados.",
  disabled,
  className,
}: {
  options: ComboboxOption[];
  value: string | null;
  onSelect: (id: string | null) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  /** Por defecto ocupa el ancho completo, igual que formInputClass — pasar solo para achicarlo a propósito (p. ej. junto a otro control en una misma fila). */
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const selected = options.find((o) => o.id === value) ?? null;

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "mt-1 flex h-9 w-full min-w-[10rem] items-center justify-between gap-2 rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors",
            "focus-visible:border-accent disabled:opacity-60",
            className,
          )}
        >
          <span className={cn("truncate", !selected && "text-muted")}>{selected?.label ?? placeholder}</span>
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted" aria-hidden="true" />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={6}
          className="z-50 w-64 overflow-hidden rounded-lg border border-border bg-surface shadow-lg"
        >
          <Command shouldFilter={true} className="flex flex-col">
            <div className="flex items-center gap-2 border-b border-border px-2.5">
              <Search className="h-3.5 w-3.5 shrink-0 text-muted" aria-hidden="true" />
              <Command.Input
                name="comboboxSearch"
                value={query}
                onValueChange={setQuery}
                placeholder={searchPlaceholder}
                className="h-9 w-full bg-transparent text-sm text-foreground outline-none placeholder-muted"
              />
            </div>
            <Command.List className="max-h-56 overflow-y-auto p-1">
              <Command.Empty className="px-2.5 py-4 text-center text-sm text-muted">{emptyMessage}</Command.Empty>
              {options.map((option) => (
                <Command.Item
                  key={option.id}
                  value={option.label}
                  onSelect={() => {
                    onSelect(option.id === value ? null : option.id);
                    setOpen(false);
                    setQuery("");
                  }}
                  className="flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-sm text-foreground outline-none data-[selected=true]:bg-accent-soft data-[selected=true]:text-accent"
                >
                  <Check className={cn("h-3.5 w-3.5 shrink-0", option.id === value ? "opacity-100 text-accent" : "opacity-0")} aria-hidden="true" />
                  <span className="truncate">{option.label}</span>
                </Command.Item>
              ))}
            </Command.List>
          </Command>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
