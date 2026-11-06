"use client";

import Link from "next/link";
import { useState, type ReactElement } from "react";
import * as RadixDialog from "@radix-ui/react-dialog";
import {
  Article,
  Broadcast,
  CalendarDots,
  CaretRight,
  ClockCountdown,
  Images,
  MapPin,
  Plus,
  Television,
  type Icon,
} from "@phosphor-icons/react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/admin/ui";
import { Button } from "@/components/ui";
import type { CreateItem, CreateKind } from "@/lib/admin/nav";

const ICONS: Record<CreateKind, Icon> = {
  historia: ClockCountdown,
  publicacion: Article,
  lugar: MapPin,
  celebracion: CalendarDots,
  galeria: Images,
  serie: Television,
  "en-vivo": Broadcast,
};

/**
 * Botón «Crear»: abre «¿Qué quieres crear?» con un tipo por fila (ícono,
 * nombre y para qué sirve), para elegir sin saber de antemano cómo se llama
 * cada cosa. `children` cambia el botón que lo abre (la barra del celular
 * usa su propia pestaña).
 */
export function CreateMenu({
  items,
  className,
  children,
}: {
  items: CreateItem[];
  className?: string;
  children?: ReactElement;
}) {
  const [open, setOpen] = useState(false);
  if (items.length === 0) return null;
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <RadixDialog.Trigger asChild>
        {children ?? (
          <Button size="lg" icon={<Plus weight="bold" aria-hidden="true" />} className={className}>
            Crear
          </Button>
        )}
      </RadixDialog.Trigger>
      <DialogContent className="flex max-h-[85dvh] max-w-lg flex-col">
        <DialogTitle>¿Qué quieres crear?</DialogTitle>
        <DialogDescription>Elige un tipo. Puedes guardarlo como borrador y terminarlo después.</DialogDescription>
        <ul className="-mx-2 mt-4 min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain px-2 pb-1">
          {items.map((item) => {
            const ItemIcon = ICONS[item.kind];
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="group flex items-center gap-3 rounded-card p-3 outline-none transition-colors hover:bg-accent-soft/60 focus-visible:ring-[3px] focus-visible:ring-ring"
                >
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
                    <ItemIcon weight="duotone" className="size-6" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-foreground">{item.label}</span>
                    <span className="block text-xs text-muted">{item.description}</span>
                  </span>
                  <CaretRight className="size-4 shrink-0 text-muted transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                </Link>
              </li>
            );
          })}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
