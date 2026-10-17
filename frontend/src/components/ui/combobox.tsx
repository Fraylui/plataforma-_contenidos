"use client";

import { useId, useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import { Command } from "cmdk";
import { CaretUpDown, Check, MagnifyingGlass } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { fieldClass, markFieldControl } from "./field-styles";

export interface ComboboxOption {
  id: string;
  label: string;
}

/**
 * Select con búsqueda en vivo (cmdk) — reemplaza un `<select>` nativo
 * cuando la lista puede crecer lo suficiente como para que escribir sea más
 * rápido que desplazarse.
 */
export const Combobox = markFieldControl(function Combobox({
  options,
  value,
  onSelect,
  placeholder = "Seleccionar…",
  searchPlaceholder = "Buscar…",
  emptyMessage = "Sin resultados.",
  disabled,
  className,
  id,
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
}: {
  options: ComboboxOption[];
  value: string | null;
  onSelect: (id: string | null) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  /** Por defecto ocupa el ancho completo como el resto de campos — pasar solo para achicarlo a propósito (p. ej. junto a otro control en una misma fila). */
  className?: string;
  /** Los pone `Field` para conectar etiqueta, ayuda y error. */
  id?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean | "true" | "false";
}) {
  const [open, setOpen] = useState(false);
  const listId = useId();
  const [query, setQuery] = useState("");
  const selected = options.find((o) => o.id === value) ?? null;

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-controls={listId}
          id={id}
          disabled={disabled}
          aria-describedby={ariaDescribedBy}
          aria-invalid={ariaInvalid || undefined}
          className={cn(fieldClass, "flex min-w-[10rem] cursor-pointer items-center justify-between gap-2 text-left", className)}
        >
          <span className={cn("truncate", !selected && "text-muted")}>{selected?.label ?? placeholder}</span>
          <CaretUpDown className="size-4 shrink-0 text-muted" aria-hidden="true" />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={6}
          className="z-50 w-[max(16rem,var(--radix-popover-trigger-width))] overflow-hidden rounded-card bg-surface shadow-pop data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
        >
          <Command shouldFilter={true} className="flex flex-col">
            <div className="flex items-center gap-2 border-b border-field-border px-3">
              <MagnifyingGlass className="size-4 shrink-0 text-muted" aria-hidden="true" />
              <Command.Input
                name="comboboxSearch"
                value={query}
                onValueChange={setQuery}
                placeholder={searchPlaceholder}
                className="h-10 w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted"
              />
            </div>
            <Command.List id={listId} className="max-h-64 overflow-y-auto p-1.5">
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
                  className="flex cursor-pointer items-center gap-2 rounded-[8px] px-2.5 py-2 text-sm text-foreground outline-none transition-colors data-[selected=true]:bg-field"
                >
                  <Check weight="bold" className={cn("size-4 shrink-0", option.id === value ? "text-accent opacity-100" : "opacity-0")} aria-hidden="true" />
                  <span className="truncate">{option.label}</span>
                </Command.Item>
              ))}
            </Command.List>
          </Command>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
});
