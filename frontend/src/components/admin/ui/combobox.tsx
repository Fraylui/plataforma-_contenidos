"use client";

import { useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import { Command } from "cmdk";
import { Check, ChevronDown, Plus, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ComboboxOption {
  id: string;
  label: string;
}

/**
 * Select con búsqueda en vivo (cmdk) — reemplaza un `<select>` nativo
 * cuando la lista puede crecer lo suficiente como para que escribir sea más
 * rápido que desplazarse. No decide de dónde vienen las opciones (create-
 * on-demand, sin seeder) — eso lo sigue resolviendo quien lo use, ver
 * GeographyPicker.
 */
export function Combobox({
  options,
  value,
  onSelect,
  placeholder = "Seleccionar…",
  searchPlaceholder = "Buscar…",
  emptyMessage = "Sin resultados.",
  onCreateNew,
  createNewLabel,
  disabled,
}: {
  options: ComboboxOption[];
  value: string | null;
  onSelect: (id: string | null) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  onCreateNew?: (query: string) => void;
  createNewLabel?: (query: string) => string;
  disabled?: boolean;
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
            "flex h-9 min-w-[10rem] items-center justify-between gap-2 rounded-md border border-border bg-background px-2.5 text-sm text-foreground outline-none transition-colors",
            "focus-visible:border-accent disabled:opacity-50",
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
              {onCreateNew && query.trim() && (
                <Command.Item
                  value={`__create__${query}`}
                  onSelect={() => {
                    onCreateNew(query.trim());
                    setQuery("");
                  }}
                  className="flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-sm text-accent outline-none data-[selected=true]:bg-accent-soft"
                >
                  <Plus className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  {createNewLabel ? createNewLabel(query.trim()) : `Crear "${query.trim()}"`}
                </Command.Item>
              )}
            </Command.List>
          </Command>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
